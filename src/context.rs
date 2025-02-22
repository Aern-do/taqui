use std::sync::Arc;

use axum::extract::FromRef;
use sqlx::PgPool;

use crate::{
    common::{turnstile::TurnstileClient, Indicators, Subscriptions},
    rate_limit::Buckets,
};

#[derive(Debug, Clone)]
pub struct Keys {
    public_key: Arc<[u8]>,
    private_key: Arc<[u8]>,
}

impl Keys {
    pub fn new(public_key: Vec<u8>, private_key: Vec<u8>) -> Self {
        Self {
            public_key: public_key.into(),
            private_key: private_key.into(),
        }
    }

    pub fn public_key(&self) -> &[u8] {
        &self.public_key
    }

    pub fn private_key(&self) -> &[u8] {
        &self.private_key
    }
}

#[derive(Debug, Clone, FromRef)]
pub struct Context {
    pool: Arc<PgPool>,
    keys: Keys,

    subscriptions: Subscriptions,
    buckets: Buckets,
    indicators: Indicators,
    turnstile: TurnstileClient,

    _args: (),
}

impl Context {
    pub fn new(pool: Arc<PgPool>, keys: Keys, turnstile_secret: impl Into<Arc<str>>) -> Self {
        Self {
            pool,
            keys,
            subscriptions: Subscriptions::default(),
            buckets: Buckets::default(),
            indicators: Indicators::default(),
            turnstile: TurnstileClient::new(turnstile_secret),

            _args: (),
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

    pub fn indicators(&self) -> &Indicators {
        &self.indicators
    }

    pub fn turnstile(&self) -> &TurnstileClient {
        &self.turnstile
    }

    pub fn keys(&self) -> &Keys {
        &self.keys
    }
}
