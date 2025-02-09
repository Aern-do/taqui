pub mod context;
pub mod error;
pub mod event;
pub mod models;
pub mod rate_limit;
pub mod routes;
pub mod subscriptions;
pub mod util;

pub use context::Context;
pub use error::{Code, Details, Error};
pub use util::{Garde, RouterExt};

use axum::Router;
use sqlx::postgres::PgPoolOptions;
use std::{env::var, net::SocketAddr, sync::Arc};
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    let _ = dotenvy::dotenv();

    let database_url = var("DATABASE_URL")?;
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    sqlx::migrate!().run(&pool).await?;

    let context = Context::new(Arc::new(pool));

    let listener = TcpListener::bind("127.0.0.1:3000").await?;
    let app = Router::new()
        .nest("/api", routes::create_router(context.clone()))
        .with_state(context);

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;

    Ok(())
}
