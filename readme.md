# Metaspace

Metaspace is a browser based 2D collaboration app. The monorepo is in [`metaverse/meta`](metaverse/meta) and uses Bun workspaces with Turborepo.

## Architecture

- `metaverse/meta/apps/frontend`: React, Vite, Excalidraw and LiveKit UI.
- `metaverse/meta/apps/http`: Express API for authentication, spaces, catalog and LiveKit tokens.
- `metaverse/meta/apps/ws`: authenticated realtime rooms, avatar movement, chat, reactions, canvas sync and `@ai` responses.
- `metaverse/meta/packages/db`: shared Prisma schema, generated client and singleton database client.
- `tests`: Bun test integration suite for the local HTTP and WebSocket services.

Chat history and Excalidraw scene state are stored in PostgreSQL. Current positions and room membership stay in WebSocket server memory. Audio/video use LiveKit.

## Prerequisites and configuration

Install [Bun](https://bun.sh/) 1.2 or newer and Docker Desktop. Metaspace supports two local development modes: a full Docker stack and Bun hot reload backed by Docker infrastructure. Both use PostgreSQL on `localhost:5432` and LiveKit on `ws://localhost:7880`.

Set `ADMIN_SIGNUP_SECRET` to allow administrator account creation; admin signup is disabled unless that separate secret is configured. Set `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and the browser reachable `LIVEKIT_URL` for the HTTP API. `OPENAI_API_KEY` is optional; it is required for `@ai` in WebSocket chat. The AI service uses the official OpenAI SDK and `gpt-5-mini` by default; override with `OPENAI_MODEL` if needed. Never put server secrets in a `VITE_` variable.

Copy `metaverse/meta/.env.example` to `metaverse/meta/.env`. Set `POSTGRES_PASSWORD` and `JWT_PASSWORD`; this file is consumed by Docker Compose only. The application `.env.example` files are for Bun processes on the host: replace `LOCAL_POSTGRES_PASSWORD` in `apps/http/.env`, `apps/ws/.env`, and `packages/db/.env` with the same value used in the Compose file. HTTP and WS must share `JWT_PASSWORD`. The HTTP file must also contain the local LiveKit key, secret, and `LIVEKIT_URL=ws://localhost:7880`. The frontend needs `VITE_BACKEND_URL=http://localhost:3000` and `VITE_WS_URL=ws://localhost:3001` in `apps/frontend/.env.local`.

## Install, develop and build

From `metaverse/meta`:

```bash
bun install
bun run dev
bun run build
bun run lint
bun run test
```

`bun run dev` starts the frontend, HTTP API and WebSocket server through Turbo. It never starts PostgreSQL or LiveKit. Vite uses port `5173` and fails instead of silently selecting another port. To run one service, use `bun run --filter frontend dev`, `bun run --filter http dev`, or `bun run --filter @metaspace/ws dev`.

Prisma client generation runs as part of the shared database package build. To generate it directly, run `bun run db:generate` from `metaverse/meta`.

## Tests

The integration suite lives in `tests` and expects HTTP at `http://localhost:3000` and WebSocket at `ws://localhost:3001`. Start both services with a reachable database before running `bun run test` from `metaverse/meta`; the suite creates users and spaces in that database. Set `ADMIN_SIGNUP_SECRET` in the HTTP service and test process to exercise administrator signup.

## Local Bun mode

Use this while changing TypeScript or React code. Docker supplies infrastructure and Bun supplies application hot reload.

```bash
cd metaverse/meta
cp .env.example .env
# Set POSTGRES_PASSWORD and JWT_PASSWORD in .env.
docker compose up -d postgres livekit
docker compose run --rm migrate

# Copy each app environment template and replace LOCAL_POSTGRES_PASSWORD.
bun run dev
```

Open the frontend at `http://localhost:5173`. The local HTTP API is `http://localhost:3000`, WebSocket is `ws://localhost:3001`, PostgreSQL is `localhost:5432`, and LiveKit is `ws://localhost:7880`.

## Full Docker mode

From `metaverse/meta`, copy `.env.example` to `.env`, set `POSTGRES_PASSWORD` and `JWT_PASSWORD`, then run:

```bash
docker compose up --build
```

The frontend is available at `http://localhost:5173`, the API at `http://localhost:3000`, WebSocket at `ws://localhost:3001`, PostgreSQL at `localhost:5432`, and LiveKit at `ws://localhost:7880`. Containers use the internal `postgres` hostname for the database. The HTTP API returns the browser reachable LiveKit URL and never exposes the LiveKit secret.

## Troubleshooting

- HTTP refuses to start if `JWT_PASSWORD` is missing. Set the same value for HTTP and WebSocket.
- Database startup or Prisma errors usually mean `DATABASE_URL` is absent, uses the wrong host for the selected mode, or PostgreSQL is not ready. Bun mode uses `localhost`; full Docker uses `postgres` internally. Prisma generation is performed from `packages/db`.
- `@ai` replies require `OPENAI_API_KEY` on the WebSocket process and outbound access to the OpenAI API.
- LiveKit token generation returns a service unavailable response until `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `LIVEKIT_URL` are configured in `apps/http/.env`. Start it with `docker compose up -d livekit`; the URL must stay `ws://localhost:7880` for local browsers.
- For integration tests, start both backend processes before running the suite.
