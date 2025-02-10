pub mod auth;
pub mod groups;
pub mod invites;
pub mod messages;
pub mod users;

use crate::Context;
use axum::Router;

pub fn create_router(context: Context) -> Router<Context> {
    Router::new()
        .nest("/auth", auth::create_router(context.clone()))
        .nest("/groups", groups::create_router(context.clone()))
        .nest("/users", users::create_router(context.clone()))
        .nest("/invites", invites::create_code_router(context.clone()))
}
