# Tucupy Template

Monorepo template com infraestrutura production-ready.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Monorepo** | Turborepo + pnpm workspaces |
| **Backend** | Bun + Elysia |
| **Frontend** | Next.js 15 + Tailwind CSS 4 |
| **Database** | PostgreSQL + Drizzle ORM |
| **Cache** | Redis (ioredis) + BullMQ |
| **Observability** | OpenTelemetry (traces, metrics, logs) + Prometheus + Pino |
| **Email** | AWS SES + Nodemailer + BullMQ queue |
| **Storage** | AWS S3 + CloudFront CDN |
| **Auth** | JWT (jose) + Argon2 |
| **IaC** | Terraform (AWS) |
| **CI/CD** | GitHub Actions |
| **Deploy** | Railway (Docker) |

## Quick Start

```bash
# 1. Clone
git clone <repo-url> my-project
cd my-project

# 2. Install
pnpm install

# 3. Start infra (PostgreSQL + Redis)
cd apps/server && docker-compose -f docker-compose.test.yml up -d

# 4. Configure env
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env

# 5. Run migrations
pnpm --filter server db:migrate

# 6. Dev
pnpm dev
```

- **API**: http://localhost:8080
- **Docs (Swagger)**: http://localhost:8080/docs
- **Health**: http://localhost:8080/health
- **Metrics**: http://localhost:8080/metrics
- **Web**: http://localhost:3000

## Estrutura

```
.
├── apps/
│   ├── server/          # Bun + Elysia API
│   │   ├── src/
│   │   │   ├── items/   # Modulo de exemplo (CRUD)
│   │   │   └── shared/  # Infraestrutura compartilhada
│   │   │       ├── infra/
│   │   │       │   ├── databases/       # PostgreSQL + Redis
│   │   │       │   ├── observability/   # OpenTelemetry + Pino + Prometheus
│   │   │       │   ├── queues/          # BullMQ
│   │   │       │   ├── rate-limiting/   # Redis rate limiter
│   │   │       │   ├── errors/          # Error classes
│   │   │       │   ├── env/             # Zod env validation
│   │   │       │   ├── auth.middleware.ts
│   │   │       │   ├── base.controller.ts
│   │   │       │   └── hash-password.ts
│   │   │       ├── mail/ses/            # AWS SES email
│   │   │       └── s3/                  # AWS S3 storage
│   │   ├── migrations/
│   │   ├── Dockerfile
│   │   └── docker-compose.test.yml
│   └── web/             # Next.js 15
├── packages/
│   ├── eslint-config/   # Shared ESLint
│   └── typescript-config/ # Shared TypeScript
├── terraform/           # AWS infra (S3 + CloudFront)
├── .github/workflows/   # CI/CD
├── railway.toml         # Backend deploy
└── railway-web.toml     # Frontend deploy
```

## Criando um novo modulo

Siga o padrao do modulo `items`:

```
src/my-module/
├── domain/
│   └── my-module.schema.ts     # Drizzle schema
├── applications/
│   ├── create-xxx.usecase.ts   # Use cases
│   ├── list-xxx.usecase.ts
│   └── ...
├── infra/
│   └── my-module.repository.ts # Data access
└── controller/
    └── my-module.controller.ts # Elysia routes
```

Depois registre em `app.routes.ts`:

```typescript
import { myModuleController } from "./my-module/controller/my-module.controller";

export const appRoutes = new Elysia()
  .use(itemsController)
  .use(myModuleController);
```

## Database

```bash
pnpm --filter server db:generate   # Gera migration
pnpm --filter server db:migrate    # Aplica migrations
pnpm --filter server db:studio     # Drizzle Studio (GUI)
```

## Testes

```bash
pnpm --filter server test:db:up    # Sobe PostgreSQL + Redis
pnpm --filter server test           # Roda testes
pnpm --filter server test:watch     # Watch mode
```

## Observability

Configure no `.env`:

```bash
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otel-endpoint
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic xxx
```

Compativel com Grafana Cloud, Jaeger, ou qualquer backend OTLP.

## Deploy (Railway)

O template vem com configs para Railway:
- `railway.toml` - Backend (Dockerfile)
- `railway-web.toml` - Frontend (Railpack)

## Customizacao

1. Buscar e substituir `my-app` / `my_api` pelo nome do seu projeto
2. Atualizar `apps/server/.env.example` com suas variaveis
3. Configurar o Terraform backend em `terraform/main.tf`
4. Atualizar CORS origins em `apps/server/src/app.ts`
