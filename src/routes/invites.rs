use axum::{
    extract::{Path, State},
    middleware::from_fn_with_state,
    routing::{get, post},
    Extension, Json, Router,
};
use garde::Validate;
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    models::{group::fetch_with_membership_check, invite::Invite, Group, User},
    rate_limit::RateLimitLayer,
    Context, Error,
};

use super::auth;

pub async fn get_invites(
    State(context): State<Context>,
    Extension(user): Extension<User>,
    Path(group_id): Path<Uuid>,
) -> Result<Json<Vec<Invite>>, Error> {
    let group = fetch_with_membership_check(user.id, group_id, context.pool()).await?;
    let invites = Invite::fetch_all(group.id, context.pool()).await?;

    Ok(Json(invites))
}

pub async fn create_invite(
    State(context): State<Context>,
    Path(group_id): Path<Uuid>,
    Extension(user): Extension<User>,
) -> Result<Json<Invite>, Error> {
    let group = fetch_with_membership_check(user.id, group_id, context.pool()).await?;
    if user.id != group.owner_id {
        return Err(Error::INSUFFICIENT_PERMISSIONS);
    }

    let invite = Invite::create(group.id, user.id, context.pool()).await?;

    Ok(Json(invite))
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct InviteParams {
    #[garde(length(min = 8, max = 8), pattern(r"^[a-zA-Z0-9]{8}$"))]
    code: String,
}

pub async fn accept_invite(
    State(context): State<Context>,
    Extension(user): Extension<User>,
    Path(InviteParams { code }): Path<InviteParams>,
) -> Result<(), Error> {
    let invite = Invite::fetch_by_code(&code, context.pool())
        .await?
        .ok_or(Error::UNKNOWN_INVITE)?;

    if Group::has_member(user.id, invite.group_id, context.pool()).await? {
        return Err(Error::ALREADY_MEMBER);
    }

    invite.accept(user.id, context.pool()).await?;

    Ok(())
}

pub fn create_router(context: Context) -> Router<Context> {
    Router::new()
        .route("/", get(get_invites).post(create_invite))
        .layer(
            RateLimitLayer::builder()
                .with_user("invites")
                .with_capacity(5)
                .with_refill_rate(1)
                .build(context),
        )
}

pub fn create_code_router(context: Context) -> Router<Context> {
    let auth_middleware = from_fn_with_state(context.clone(), auth::middleware);

    Router::new()
        .route("/:code", post(accept_invite))
        .layer(
            RateLimitLayer::builder()
                .with_user("invites")
                .with_capacity(5)
                .with_refill_rate(1)
                .build(context),
        )
        .layer(auth_middleware)
}
