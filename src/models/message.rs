use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgExecutor, PgPool};
use uuid::Uuid;

use crate::Error;

use super::{Group, User};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub id: Uuid,

    pub user_id: Uuid,
    pub group_id: Uuid,
    pub content: String,

    pub created_at: NaiveDateTime,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Default, Clone)]
pub struct MessageQuery {
    pub limit: i64,
    pub group_id: Uuid,
    pub before: Option<Uuid>,
}

impl MessageQuery {
    const MAX_MESSAGES_PER_QUERY: i64 = 100;

    pub fn new(group_id: Uuid) -> Self {
        Self {
            group_id,
            before: None,
            limit: 50,
        }
    }

    pub fn before(mut self, id: Uuid) -> Self {
        self.before = Some(id);
        self
    }

    pub fn limit(mut self, limit: i64) -> Self {
        self.limit = limit.min(Self::MAX_MESSAGES_PER_QUERY);
        self
    }
}

#[derive(Debug, Clone)]
pub struct NewMessage {
    pub user_id: Uuid,
    pub group_id: Uuid,
    pub content: String,
}

impl Message {
    pub async fn create(new_message: &NewMessage, pool: &PgPool) -> Result<Message, Error> {
        let message = sqlx::query_as!(
            Message,
            "INSERT INTO messages(user_id, group_id, content) VALUES ($1, $2, $3) RETURNING *",
            new_message.user_id,
            new_message.group_id,
            new_message.content
        )
        .fetch_one(pool)
        .await?;

        Ok(message)
    }

    pub async fn edit(id: Uuid, content: &str, pool: &PgPool) -> Result<Message, Error> {
        let message = sqlx::query_as!(
            Message,
            "UPDATE messages SET content=$1 WHERE id=$2 RETURNING *",
            content,
            id
        )
        .fetch_one(pool)
        .await?;

        Ok(message)
    }

    pub async fn fetch<'e, E: PgExecutor<'e>>(
        message_id: Uuid,
        executor: E,
    ) -> Result<Option<Message>, Error> {
        let message = sqlx::query_as!(Message, "SELECT * FROM messages WHERE id=$1", message_id)
            .fetch_optional(executor)
            .await?;

        Ok(message)
    }

    pub async fn fetch_all(query: &MessageQuery, pool: &PgPool) -> Result<Vec<Message>, Error> {
        let messages = sqlx::query_as!(
            Message,
            r#"SELECT * FROM (
                SELECT * FROM messages
                WHERE group_id = $1
                    AND ($2::uuid IS NULL OR created_at < (SELECT created_at FROM messages WHERE id = $2))
                ORDER BY
                    CASE WHEN $2::uuid IS NULL THEN created_at END DESC,
                    CASE WHEN $2::uuid IS NOT NULL THEN created_at END ASC
                LIMIT $3
            ) AS sub
            ORDER BY created_at ASC"#,
            query.group_id,
            query.before,
            query.limit
        )
        .fetch_all(pool)
        .await?;

        Ok(messages)
    }

    pub async fn delete(message_id: Uuid, pool: &PgPool) -> Result<(), Error> {
        sqlx::query!("DELETE FROM messages WHERE id=$1", message_id)
            .execute(pool)
            .await?;

        Ok(())
    }
}

pub async fn fetch_with_group_check(
    id: Uuid,
    group: &Group,
    pool: &PgPool,
) -> Result<Message, Error> {
    let message = Message::fetch(id, pool)
        .await?
        .ok_or(Error::UNKNOWN_MESSAGE)?;

    if message.group_id != group.id {
        return Err(Error::INSUFFICIENT_PERMISSIONS);
    }

    Ok(message)
}

pub fn can_modify_message(user: &User, message: &Message) -> bool {
    user.id == message.user_id
}
