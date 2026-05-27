FROM node:22-slim AS base

COPY --from=oven/bun:1.3.13 /usr/local/bin/bun /usr/local/bin/bun
RUN npm install -g pnpm@10.4.1 turbo@2.5.5

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune server --docker


FROM base AS builder
WORKDIR /app

COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm run build --filter=server

FROM debian:bookworm-slim AS runner
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/apps/server/dist/server ./server

EXPOSE 8080

CMD ["./server"]