use chrono::NaiveDateTime;
use serde::Serialize;
use sqlx::{prelude::FromRow, PgPool};
use uuid::Uuid;

use crate::Error;

use super::Member;

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Invite {
    pub id: Uuid,
    pub code: String,
    pub uses: i32,

    pub user_id: Uuid,
    pub group_id: Uuid,
    pub created_at: NaiveDateTime,
}

impl Invite {
    pub async fn fetch_by_code(invite_code: &str, pool: &PgPool) -> Result<Option<Invite>, Error> {
        let invite = sqlx::query_as!(Invite, "SELECT * FROM invites WHERE code=$1", invite_code)
            .fetch_optional(pool)
            .await?;

        Ok(invite)
    }

    pub async fn fetch_all(group_id: Uuid, pool: &PgPool) -> Result<Vec<Invite>, Error> {
        let invites = sqlx::query_as!(Invite, "SELECT * FROM invites WHERE group_id=$1", group_id)
            .fetch_all(pool)
            .await?;

        Ok(invites)
    }

    pub async fn create(group_id: Uuid, user_id: Uuid, pool: &PgPool) -> Result<Invite, Error> {
        let invite = sqlx::query_as!(
            Invite,
            "INSERT INTO invites(group_id, user_id) VALUES ($1, $2) RETURNING *",
            group_id,
            user_id
        )
        .fetch_one(pool)
        .await?;

        Ok(invite)
    }

    pub async fn accept(&self, user_id: Uuid, pool: &PgPool) -> Result<(), Error> {
        let mut transaction = pool.begin().await?;

        sqlx::query!("UPDATE invites SET uses = uses + 1 WHERE id = $1", self.id)
            .execute(&mut *transaction)
            .await?;
        Member::create(user_id, self.group_id, &mut *transaction).await?;

        transaction.commit().await?;

        Ok(())
    }
}
