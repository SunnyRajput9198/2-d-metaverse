# Metaspace monorepo

This Bun and Turborepo workspace contains:

- `apps/frontend`: React, Vite, Excalidraw and LiveKit client.
- `apps/http`: Express API for authentication, spaces, catalog and LiveKit tokens.
- `apps/ws`: authenticated realtime rooms, movement, chat, canvas sync and `@ai`.
- `packages/db`: shared Prisma schema, generated client and singleton database client.
- `packages/eslint-config`, `packages/typescript-config`: shared tooling configuration.

See the repository [README](../../readme.md) for prerequisites, environment variables, development, build, testing, Docker and troubleshooting.
