FROM node:18-slim AS frontend-builder
ARG VITE_SITE_KEY
ENV VITE_SITE_KEY=$VITE_SITE_KEY

WORKDIR /app/client
COPY client .
RUN yarn install
RUN yarn run build

FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS backend-builder 
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

COPY . .
ENV SQLX_OFFLINE=true
RUN cargo build --release

FROM debian:bookworm-slim AS runtime
WORKDIR /app
COPY --from=backend-builder /app/target/release/taqui ./taqui
COPY --from=frontend-builder /app/client/dist ./dist

ENV CLIENT_DIR=dist
ENTRYPOINT ["/app/taqui"]