use std::task::{self, Poll};
use axum::{
    body::Body,
    http::Request,
    response::{IntoResponse, Response},
};
use futures_util::future::BoxFuture;
use tower_layer::Layer;
use tower_service::Service;

use crate::{Context, Error};

use super::{
    key_extractor::{ExtractKey, FnExtractor, UserExtractor},
    BucketConfiguration,
};

#[derive(Debug, Clone)]
pub struct RateLimitLayer<Extractor = ()> {
    pub extractor: Extractor,
    pub context: Context,

    pub config: BucketConfiguration,
}

impl RateLimitLayer<()> {
    pub fn builder() -> RateLimitLayerBuilder {
        RateLimitLayerBuilder::default()
    }
}

impl<Inner, Extractor> Layer<Inner> for RateLimitLayer<Extractor>
where
    Extractor: Clone,
{
    type Service = RateLimitService<Inner, Extractor>;

    fn layer(&self, inner: Inner) -> Self::Service {
        RateLimitService {
            inner,
            extractor: self.extractor.clone(),
            context: self.context.clone(),
            config: self.config,
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct RateLimitLayerBuilder<Extractor = ()> {
    pub extractor: Extractor,
    pub config: BucketConfiguration,
}

impl RateLimitLayerBuilder<()> {
    pub fn with_fn<Extractor, Args>(
        self,
        extractor: Extractor,
    ) -> RateLimitLayerBuilder<FnExtractor<Extractor, Args>> {
        RateLimitLayerBuilder {
            extractor: FnExtractor::new(extractor),
            config: self.config,
        }
    }

    pub fn with_user(self, key: &'static str) -> RateLimitLayerBuilder<UserExtractor> {
        RateLimitLayerBuilder {
            extractor: UserExtractor(key),
            config: self.config,
        }
    }

    pub fn with_custom<Extractor>(self, extractor: Extractor) -> RateLimitLayerBuilder<Extractor> {
        RateLimitLayerBuilder {
            extractor,
            config: self.config,
        }
    }
}

impl<Extractor> RateLimitLayerBuilder<Extractor> {
    pub fn with_capacity(mut self, capacity: u64) -> Self {
        self.config.capacity = capacity;
        self
    }

    pub fn with_refill_rate(mut self, refill_rate: u64) -> Self {
        self.config.refill_rate = refill_rate;
        self
    }

    pub fn build(self, context: Context) -> RateLimitLayer<Extractor> {
        RateLimitLayer {
            extractor: self.extractor,
            context,
            config: self.config,
        }
    }
}

#[derive(Debug, Clone)]
pub struct RateLimitService<Inner, Extractor> {
    inner: Inner,
    extractor: Extractor,
    context: Context,

    config: BucketConfiguration,
}

impl<Inner, Extractor> Service<Request<Body>> for RateLimitService<Inner, Extractor>
where
    Inner: Service<Request<Body>, Response = Response> + Clone + Send + 'static,
    Inner::Future: Send + 'static,
    Inner::Error: Send,

    Extractor: ExtractKey + Clone + Send + 'static,
    Extractor::Error: Send,
{
    type Response = Inner::Response;
    type Error = Inner::Error;

    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&mut self, cx: &mut task::Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, request: Request<Body>) -> Self::Future {
        let clone = self.inner.clone();
        let mut inner = std::mem::replace(&mut self.inner, clone);

        let extractor = self.extractor.clone();
        let context = self.context.clone();
        let config = self.config.clone();

        Box::pin(async move {
            let (mut parts, body) = request.into_parts();

            let key = match extractor.extract(&mut parts, &context).await {
                Ok(key) => key,
                Err(err) => return Ok(err.into_response()),
            };

            let avaliable = context.buckets().acquire(key, config);
            if !avaliable {
                let error = Error::RATE_LIMITED;
                return Ok(error.into_response());
            }

            let request = Request::from_parts(parts, body);

            inner.call(request).await
        })
    }
}
