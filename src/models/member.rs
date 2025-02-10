use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::{Executor, FromRow, Postgres};
use uuid::Uuid;

use crate::Error;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Member {
    pub user_id: Uuid,
    pub group_id: Uuid,
    pub joined_at: NaiveDateTime,
}

impl Member {
    pub async fn create<'e, E: Executor<'e, Database = Postgres>>(
        user_id: Uuid,
        group_id: Uuid,
        executor: E,
    ) -> Result<Member, Error> {
        let member = sqlx::query_as!(
            Member,
            "INSERT INTO members(user_id, group_id) VALUES ($1, $2) RETURNING *",
            user_id,
            group_id
        )
        .fetch_one(executor)
        .await?;

        Ok(member)
    }
}
