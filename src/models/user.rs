use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, PgPool};
use uuid::Uuid;

use crate::Error;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: Uuid,

    pub username: String,
    #[serde(skip)]
    pub password_hash: String,
    pub created_at: NaiveDateTime,
}

impl User {
    pub async fn fetch(id: Uuid, pool: &PgPool) -> Result<Option<User>, Error> {
        let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id=$1", id)
            .fetch_optional(pool)
            .await?;

        Ok(user)
    }

    pub async fn fetch_by_username(username: &str, pool: &PgPool) -> Result<Option<User>, Error> {
        let user = sqlx::query_as!(User, "SELECT * FROM users WHERE username=$1", username)
            .fetch_optional(pool)
            .await?;

        Ok(user)
    }

    pub async fn create(
        username: String,
        password_hash: String,
        pool: &PgPool,
    ) -> Result<User, Error> {
        let user_exists = sqlx::query!("SELECT * FROM users WHERE username=$1", username)
            .fetch_optional(pool)
            .await?
            .is_some();

        if user_exists {
            return Err(Error::USER_ALREADY_EXISTS);
        }

        let user = sqlx::query_as!(
            User,
            "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *",
            username,
            password_hash
        )
        .fetch_one(pool)
        .await?;

        Ok(user)
    }
}
