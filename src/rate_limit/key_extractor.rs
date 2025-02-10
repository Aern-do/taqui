use std::marker::PhantomData;

use crate::{models::User, Context};
use axum::{
    async_trait,
    extract::FromRequestParts,
    http::request::Parts,
    response::{IntoResponse, Response},
    Extension, RequestPartsExt,
};

use super::{Component, Key};

#[async_trait]
pub trait ExtractKey {
    type Error: IntoResponse;

    async fn extract(&self, parts: &mut Parts, context: &Context) -> Result<Key, Self::Error>;
}

#[derive(Debug, Clone)]
pub struct UserExtractor(pub &'static str);

#[async_trait]
impl ExtractKey for UserExtractor {
    type Error = <Extension<User> as FromRequestParts<Context>>::Rejection;

    async fn extract(&self, parts: &mut Parts, context: &Context) -> Result<Key, Self::Error> {
        let user = parts
            .extract_with_state::<Extension<User>, _>(context)
            .await?;

        Ok(Key(self.0, Component::Uuid(user.id)))
    }
}

#[derive(Debug)]
pub struct FnExtractor<Extractor, Args> {
    extractor: Extractor,

    _args: PhantomData<Args>,
}

impl<Extractor, Args> FnExtractor<Extractor, Args> {
    pub fn new(extractor: Extractor) -> Self {
        Self {
            extractor,
            _args: PhantomData,
        }
    }
}

impl<Extractor, Args> Clone for FnExtractor<Extractor, Args>
where
    Extractor: Clone,
{
    fn clone(&self) -> Self {
        Self {
            extractor: self.extractor.clone(),
            _args: PhantomData,
        }
    }
}

macro_rules! implement_extractor {
    ($($generic:ident),*) => {paste::paste!{
        #[derive(Debug, Clone)]
        pub enum [<FnExtractorError $($generic)*>]<$($generic),*> {
            $($generic($generic)),*
        }

        impl<$($generic: IntoResponse),*> IntoResponse for [<FnExtractorError $($generic)*>]<$($generic),*> {
            fn into_response(self) -> Response {
                match self {
                    $(Self::$generic([<$generic:lower>]) => [<$generic:lower>].into_response()),*
                }
            }
        }

        #[async_trait]
        impl<Extractor, $($generic),*> ExtractKey for FnExtractor<Extractor, ($($generic),*, )>
        where
            Extractor: Fn($($generic),*) -> Key + Sync,
            $($generic: FromRequestParts<Context> + Send + Sync + 'static),*
        {
            type Error = [<FnExtractorError $($generic)*>]<$($generic::Rejection),*>;

            async fn extract(&self, parts: &mut Parts, context: &Context) -> Result<Key, Self::Error> {
                $(
                    let [<$generic:lower>] = parts.extract_with_state::<$generic, _>(context)
                        .await
                        .map_err(Self::Error::$generic)?;
                )*

                let key = (self.extractor)($([<$generic:lower>]),*);
                Ok(key)
            }
        }
    }};
}

implement_extractor!(T1);
implement_extractor!(T1, T2);
implement_extractor!(T1, T2, T3);
implement_extractor!(T1, T2, T3, T4);
implement_extractor!(T1, T2, T3, T4, T5);
