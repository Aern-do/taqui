use axum::{
    extract::{Path, Query, State},
    routing::{get, patch},
    Extension, Json, Router,
};
use garde::Validate;
use serde::{Deserialize, Serialize};
use unicode_width::UnicodeWidthChar;
use uuid::Uuid;

use crate::{
    event::{DeleteMessageEvent, Event},
    models::{
        group::{self},
        message::{self, can_modify_message, Message, MessageQuery, NewMessage},
        User,
    },
    rate_limit::middleware::RateLimitLayer,
    subscriptions::Subscription,
    Context, Error, Garde,
};

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

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateMessageBody {
    #[garde(custom(sanitize_and_validate_message))]
    content: String,
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

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct EditMessageBody {
    #[garde(custom(sanitize_and_validate_message))]
    content: String,
}

pub async fn edit_message(
    Path((group_id, message_id)): Path<(Uuid, Uuid)>,
    Extension(user): Extension<User>,
    State(context): State<Context>,
    Garde(Json(body)): Garde<Json<EditMessageBody>>,
) -> Result<Json<Message>, Error> {
    let group = group::fetch_with_membership_check(user.id, group_id, context.pool()).await?;
    let message = message::fetch_with_group_check(message_id, &group, context.pool()).await?;

    if !can_modify_message(&user, &message) {
        return Err(Error::INSUFFICIENT_PERMISSIONS);
    }

    let content = sanitize(&body.content);
    let new_message = Message::edit(message.id, &content, context.pool()).await?;

    context.subscriptions().send(
        &Event::EditMessage(new_message.clone()),
        &Subscription::Group(group.id),
    );

    Ok(Json(new_message))
}

pub async fn delete_message(
    Path((group_id, message_id)): Path<(Uuid, Uuid)>,
    Extension(user): Extension<User>,
    State(context): State<Context>,
) -> Result<(), Error> {
    let group = group::fetch_with_membership_check(user.id, group_id, context.pool()).await?;
    let message = message::fetch_with_group_check(message_id, &group, context.pool()).await?;

    if !can_modify_message(&user, &message) {
        return Err(Error::INSUFFICIENT_PERMISSIONS);
    }

    Message::delete(message.id, context.pool()).await?;

    context.subscriptions().send(
        &Event::DeleteMessage(DeleteMessageEvent {
            group_id,
            message_id,
        }),
        &Subscription::Group(group.id),
    );

    Ok(())
}

pub fn create_router(context: Context) -> Router<Context> {
    Router::new()
        .route("/", get(get_messages).post(create_message))
        .route("/:id", patch(edit_message).delete(delete_message))
        .layer(
            RateLimitLayer::builder()
                .with_user("messages")
                .with_capacity(25)
                .with_refill_rate(1)
                .build(context.clone()),
        )
}
