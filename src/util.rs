use std::{convert::Infallible, time::Duration};

use axum::{
    async_trait,
    extract::{FromRef, FromRequest, FromRequestParts, Request},
    http::request::Parts,
    response::{
        sse::{Event, KeepAlive},
        IntoResponse, Response, Sse,
    },
    routing::{MethodRouter, Route},
    Router,
};
use axum_valid::{HasValidate, ValidationRejection};
use garde::{Report, Validate};
use tokio_stream::{wrappers::BroadcastStream, Stream, StreamExt};
use tower_layer::Layer;
use tower_service::Service;

use crate::{
    subscriptions::{Subscription, Subscriptions},
    Error,
};

pub trait RouterExt<S>
where
    S: Clone + Send + Sync + 'static,
{
    fn route_with_layer<L>(self, path: &str, router: MethodRouter<S>, layer: L) -> Self
    where
        L: Layer<Route> + Clone + Send + 'static,
        L::Service: Service<Request> + Clone + Send + 'static,
        <L::Service as Service<Request>>::Response: IntoResponse + 'static,
        <L::Service as Service<Request>>::Error: Into<Infallible> + 'static,
        <L::Service as Service<Request>>::Future: Send + 'static;
}

impl<S> RouterExt<S> for Router<S>
where
    S: Clone + Send + Sync + 'static,
{
    fn route_with_layer<L>(self, path: &str, router: MethodRouter<S>, layer: L) -> Self
    where
        L: Layer<Route> + Clone + Send + 'static,
        L::Service: Service<Request> + Clone + Send + 'static,
        <L::Service as Service<Request>>::Response: IntoResponse + 'static,
        <L::Service as Service<Request>>::Error: Into<Infallible> + 'static,
        <L::Service as Service<Request>>::Future: Send + 'static,
    {
        let router = Router::new().route(path, router).layer(layer);

        self.merge(router)
    }
}

#[derive(Debug, Clone)]
pub enum MappedRejection<E> {
    Mapped(Error),
    Inner(E),
}

impl<E> From<ValidationRejection<Report, E>> for MappedRejection<E> {
    fn from(rejection: ValidationRejection<Report, E>) -> Self {
        match rejection {
            ValidationRejection::Valid(report) => MappedRejection::Mapped(report.into()),
            ValidationRejection::Inner(error) => MappedRejection::Inner(error),
        }
    }
}

impl<E: IntoResponse> IntoResponse for MappedRejection<E> {
    fn into_response(self) -> Response {
        match self {
            MappedRejection::Mapped(error) => error.into_response(),
            MappedRejection::Inner(error) => error.into_response(),
        }
    }
}

#[derive(Debug, Clone, Copy, Default)]
pub struct Garde<E>(pub E);

#[async_trait]
impl<S, E, C> FromRequest<S> for Garde<E>
where
    S: Send + Sync,
    C: Send + Sync + FromRef<S>,
    E: HasValidate + FromRequest<S>,
    <E as HasValidate>::Validate: Validate<Context = C>,
{
    type Rejection = MappedRejection<<E as FromRequest<S>>::Rejection>;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        match axum_valid::Garde::from_request(req, state).await {
            Ok(inner) => Ok(Self(inner.0)),
            Err(rejection) => Err(MappedRejection::from(rejection)),
        }
    }
}

#[async_trait]
impl<S, E, C> FromRequestParts<S> for Garde<E>
where
    S: Send + Sync,
    C: Send + Sync + FromRef<S>,
    E: HasValidate + FromRequestParts<S>,
    <E as HasValidate>::Validate: Validate<Context = C>,
{
    type Rejection = MappedRejection<<E as FromRequestParts<S>>::Rejection>;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        match axum_valid::Garde::from_request_parts(parts, state).await {
            Ok(inner) => Ok(Self(inner.0)),
            Err(rejection) => Err(MappedRejection::from(rejection)),
        }
    }
}

pub fn sse_to_subscription(
    buckets: &Subscriptions,
    bucket: &Subscription,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let rx = buckets.subscribe(bucket);

    let stream = BroadcastStream::new(rx)
        .filter_map(|result| result.ok())
        .map(Ok);

    Sse::new(stream).keep_alive(
        KeepAlive::new()
            .interval(Duration::from_secs(30))
            .text("keep-alive"),
    )
}
