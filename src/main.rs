pub mod context;
pub mod error;
pub mod event;
pub mod models;
pub mod rate_limit;
pub mod routes;
pub mod subscriptions;
pub mod util;

pub use context::Context;
use context::Keys;
pub use error::{Code, Details, Error};
use tower_http::{cors::CorsLayer, services::{ServeDir, ServeFile}, trace::TraceLayer};
pub use util::{Garde, RouterExt};

use axum::Router;
use sqlx::postgres::PgPoolOptions;
use std::{env::var, fs, net::SocketAddr, path::{Path, PathBuf}, sync::Arc};
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    let _ = dotenvy::dotenv();

    let jwt_path = PathBuf::from(var("JWT_PATH")?);
    let jwt_public = fs::read(jwt_path.join("jwt_public.pem"))?;
    let jwt_private = fs::read(jwt_path.join("jwt_private.pem"))?;

    let database_url = var("DATABASE_URL")?;
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    sqlx::migrate!().run(&pool).await?;

    let context = Context::new(Arc::new(pool), Keys::new(jwt_public, jwt_private));

    let addr = "0.0.0.0:3000";
    let listener = TcpListener::bind(addr).await?;

    let mut app = Router::new()
        .nest("/api", routes::create_router(context.clone()))
        .with_state(context);

    if let Ok(client_dir) = var("CLIENT_DIR") {
        let client_path = Path::new(&client_dir);
        let index_path = client_path.join("index.html");

        app = app.nest_service(
            "/",
            ServeDir::new(client_path).fallback(ServeFile::new(index_path)),
        );
    }

    app = app
        .layer(CorsLayer::very_permissive())
        .layer(TraceLayer::new_for_http());

    tracing::info!("Server started successfully on {}", addr);

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;

    Ok(())
}
