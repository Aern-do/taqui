pub mod key_extractor;
pub mod middleware;

use dashmap::DashMap;
use std::{net::SocketAddr, sync::Arc, time::Instant};
use uuid::Uuid;

pub use key_extractor::{ExtractKey, FnExtractor, UserExtractor};
pub use middleware::{RateLimitLayer, RateLimitLayerBuilder, RateLimitService};

#[derive(Debug, Clone, Copy, Default)]
pub struct BucketConfiguration {
    pub capacity: u64,
    pub refill_rate: u64,
}

#[derive(Debug, Clone, Copy)]
pub struct Bucket {
    tokens: u64,
    last_acquire: Instant,

    config: BucketConfiguration,
}

impl Bucket {
    pub fn new(config: BucketConfiguration) -> Self {
        Self {
            tokens: config.capacity,
            last_acquire: Instant::now(),

            config,
        }
    }

    pub fn acquire(&mut self) -> bool {
        let elapsed = self.last_acquire.elapsed();
        self.last_acquire = Instant::now();

        let refill = self.config.refill_rate * elapsed.as_secs();
        self.tokens += refill.clamp(0, self.config.capacity);

        if self.tokens <= 0 {
            false
        } else {
            self.tokens -= 1;
            true
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Component {
    Uuid(Uuid),
    SocketAddr(SocketAddr)
}

#[derive(Debug, Clone, Copy, Eq, Hash, PartialEq)]
pub struct Key(pub &'static str, pub Component);

#[derive(Debug, Default, Clone)]
pub struct Buckets {
    buckets: Arc<DashMap<Key, Bucket>>,
}

impl Buckets {
    pub fn acquire(&self, key: Key, config: BucketConfiguration) -> bool {
        let mut bucket = self
            .buckets
            .entry(key.clone())
            .or_insert(Bucket::new(config));

        bucket.acquire()
    }
}
