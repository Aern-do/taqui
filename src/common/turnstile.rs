use std::sync::Arc;

use axum::http::HeaderMap;
use constcat::concat;
use reqwest::{header::CONTENT_TYPE, Client};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::Error;

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum VerifyError {
    MissingInputSecret,
    InvalidInputSecret,
    MissingInputResponse,
    InvalidInputResponse,
    BadRequest,
    TimeoutOrDuplicate,
    InternalError,
}

#[derive(Debug, Default, Clone, Serialize)]
pub struct VerifyTokenRequest {
    pub response: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub remoteip: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub idempotency_key: Option<Uuid>,
}

#[derive(Debug, Default, Clone, Serialize)]
pub struct RawVerifyTokenRequest<'c> {
    pub secret: &'c str,
    pub response: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub remoteip: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub idempotency_key: Option<Uuid>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RawVerifyTokenResponse {
    pub success: bool,
    pub challenge_ts: Option<String>,
    pub hostname: Option<String>,
    #[serde(rename = "error-codes")]
    pub error_codes: Vec<VerifyError>,
    pub cdata: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct VerifyTokenResponse {
    pub challenge_ts: String,
    pub hostname: String,
    pub cdata: String,
}

#[derive(Debug, Clone)]
pub struct TurnstileClient {
    client: Client,
    secret: Arc<str>,
}

impl TurnstileClient {
    const BASE_URL: &str = "https://challenges.cloudflare.com/turnstile/v0";

    pub fn new(secret: impl Into<Arc<str>>) -> Self {
        let mut headers = HeaderMap::new();
        headers.insert(
            CONTENT_TYPE,
            "application/json"
                .parse()
                .expect("failed to parse header value"),
        );

        let client = Client::builder()
            .default_headers(headers)
            .build()
            .expect("failed to build client");

        Self {
            client,
            secret: secret.into(),
        }
    }

    pub async fn verify(&self, request: VerifyTokenRequest) -> Result<VerifyTokenResponse, Error> {
        let raw = RawVerifyTokenRequest {
            secret: &self.secret,
            response: request.response,
            remoteip: request.remoteip,
            idempotency_key: request.idempotency_key,
        };

        let raw = self
            .client
            .post(concat!(TurnstileClient::BASE_URL, "/siteverify"))
            .json(&raw)
            .send()
            .await?
            .json::<RawVerifyTokenResponse>()
            .await?;

        if raw.success {
            Ok(VerifyTokenResponse {
                challenge_ts: raw.challenge_ts.unwrap(),
                hostname: raw.hostname.unwrap(),
                cdata: raw.cdata.unwrap(),
            })
        } else {
            Err(Error::CAPTCHA_FAILED)
        }
    }
}
