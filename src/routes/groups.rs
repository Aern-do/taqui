use super::{auth, invites, messages};
use crate::{
    models::{group, Group, NewGroup, User},
    rate_limit::RateLimitLayer,
    subscriptions::Subscription,
    util::sse_to_subscription,
    Context, Error, Garde,
};
use axum::{
    extract::{Path, State},
    middleware::from_fn_with_state,
    response::{sse::Event, Sse},
    routing::{get, post},
    Extension, Json, Router,
};
use garde::Validate;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use tokio_stream::Stream;
use uuid::Uuid;

pub async fn get_groups(
    State(context): State<Context>,
    Extension(user): Extension<User>,
) -> Result<Json<Vec<Group>>, Error> {
    let groups = Group::fetch_all(user.id, context.pool()).await?;

    Ok(Json(groups))
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CreateGroupBody {
    #[garde(length(min = 4, max = 16), pattern(r"^[a-zA-Z0-9_]+$"))]
    pub name: String,
}

pub async fn create_group(
    State(context): State<Context>,
    Extension(user): Extension<User>,
    Garde(Json(body)): Garde<Json<CreateGroupBody>>,
) -> Result<Json<Group>, Error> {
    let (group, ..) = Group::create(
        &NewGroup {
            name: body.name,
            owner_id: user.id,
        },
        context.pool(),
    )
    .await?;

    Ok(Json(group))
}

pub async fn get_group(
    State(context): State<Context>,
    Extension(user): Extension<User>,
    Path(group_id): Path<Uuid>,
) -> Result<Json<Group>, Error> {
    let group = group::fetch_with_membership_check(user.id, group_id, context.pool()).await?;

    Ok(Json(group))
}

pub async fn delete_group(
    State(context): State<Context>,
    Extension(user): Extension<User>,
    Path(group_id): Path<Uuid>,
) -> Result<(), Error> {
    let group = group::fetch_with_membership_check(user.id, group_id, context.pool()).await?;
    Group::delete(group.id, context.pool()).await?;

    Ok(())
}

pub async fn get_members(
    State(context): State<Context>,
    Extension(user): Extension<User>,
    Path(group_id): Path<Uuid>,
) -> Result<Json<Vec<User>>, Error> {
    let group = group::fetch_with_membership_check(user.id, group_id, context.pool()).await?;
    let members = Group::fetch_members(group.id, context.pool()).await?;

    Ok(Json(members))
}

pub async fn updates(
    State(context): State<Context>,
    Extension(user): Extension<User>,
    Path(group_id): Path<Uuid>,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, Error> {
    let group = group::fetch_with_membership_check(user.id, group_id, context.pool()).await?;

    Ok(sse_to_subscription(
        context.subscriptions(),
        &Subscription::Group(group.id),
    ))
}

pub async fn start_typing(
    State(context): State<Context>,
    Extension(user): Extension<User>,
    Path(group_id): Path<Uuid>,
) -> Result<(), Error> {
    let group = group::fetch_with_membership_check(user.id, group_id, context.pool()).await?;

    context
        .indicators()
        .start_typing(&user, &group, context.subscriptions());

    Ok(())
}

pub fn create_router(context: Context) -> Router<Context> {
    let auth_middleware = from_fn_with_state(context.clone(), auth::middleware);

    let groups_routes = Router::new()
        .route("/", get(get_groups).post(create_group))
        .route("/:group_id", get(get_group).delete(delete_group))
        .route("/:group_id/updates", get(updates))
        .route("/:group_id/members", get(get_members))
        .route("/:group_id/typing", post(start_typing))
        .layer(
            RateLimitLayer::builder()
                .with_user("groups")
                .with_capacity(10)
                .with_refill_rate(1)
                .build(context.clone()),
        );

    Router::new()
        .merge(groups_routes)
        .nest(
            "/:group_id/messages",
            messages::create_router(context.clone()),
        )
        .nest("/:group_id/invites", invites::create_router(context))
        .layer(auth_middleware)
}
