use std::net::SocketAddr;

use argon2::{
    password_hash::{Encoding, SaltString},
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
};
use axum::{
    extract::{ConnectInfo, Request, State},
    middleware::{from_fn_with_state, Next},
    response::IntoResponse,
    routing::{get, post},
    Extension, Json, Router,
};
use axum_extra::extract::{cookie::Cookie, CookieJar};
use garde::Validate;
use jsonwebtoken::{
    decode, encode, errors::ErrorKind as JwtErrorKind, get_current_timestamp, Algorithm,
    DecodingKey, EncodingKey, Header, Validation,
};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use time::{Duration, OffsetDateTime};
use tokio::task::{self};
use uuid::Uuid;

use crate::{
    models::User,
    rate_limit::{Component, Key, RateLimitLayer},
    Context, Error, Garde, RouterExt,
};

const PRIVATE_KEY: &[u8] = include_bytes!("../../jwt_private.pem");
const PUBLIC_KEY: &[u8] = include_bytes!("../../jwt_public.pem");
const TOKEN_EXPIRATION: u64 = 24 * 60 * 60;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Claims {
    sub: Uuid,
    exp: u64,
    iat: u64,
}

fn hash_password(password: String) -> Result<String, Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    let hash = argon2.hash_password(password.as_bytes(), &salt)?;
    Ok(hash.to_string())
}

fn verify_password(password: &str, password_hash: &str) -> Result<bool, Error> {
    let argon2 = Argon2::default();
    let password_hash = PasswordHash::parse(&password_hash, Encoding::B64)?;

    Ok(argon2
        .verify_password(password.as_bytes(), &password_hash)
        .is_ok())
}

fn generate_token(user: &User) -> Result<String, Error> {
    Ok(encode(
        &Header::new(Algorithm::ES256),
        &Claims {
            sub: user.id,
            exp: get_current_timestamp() + TOKEN_EXPIRATION,
            iat: get_current_timestamp(),
        },
        &EncodingKey::from_ec_pem(PRIVATE_KEY).expect("invalid encoding key"),
    )?)
}

fn verify_token(token: &str) -> Result<Claims, Error> {
    let token_data = match decode::<Claims>(
        token,
        &DecodingKey::from_ec_pem(PUBLIC_KEY).expect("invalid public key"),
        &Validation::new(Algorithm::ES256),
    ) {
        Ok(claims) => claims,
        Err(err)
            if matches!(
                err.kind(),
                JwtErrorKind::ExpiredSignature | JwtErrorKind::InvalidSignature
            ) =>
        {
            return Err(Error::INVALID_TOKEN)
        }
        Err(err) => return Err(err)?,
    };

    Ok(token_data.claims)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterBody {
    username: String,
    password: String,
}

pub async fn register(
    State(ctx): State<Context>,
    Json(body): Json<RegisterBody>,
) -> Result<Json<User>, Error> {
    let password_hash = task::spawn_blocking(|| hash_password(body.password))
        .await
        .expect("failed to join blocking hash task")?;

    let user = User::create(body.username, password_hash, ctx.pool()).await?;
    Ok(Json(user))
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct LoginBody {
    #[garde(length(min = 4, max = 16), pattern(r"^[a-zA-Z0-9_]+$"))]
    username: String,
    #[garde(length(min = 4))]
    password: String,
}

pub async fn login(
    State(ctx): State<Context>,
    jar: CookieJar,
    Garde(Json(body)): Garde<Json<LoginBody>>,
) -> Result<(CookieJar, Json<User>), Error> {
    let user = User::fetch_by_username(&body.username, ctx.pool())
        .await?
        .ok_or(Error::INVALID_CREDENTIALS)?;

    if !verify_password(&body.password, &user.password_hash)? {
        return Err(Error::INVALID_CREDENTIALS);
    };

    let token = generate_token(&user)?;

    let expiration = OffsetDateTime::now_utc();
    let expiration = expiration + Duration::seconds(TOKEN_EXPIRATION as i64);

    let cookie = Cookie::build(("token", token))
        .path("/")
        .expires(expiration)
        .build();
    let jar = jar.add(cookie);

    Ok((jar, Json(user)))
}

pub async fn logout(jar: CookieJar) -> CookieJar {
    jar.remove("token")
}

pub async fn me(Extension(user): Extension<User>) -> Json<User> {
    Json(user)
}

pub async fn middleware(
    State(ctx): State<Context>,
    jar: CookieJar,
    mut request: Request,
    next: Next,
) -> Result<impl IntoResponse, Error> {
    let token = jar.get("token").ok_or(Error::INVALID_TOKEN)?;
    let token = token.value();

    let claims = verify_token(token)?;
    let user = User::fetch(claims.sub, ctx.pool())
        .await?
        .ok_or(Error::INVALID_TOKEN)?;

    request.extensions_mut().insert(user);

    Ok(next.run(request).await)
}

pub fn create_router(context: Context) -> Router<Context> {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/logout", post(logout))
        .route_with_layer(
            "/me",
            get(me),
            from_fn_with_state(context.clone(), middleware),
        )
        .layer(
            RateLimitLayer::builder()
                .with_fn(|ConnectInfo(addr): ConnectInfo<SocketAddr>| {
                    Key("auth", Component::SocketAddr(addr))
                })
                .with_capacity(2)
                .with_refill_rate(1)
                .build(context),
        )
}
