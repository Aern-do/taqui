use serde::Serialize;

use crate::models::message::Message;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "event", content = "data")]
#[serde(rename_all = "camelCase")]
pub enum Event {
    NewMessage(Message),
}
