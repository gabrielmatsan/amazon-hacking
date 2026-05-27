FROM oven/bun:1.3.11 AS base

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://get.pnpm.io/install.sh | bash -
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm add -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune server --docker


FROM base AS builder
WORKDIR /app

COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=s/786f5078-46af-46d4-ae68-aeb0d16fab46-/root/.local/share/pnpm/store,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm run build --filter=server

FROM base AS runner
WORKDIR /app

COPY --from=builder /app .

WORKDIR /app/apps/server

EXPOSE 8080

CMD ["bun", "run", "src/app.ts"]
