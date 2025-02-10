use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{models::Member, Error};

use super::User;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Group {
    pub id: Uuid,

    pub name: String,
    pub owner_id: Uuid,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewGroup {
    pub name: String,
    pub owner_id: Uuid,
}

impl Group {
    pub async fn create(new_group: &NewGroup, pool: &PgPool) -> Result<(Group, Member), Error> {
        let group = sqlx::query_as!(
            Group,
            "INSERT INTO groups(name, owner_id) VALUES ($1, $2) RETURNING *",
            new_group.name,
            new_group.owner_id
        )
        .fetch_one(pool)
        .await?;

        let member = Member::create(new_group.owner_id, group.id, pool).await?;

        Ok((group, member))
    }

    pub async fn delete(group_id: Uuid, pool: &PgPool) -> Result<(), Error> {
        sqlx::query!("DELETE FROM groups WHERE id=$1", group_id)
            .execute(pool)
            .await?;

        Ok(())
    }

    pub async fn fetch(group_id: Uuid, pool: &PgPool) -> Result<Option<Group>, Error> {
        let group = sqlx::query_as!(Group, "SELECT * FROM groups WHERE id=$1", group_id)
            .fetch_optional(pool)
            .await?;

        Ok(group)
    }

    pub async fn fetch_all(user_id: Uuid, pool: &PgPool) -> Result<Vec<Group>, Error> {
        let groups = sqlx::query_as!(
            Group,
            "SELECT g.* FROM members m INNER JOIN groups g ON m.user_id = $1 AND g.id = m.group_id",
            user_id
        )
        .fetch_all(pool)
        .await?;
        Ok(groups)
    }

    pub async fn fetch_members(group_id: Uuid, pool: &PgPool) -> Result<Vec<User>, Error> {
        let members = sqlx::query_as!(
            User,
            "SELECT users.* FROM users
                JOIN members ON user_id = users.id
            WHERE group_id = $1",
            group_id
        )
        .fetch_all(pool)
        .await?;

        Ok(members)
    }

    pub async fn has_member(user_id: Uuid, group_id: Uuid, pool: &PgPool) -> Result<bool, Error> {
        let exists = sqlx::query_scalar!(
            "SELECT EXISTS(SELECT 1 FROM members WHERE user_id = $1 AND group_id = $2)",
            user_id,
            group_id
        )
        .fetch_one(pool)
        .await?
        .unwrap_or(false);

        Ok(exists)
    }
}

pub async fn fetch_with_membership_check(
    user_id: Uuid,
    group_id: Uuid,
    pool: &PgPool,
) -> Result<Group, Error> {
    let group = Group::fetch(group_id, pool)
        .await?
        .ok_or(Error::UNKNOWN_GROUP)?;

    if !Group::has_member(user_id, group_id, pool).await? {
        return Err(Error::INSUFFICIENT_PERMISSIONS);
    }

    Ok(group)
}
