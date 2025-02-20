use serde::Serialize;
use uuid::Uuid;

use crate::models::{message::Message, User};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteMessageEvent {
    pub group_id: Uuid,
    pub message_id: Uuid,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StartTypingEvent {
    pub group_id: Uuid,
    pub user: User
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EndTypingEvent {
    pub group_id: Uuid,
    pub user: User
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "event", content = "data")]
#[serde(rename_all = "camelCase")]
pub enum Event {
    NewMessage(Message),
    EditMessage(Message),
    DeleteMessage(DeleteMessageEvent),
    
    StartTyping(StartTypingEvent),
    EndTyping(EndTypingEvent)
}
