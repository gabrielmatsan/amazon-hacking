# CLAUDE.md — Amazon Hacking web

Operating guide for AI agents (Claude Code / Codex) working in `apps/web`.
Read this fully before editing. The i18n architecture has non-obvious footguns — see [Internationalization](#internationalization-read-this-first).

## What this is

Marketing site for **Amazon Hacking**, a CESUPA university program (Belém, Pará) that
connects students, Amazonian communities, and companies to build solutions for real
territorial challenges. The site is a **single-page home** plus two standalone pages
(`/solucoes`, `/privacy-policy`), trilingual (pt-br / en / es), statically generated per
locale.

Design goal: faithfully port the previous site's blue visual identity into a modern
stack. Improve only pointwise — do not redesign without being asked.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Styling | Tailwind CSS v4 (CSS-first, no JS config) |
| i18n | Paraglide JS v2 (`@inlang/paraglide-js`) |
| Animation | `motion` v12 (`motion/react`) |
| UI primitives | `@base-ui/react`, shadcn-style `components/ui/*` (mostly unused scaffolding) |
| Monitoring | Sentry (`@sentry/nextjs`) + Umami (cookieless analytics) |
| Deploy | `@opennextjs/cloudflare` + Wrangler (also `railway-web.toml`) |
| Tests | Vitest (unit) + Playwright (e2e) |

Part of a Turborepo + pnpm workspace. Shared config: `@workspace/eslint-config`,
`@workspace/typescript-config`. Run everything from `apps/web` unless noted.

## Commands

```bash
pnpm dev          # dev server (runs pnpm i18n first via predev)
pnpm build        # production build (runs pnpm i18n first via prebuild)
pnpm typecheck    # pnpm i18n && tsc --noEmit
pnpm i18n         # compile messages/*.json -> lib/paraglide (generated, do not edit)
pnpm test         # vitest run
pnpm test:e2e     # playwright
pnpm lint         # next lint
pnpm deploy       # opennextjs-cloudflare build && deploy
```

After any change, the green-bar check is: `rm -rf .next && pnpm typecheck && pnpm build && pnpm test`.

## Internationalization (read this first)

This is the trickiest part of the codebase. Three real bugs were fixed here; don't
reintroduce them.

**URL model.** `pt-br` is the base locale and lives at the **root** (`/`, `/solucoes`).
`en` and `es` are prefixed (`/en`, `/es/solucoes`). Strategy: `url cookie baseLocale`.
- All locales (incl. pt-br) are prerendered under `app/[locale]` → `/pt-br`, `/en`, `/es`.
- `next.config.mjs` **rewrites** the root paths onto the pt-br routes (`/` → `/pt-br`,
  `/solucoes` → `/pt-br/solucoes`, `/privacy-policy` → `/pt-br/privacy-policy`) and
  **redirects** `/pt-br/*` → `/*` so the canonical pt-br URL has no prefix.
- **No middleware/proxy.** Next 16 forces middleware (`proxy.ts`) onto the Node runtime,
  which the Cloudflare/OpenNext worker can't run — so locale routing is done with
  next.config rewrites instead. **Adding a new pt-br page at the root means adding a
  matching rewrite here.** (Trade-off: there's no server-side cookie auto-redirect; the
  language switcher handles changes explicitly.)

**SSG per locale.** `app/[locale]/layout.tsx` has `generateStaticParams` (returns all
locales) + `export const dynamicParams = false`. Every locale of every page is
prerendered as static HTML (`●` in build output).

**The locale bridge — `lib/i18n.ts`.** Paraglide's `getLocale()` is overridden to read a
per-request, `cache()`-scoped holder. Rules that MUST be followed:

1. **Every route entry (page AND layout) calls `setRequestLocale(locale)`** at the top,
   using the awaited `params.locale`. Pages cannot rely on the layout alone — they render
   concurrently, so each must set it.
2. `setRequestLocale` returns the typed `Locale` (call it `resolved`). **Pass `resolved`
   down to every component that renders translated text.**
3. **Server Components** rendered after `setRequestLocale` may call `m.foo()` directly
   (the override is active for this request).
4. **Client Components** use the *client* Paraglide instance, which has **no server
   override**. They MUST receive `locale` as a prop and call `m.foo({}, { locale })`.
   Forgetting this silently renders everything in pt-br during SSG. (Header, Hero,
   CookieBanner, SolutionsGallery all take a `locale` prop for this reason.
   `LocaleSwitch` is the exception — it has no translated text, so it derives the active
   locale from `usePathname()`.)
5. The `overwriteGetLocale(...)` call lives **inside `ensureOverride()`** (invoked by
   `setRequestLocale`), not at module top level. This is deliberate: a top-level
   side-effect gets tree-shaken out of the production build and the override never
   registers. **Do not "simplify" it back to a bare top-level call.**

**Messages.** Flat key/value JSON in `messages/{pt-br,en,es}.json`. To add a string:
add the key to **all three** files, then `pnpm i18n` (typecheck/build also run it). To
remove one: delete from all three files **and** remove every usage. Never edit
`lib/paraglide/*` — it is generated.

## Layout & data flow

```
app/
  layout.tsx              # passthrough (html/body live in [locale])
  [locale]/
    layout.tsx            # real <html>/<body>, Gilroy font, metadata, generateStaticParams
    page.tsx              # single-page home: composes components/home/* sections
    solucoes/page.tsx     # mocked solutions gallery (noindex), Tucupy CTA
    privacy-policy/page.tsx
  globals.css            # Tailwind v4 @theme tokens (design system)
  sitemap.ts robots.ts opengraph-image.tsx icon.png apple-icon.png
  fonts/Gilroy-*.ttf
next.config.mjs          # locale rewrites/redirects, image hosts (no middleware — see i18n)
open-next.config.ts      # Cloudflare adapter (static-assets incremental cache)
wrangler.jsonc           # Cloudflare Worker config (name, assets, compat flags)
lib/
  i18n.ts                # setRequestLocale bridge (see above)
  paraglide/             # GENERATED — never edit
  content/               # all site content (typed, see below)
  utils.ts               # cn()
components/
  home/                  # home page sections (Hero, About, Moju, EixosGrid, EditionsTimeline, WinnersSection, Prizes, PartnersGrid, FinalCta)
  site/                  # chrome: header, footer, wave-divider, reveal, locale-switch, cookie-banner, json-ld, umami-script, tucupy-cta, container
  solutions/             # solutions-gallery (client, search + modal + vote)
  winners/               # winner-card (client, video modal)
  ui/                    # shadcn/base-ui primitives — scaffolding, mostly unused
messages/                # i18n source strings
```

## Content model — `lib/content/`

All copy/data is typed and centralized. Types live in `lib/content/types.ts`.

- `winners.ts` — 15 historic projects (2022–2024). Feeds **both** the home Winners
  section and the `/solucoes` gallery. `Winner.description` is **Portuguese-only** by
  design (source content is pt). Each has team, prizes, course, `videoUrl` (YouTube
  embed).
- `editions.ts` — `edition2026` (current) + `previousEditions` (2022–2025). Edition prose
  (`theme`, `themeName`, `summary`, `challenges`) is `LocalizedText` (all 3 locales).
  `number` is the Amazon Hacking edition number (1ª–5ª).
- `partners.ts` — 13 partners, tiered (`platinum`/`gold`/`silver`/`supporter`).

`LocalizedText = Record<Locale, string>`. When adding localized content, fill all three
locales.

## Design system — `app/globals.css`

Tailwind v4: **all tokens are CSS** in `@theme inline`. There is no `tailwind.config`.
Use the named tokens, do not hardcode hex unless matching an external brand (e.g. the
Tucupy CTA card).

- Primary (blue): `primary-100 #0165b7` (brand), `200 #005194`, `300 #014780`, `400 #00335b`.
- Secondary (accent): `secondary-100`..`secondary-400`.
- Neutrals: `neutrals-100 #fff` .. `neutrals-700 #0a0a0a`.
- Font: Gilroy (`--font-sans`/`--font-display`), loaded locally in `[locale]/layout.tsx`.
- `bg-symbol` utility = repeating Amazon Hacking watermark (`/illustrations/symbol.svg`).
- `<WaveDivider from to />` draws the SVG wave between colored sections — pass the exact
  hex of the section above (`from`) and below (`to`) so the seam is invisible.
- Animations: wrap content in `<Reveal>` / `<RevealGroup>` (`components/site/reveal.tsx`).

## SEO & observability

- **Metadata is per-locale.** All copy + builders live in `lib/seo.ts` (`rootMetadata`,
  `pageMetadata`, hreflang/OG-locale maps, `localeUrl`). Routes call them from
  `generateMetadata({ params })` (NOT a static `metadata` const) so title, description,
  canonical, hreflang and OpenGraph are dynamic by language. `canonical` is per-locale
  (pt-br → root, en/es → prefixed); `languages` includes `x-default`. Per-page overrides
  pass `robots` (`/solucoes` is noindex; `/privacy-policy` is index+nofollow).
- The root OG image (`app/opengraph-image.tsx`) is referenced explicitly via
  `/opengraph-image` in `lib/seo.ts` — a localized `openGraph` config would otherwise drop
  the file-based image inherited from the root segment. Don't move the file under `[locale]`
  (the `/pt-br` redirect would 404 its URL). Root `app/layout.tsx` sets `metadataBase` for
  routes outside `[locale]` (not-found, root OG image).
- Web manifest is the `app/manifest.ts` file convention (served at `/manifest.webmanifest`,
  link auto-injected); `background_color`/`theme_color` drive the PWA splash, and the
  viewport sets light/dark `theme-color`.
- Structured data via `components/site/json-ld.tsx` (Organization + Event), localized by the
  `locale` prop passed from the home page.
- `sitemap.ts` (shares `languageAlternates` with metadata), `robots.ts`, `opengraph-image.tsx`.
- Sentry wired through `instrumentation.ts` + `sentry.{client,server,edge}.config.ts`.
- Umami via `components/site/umami-script.tsx` (env-gated, cookieless).
- Env: see `.env.example` (`NEXT_PUBLIC_*` for site URL / Umami, `SENTRY_DSN`).
- Remote images are allow-listed in `next.config.mjs` (`*.r2.dev`, YouTube thumb hosts).
  Add a `remotePatterns` entry before using a new image host.

## Deployment (Cloudflare Workers)

**Automatic deploys** run via GitHub Actions (`.github/workflows/deploy-web.yml`) on push
to `main` (paths under `apps/web`): install → typecheck → test → `pnpm --filter web run
deploy`. Requires repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (token
from the "Edit Cloudflare Workers" template; static-assets cache needs no R2/KV scopes).

**Manual deploy** (from a local machine): `pnpm run deploy` runs
`opennextjs-cloudflare build && opennextjs-cloudflare deploy -- --keep-vars`. (Use `pnpm run
deploy`, not `pnpm deploy` — the latter hits pnpm's built-in command. `--keep-vars` stops a
deploy from wiping runtime vars/secrets set in the dashboard.)

- Worker name: `amazon-hacking-web` (`wrangler.jsonc`). Live at
  `https://amazon-hacking-web.tucupytech.workers.dev`.
- Manual-deploy auth: `wrangler login` (OAuth) or `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.
- **Incremental cache = static-assets** + `enableCacheInterception` (`open-next.config.ts`).
  The site is 100% prerendered with no revalidation, so pages serve from the Workers ASSETS
  binding — no R2/KV needed. Without a cache, every app route 404s (prerendered not-found).
- **Image optimization** uses the Cloudflare `IMAGES` binding (`wrangler.jsonc`). Without it,
  `/_next/image` is a no-op passthrough (ships originals at full size). Keep source images in
  `public/` reasonably small anyway — the binding fetches the origin before transforming.
- **No middleware.** See the i18n section — locale routing is `next.config` rewrites, not
  `proxy.ts`. Next 16 proxy is Node-only and the worker can't run it.
- `SITE_URL` (`lib/site.ts`) reads `NEXT_PUBLIC_SITE_URL`, falling back to the prod domain.
- The only dynamic route is `opengraph-image`; everything else is SSG.

## Conventions (also enforced by global CLAUDE.md + skills)

- e2e type-safety. **Never `any`, avoid `as`.** Let inference work. `types` over `interfaces`.
- **Named exports only** (no default exports). `kebab-case` filenames, `camelCase`
  functions, `SNAKE_CAPS` constants.
- Keep code close to where it's used; extract only at 2–3+ reuses. No `Helper`/`Manager`
  suffixes, no single-use abstractions, minimal comments (explain *why*, not *what*).
- Test behavior, not implementation; add a test for every bug fixed.
- Conventional commits, brief. **Do not** put "Claude Code" in commit messages.

## Footguns checklist

- [ ] New client component renders text? Give it a `locale` prop and use `m.x({}, { locale })`.
- [ ] New page/route? Call `setRequestLocale(locale)` first; thread `resolved` down.
- [ ] New pt-br page at the root? Add a matching rewrite in `next.config.mjs` `rewrites()`.
- [ ] New string? Added to all 3 `messages/*.json` and ran `pnpm i18n`.
- [ ] Removed a string? Removed from all 3 files and all usages.
- [ ] New section color? `WaveDivider` `from`/`to` match the adjacent section hexes.
- [ ] New image host? Added to `next.config.mjs` `remotePatterns`.
- [ ] Don't edit `lib/paraglide/*` (generated). Don't move the `overwriteGetLocale` call
      to module top level.
- [ ] Stale `.next/types` errors after deleting routes? `rm -rf .next` then rebuild.
