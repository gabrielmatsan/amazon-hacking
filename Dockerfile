FROM node:22-slim AS base

COPY --from=oven/bun:1.3.11 /usr/local/bin/bun /usr/local/bin/bun
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate && npm install -g turbo@2.9.14

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

FROM oven/bun:1.3.11 AS runner
WORKDIR /app

COPY --from=builder /app .

WORKDIR /app/apps/server

EXPOSE 8080

CMD ["bun", "run", "src/app.ts"]
