use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    time::Duration,
};

use dashmap::DashMap;
use tokio::{
    select,
    sync::broadcast::{self, Sender},
    time::{sleep, Instant},
};
use uuid::Uuid;

use crate::{
    event::{EndTypingEvent, Event, StartTypingEvent},
    models::{Group, User},
    subscriptions::{Subscription, Subscriptions},
};

#[derive(Debug, Clone, Copy)]
pub enum TypingEvent {
    Start,
    End,
}

#[derive(Debug)]
pub struct Indicator {
    tx: Sender<TypingEvent>,
    is_active: Arc<AtomicBool>,
}

impl Indicator {
    const DEFAULT_INDICATOR_TIMEOUT: Duration = Duration::from_secs(7);

    pub fn new() -> Self {
        let (tx, ..) = broadcast::channel(128);

        Self {
            tx,
            is_active: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn start_typing(&mut self, user: User, group: Group, subscriptions: Subscriptions) {
        if self.is_active.load(Ordering::Relaxed) {
            self.tx
                .send(TypingEvent::Start)
                .expect("failed to send typing event");
            return;
        }

        let mut rx = self.tx.subscribe();
        let is_active = self.is_active.clone();

        tokio::spawn(async move {
            let timer = sleep(Indicator::DEFAULT_INDICATOR_TIMEOUT);
            tokio::pin!(timer);

            subscriptions.send(
                &Event::StartTyping(StartTypingEvent {
                    group_id: group.id,
                    user: user.clone(),
                }),
                &Subscription::Group(group.id),
            );

            loop {
                is_active.store(true, Ordering::Relaxed);

                select! {
                    _ = &mut timer => {
                        break
                    }
                    Ok(event) = rx.recv() => match event {
                        TypingEvent::Start => {
                            subscriptions.send(
                                &Event::StartTyping(StartTypingEvent {
                                    group_id: group.id,
                                    user: user.clone(),
                                }),
                                &Subscription::Group(group.id),
                            );

                            timer.as_mut().reset(Instant::now() + Indicator::DEFAULT_INDICATOR_TIMEOUT)
                        },
                        TypingEvent::End => break
                    }
                }
            }

            is_active.store(false, Ordering::Relaxed);

            subscriptions.send(
                &Event::EndTyping(EndTypingEvent {
                    group_id: group.id,
                    user: user.clone(),
                }),
                &Subscription::Group(group.id),
            );
        });
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct IndicatorKey {
    pub user_id: Uuid,
    pub group_id: Uuid,
}

#[derive(Debug, Default, Clone)]
pub struct Indicators {
    indicators: Arc<DashMap<IndicatorKey, Indicator>>,
}

impl Indicators {
    pub fn start_typing(&self, user: &User, group: &Group, subscriptions: &Subscriptions) {
        let key = IndicatorKey {
            user_id: user.id,
            group_id: group.id,
        };

        let mut indicator = self
            .indicators
            .entry(key)
            .or_insert_with(|| Indicator::new());

        indicator.start_typing(user.clone(), group.clone(), subscriptions.clone());
    }

    pub fn end_typing(&self, user: &User, group: &Group) {
        let key = IndicatorKey {
            user_id: user.id,
            group_id: group.id,
        };

        if let Some(indicator) = self.indicators.get(&key) {
            let _ = indicator.tx.send(TypingEvent::End);
        }
    }
}
