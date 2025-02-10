use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Extension, Json, Router,
};
use garde::Validate;
use serde::{Deserialize, Serialize};
use unicode_width::UnicodeWidthChar;
use uuid::Uuid;

use crate::{
    event::Event,
    models::{
        group::{self},
        message::{Message, MessageQuery, NewMessage},
        User,
    },
    rate_limit::middleware::RateLimitLayer,
    subscriptions::Subscription,
    Context, Error, Garde,
};

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateMessageBody {
    #[garde(custom(sanitize_and_validate_message))]
    content: String,
}

fn sanitize(content: &str) -> String {
    content
        .chars()
        .map(|c| match c.width_cjk() {
            Some(0) => ' ',
            _ => c,
        })
        .collect::<String>()
        .trim()
        .to_string()
}

fn sanitize_and_validate_message(content: &str, _: &()) -> garde::Result {
    let sanitized = sanitize(content);

    if sanitized.is_empty() {
        return Err(garde::Error::new("message cannot be empty"));
    }

    if sanitized.len() > 1000 {
        return Err(garde::Error::new(
            "message is too long (max 1000 characters)",
        ));
    }

    Ok(())
}

pub async fn create_message(
    State(context): State<Context>,
    Extension(user): Extension<User>,
    Path(group_id): Path<Uuid>,
    Garde(Json(body)): Garde<Json<CreateMessageBody>>,
) -> Result<Json<Message>, Error> {
    let group = group::fetch_with_membership_check(user.id, group_id, context.pool()).await?;

    let message = Message::create(
        &NewMessage {
            user_id: user.id,
            group_id: group.id,
            content: sanitize(&body.content),
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
    Extension(user): Extension<User>,
    Garde(Query(body)): Garde<Query<GetMessagesParams>>,
) -> Result<Json<Vec<Message>>, Error> {
    let group = group::fetch_with_membership_check(user.id, group_id, context.pool()).await?;

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
}
