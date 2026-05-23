# Amazon Hacking — Website

Trilingual marketing site for **Amazon Hacking**, the CESUPA program that connects
university students, Amazonian communities, and companies to build solutions for real
territorial challenges in Pará, Brazil.

> **AI agents:** read [`CLAUDE.md`](./CLAUDE.md) first — it documents the i18n
> architecture and the conventions to follow.

## Highlights

- **Single-page home** + standalone `/solucoes` and `/privacy-policy` pages.
- **Trilingual**: Portuguese (root `/`), English (`/en`), Spanish (`/es`), with a cookie
  preference and a language popover.
- **Statically generated per locale** (SSG) for performance and SEO — every locale of
  every page is prerendered to static HTML.
- Full SEO: per-locale metadata, `hreflang` alternates, JSON-LD, sitemap, OpenGraph image.
- Error monitoring (Sentry) and cookieless analytics (Umami).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19
- [Tailwind CSS v4](https://tailwindcss.com) (CSS-first theming, no JS config)
- [Paraglide JS v2](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) for i18n
- [Motion](https://motion.dev) for animation
- Sentry + Umami for observability
- Deploy via [OpenNext for Cloudflare](https://opennext.js.org/cloudflare) (Wrangler)

This package lives in a Turborepo + pnpm workspace as `apps/web`.

## Getting started

```bash
pnpm install            # from the monorepo root
cp .env.example .env    # in apps/web

pnpm dev                # http://localhost:3000
```

`pnpm dev`/`pnpm build` automatically compile i18n messages first. To compile manually:
`pnpm i18n`.

### Useful scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build (SSG) |
| `pnpm typecheck` | Compile messages + `tsc --noEmit` |
| `pnpm i18n` | Compile `messages/*.json` → `lib/paraglide` |
| `pnpm test` / `pnpm test:e2e` | Vitest unit tests / Playwright e2e |
| `pnpm lint` | ESLint |
| `pnpm run deploy` | Build + deploy to Cloudflare (live: `amazon-hacking-web.tucupytech.workers.dev`) |

## Project structure

```
app/              # App Router: passthrough root + app/[locale] (home, solucoes, privacy-policy)
next.config.mjs   # locale rewrites/redirects (root = pt-br, /en, /es) + image hosts
open-next.config.ts # Cloudflare adapter config (static-assets cache)
lib/i18n.ts       # per-request locale bridge for Paraglide
lib/content/      # typed site content (winners, editions, partners)
components/        # home/ sections, site/ chrome, solutions/, winners/, ui/
messages/          # i18n source strings (pt-br / en / es)
app/globals.css   # Tailwind v4 design tokens (blue palette, Gilroy font)
```

## Editing content & copy

- **UI strings** live in `messages/{pt-br,en,es}.json`. Add or change a key in **all
  three** files, then run `pnpm i18n`.
- **Structured content** (winners, editions, partners) lives in `lib/content/`, fully
  typed via `lib/content/types.ts`.

See [`CLAUDE.md`](./CLAUDE.md) for the i18n rules (especially around client components),
the design system tokens, SEO setup, and the footguns checklist.

## Configuration

Copy `.env.example` → `.env`. Keys:

- `NEXT_PUBLIC_SITE_URL` — public origin.
- `NEXT_PUBLIC_UMAMI_SRC`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID` — analytics (optional).
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` — error monitoring (optional).

Remote image hosts are allow-listed in `next.config.mjs`.
