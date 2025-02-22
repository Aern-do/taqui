use std::sync::Arc;
use axum::response::sse::{self};
use dashmap::DashMap;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::event::Event;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Subscription {
    Group(Uuid),
}

#[derive(Debug, Default, Clone)]
pub struct Subscriptions {
    subscriptions: Arc<DashMap<Subscription, broadcast::Sender<sse::Event>>>,
}

impl Subscriptions {
    const EVENT_NAME: &str = "taqui";

    pub fn send(&self, event: &Event, subscription: &Subscription) {
        if let Some(tx) = self.subscriptions.get(subscription) {
            let event = serde_json::to_string(event).expect("failed to seralize event");
            let event = sse::Event::default().event(Self::EVENT_NAME).data(event);

            let _ = tx.send(event);
        }
    }

    pub fn subscribe(&self, subscription: &Subscription) -> broadcast::Receiver<sse::Event> {
        if let Some(tx) = self.subscriptions.get(&subscription) {
            return tx.subscribe();
        }

        let (tx, rx) = broadcast::channel(128);
        self.subscriptions.insert(*subscription, tx);
        rx
    }
}
