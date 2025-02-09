use std::sync::Arc;

use axum::extract::FromRef;
use sqlx::PgPool;

use crate::{rate_limit::Buckets, subscriptions::Subscriptions};

#[derive(Debug, Clone, FromRef)]
pub struct Context {
    pool: Arc<PgPool>,
    subscriptions: Subscriptions,
    buckets: Buckets,

    _no_validation_arguments: (),
}

impl Context {
    pub fn new(pool: Arc<PgPool>) -> Self {
        Self {
            pool,
            subscriptions: Subscriptions::default(),
            buckets: Buckets::default(),

            _no_validation_arguments: (),
        }
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    pub fn subscriptions(&self) -> &Subscriptions {
        &self.subscriptions
    }

    pub fn buckets(&self) -> &Buckets {
        &self.buckets
    }
}
