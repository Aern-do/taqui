use axum::{
    extract::{Path, State},
    middleware::from_fn_with_state,
    routing::get,
    Json, Router,
};
use uuid::Uuid;

use crate::{models::User, rate_limit::RateLimitLayer, Code, Context, Error};

use super::auth;

pub async fn get_user(
    State(ctx): State<Context>,
    Path(id): Path<Uuid>,
) -> Result<Json<User>, Error> {
    let user = User::fetch(id, ctx.pool())
        .await?
        .ok_or(Error::new_static("unknown user", Code::UnknownUser))?;

    Ok(Json(user))
}

pub fn create_router(context: Context) -> Router<Context> {
    let auth_middleware = from_fn_with_state(context.clone(), auth::middleware);

    Router::new()
        .route("/:id", get(get_user))
        .layer(
            RateLimitLayer::builder()
                .with_user("users")
                .with_capacity(25)
                .with_refill_rate(1)
                .build(context),
        )
        .layer(auth_middleware)
}
