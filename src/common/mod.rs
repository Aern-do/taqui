pub mod garde;
pub mod subscriptions;
pub mod typing;
pub mod turnstile;

use axum::{
    extract::Request,
    response::{
        sse::{Event, KeepAlive},
        IntoResponse, Sse,
    },
    routing::{MethodRouter, Route},
    Router,
};
use futures_util::Stream;
use std::{convert::Infallible, time::Duration};
use tokio_stream::{wrappers::BroadcastStream, StreamExt};
use tower_layer::Layer;
use tower_service::Service;

pub use garde::{Garde, MappedRejection};
pub use subscriptions::{Subscription, Subscriptions};
pub use typing::{Indicator, IndicatorKey, Indicators};

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
