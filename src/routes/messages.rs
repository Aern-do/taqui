use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Extension, Json, Router,
};
use garde::Validate;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    event::Event,
    models::{
        message::{Message, MessageQuery, NewMessage},
        Group, User,
    },
    rate_limit::middleware::RateLimitLayer,
    subscriptions::Subscription,
    Context, Error, Garde,
};

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateMessageBody {
    #[garde(length(min = 1, max = 1000))]
    content: String,
}

pub async fn create_message(
    State(context): State<Context>,
    Extension(user): Extension<User>,
    Path(group_id): Path<Uuid>,
    Garde(Json(body)): Garde<Json<CreateMessageBody>>,
) -> Result<Json<Message>, Error> {
    let group = Group::fetch(group_id, context.pool())
        .await?
        .ok_or(Error::UNKNOWN_GROUP)?;

    let message = Message::create(
        &NewMessage {
            user_id: user.id,
            group_id: group.id,
            content: body.content,
        },
        context.pool(),
    )
    .await?;

    context.subscriptions().send(
        &Event::NewMessage(message.clone()),
        &Subscription::Group(group.id),
    );

    Ok(Json(message))
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct GetMessagesParams {
    #[garde(range(min = 10, max = 50))]
    limit: i64,

    #[garde(skip)]
    before: Option<Uuid>,
}

pub async fn get_messages(
    State(context): State<Context>,
    Path(group_id): Path<Uuid>,
    Garde(Query(body)): Garde<Query<GetMessagesParams>>,
) -> Result<Json<Vec<Message>>, Error> {
    let group = Group::fetch(group_id, context.pool())
        .await?
        .ok_or(Error::UNKNOWN_GROUP)?;

    let messages = Message::fetch_all(
        &MessageQuery {
            limit: body.limit,
            before: body.before,
            group_id: group.id,
        },
        context.pool(),
    )
    .await?;

    Ok(Json(messages))
}

pub fn create_router(context: Context) -> Router<Context> {
    Router::new()
        .route("/", post(create_message))
        .route("/", get(get_messages))
        .layer(
            RateLimitLayer::builder()
                .with_user("messages")
                .with_capacity(25)
                .with_refill_rate(1)
                .build(context.clone()),
        )
        .with_state(context)
}
