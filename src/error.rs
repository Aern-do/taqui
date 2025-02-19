use std::borrow::Cow;

use argon2::password_hash;
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use garde::{Path, Report};
use serde::{Serialize, Serializer};

macro_rules! define_code {
    ($(#[$attr:meta])? $vis:vis enum $name:ident {
        $($variant:ident = ($code:literal, $status:ident) $(@ $message:literal)?),* $(,)?
    }) => {
        $(#[$attr])?
        $vis enum $name {
            $($variant),*
        }

        impl $name {
            pub fn code(&self) -> u32 {
                match self {
                    $(Self::$variant => $code),*
                }
            }

            pub fn status_code(&self) -> StatusCode {
                match self {
                    $(Self::$variant => StatusCode::$status),*
                }
            }
        }

        impl Serialize for $name {
            fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
            where
                S: Serializer,
            {
                serializer.serialize_u32(self.code())
            }
        }

        macro_rules! define_error_constants {
            () => {
                impl Error {
                    $(define_code!(@const_variant $variant = ($code, $status) $(@ $message)?);)*
                }
            }
        }
    };

    (@const_variant $variant:ident = ($code:literal, $status:ident) @ $message:literal) => {paste::paste!{
        pub const [<$variant:snake:upper>]: Error = Error::new_static($message, Code::$variant);
    }};

    (@const_variant $variant:ident = ($code:literal, $status:ident)) => {}
}

macro_rules! impl_from {
    ($($error:path);* $(;)?) => {
        $(impl From<$error> for Error {
            fn from(error: $error) -> Self {
                tracing::error!("{error}");

                Error::INTERNAL
            }
        })*
    };
}

define_code!(
    #[derive(Debug, Clone, Copy)]
    pub enum Code {
        RateLimited = (3000, TOO_MANY_REQUESTS) @ "you are being rate limited",
        Internal = (4000, INTERNAL_SERVER_ERROR) @ "internal server error",

        UnknownUser = (5000, NOT_FOUND) @ "unknown user",
        UnknownInvite = (5001, NOT_FOUND) @ "unknown invite",
        UnknownGroup = (5002, NOT_FOUND) @ "unknown group",
        UserAlreadyExists = (5003, CONFLICT) @ "user with this username already exists",
        Validation = (5004, UNPROCESSABLE_ENTITY) @ "validation error",
        AlreadyMember = (5005, CONFLICT) @ "already a member",
        UnknownMessage = (5006, NOT_FOUND) @ "unknown message",

        InvalidToken = (6000, UNAUTHORIZED) @ "invalid token",
        InsufficientPermissions = (6001, UNAUTHORIZED) @ "insufficient permissions",
        InvalidCredentials = (6002, UNAUTHORIZED) @ "invalid credentials"
    }
);

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    path: Path,
    message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(untagged)]
pub enum Details {
    Message(Cow<'static, str>),
    Report(Vec<Entry>),
}

impl Details {
    pub const fn new_static(message: &'static str) -> Self {
        Self::Message(Cow::Borrowed(message))
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Error {
    code: Code,
    details: Details,
}

impl Error {
    pub const fn new_static(message: &'static str, code: Code) -> Self {
        Error {
            code,
            details: Details::new_static(message),
        }
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        (self.code.status_code(), Json(self)).into_response()
    }
}

impl From<Report> for Error {
    fn from(report: Report) -> Self {
        let entries = report
            .into_inner()
            .into_iter()
            .map(|(path, error)| Entry {
                path,
                // garde hasn't exposed message, so there's no way to avoid allocation :(
                message: error.to_string(),
            })
            .collect::<Vec<_>>();

        Error {
            code: Code::Validation,
            details: Details::Report(entries),
        }
    }
}

define_error_constants!();
impl_from! {
    sqlx::Error;
    password_hash::Error;
    jsonwebtoken::errors::Error;
}
