FROM node:20-alpine

WORKDIR /app/apps/ws

RUN apk add --no-cache openssl libc6-compat curl
ENV LD_PRELOAD=/lib/libc.so.6

# Accept DATABASE_URL as build ARG and set it as ENV
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Copy monorepo-wide files first for cache
COPY package.json turbo.json /app/

# Install all dependencies from root (monorepo root assumed)
WORKDIR /app
RUN npm install --legacy-peer-deps

# Copy WS app code
COPY apps/ws /app/apps/ws

# Copy Prisma schema and migration logic
COPY packages/db /app/packages/db

# Return to WS app working directory
WORKDIR /app/apps/ws

# Build, generate Prisma client (from monorepo schema), and apply migrations
RUN npm run build \
  && npx prisma generate --schema=../../packages/db/prisma/schema.prisma \
  && npx prisma migrate deploy --schema=../../packages/db/prisma/schema.prisma

EXPOSE 3001

CMD ["npm", "run", "start"]
