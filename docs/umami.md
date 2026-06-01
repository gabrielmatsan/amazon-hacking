# Umami Analytics

Reference for the self-hosted Umami integration: the tracker on the marketing
site, the admin dashboard (`/admin/analytics/umami`), and the full HTTP API.

> **Secrets** live only in gitignored env files (`apps/server/.env`). This doc and
> `.env.example` carry **names and public values** — never the admin password.

---

## Instance

| What | Value |
| --- | --- |
| Base URL | `https://umami-production-c594.up.railway.app` |
| Website ID | `ca0941d0-0c44-4608-88e4-e35250f45e27` (public — ships in page HTML) |
| Admin user | `admin` |
| Admin password | gitignored `apps/server/.env` → `UMAMI_PASSWORD` |

The website ID and script URL are public; the password is the only secret.

---

## 1. Tracker (`apps/web`)

`components/site/umami-script.tsx`, mounted in `app/layout.tsx`. Env-gated — renders
nothing unless `NEXT_PUBLIC_UMAMI_SRC` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID` are set.

```env
# Public — exposed to the browser
NEXT_PUBLIC_UMAMI_SRC=https://umami-production-c594.up.railway.app/script.js
NEXT_PUBLIC_UMAMI_WEBSITE_ID=ca0941d0-0c44-4608-88e4-e35250f45e27

# Session replay (recorder) — on by default; set to false to opt out.
NEXT_PUBLIC_UMAMI_RECORDER=true
NEXT_PUBLIC_UMAMI_RECORDER_SAMPLE_RATE=0.15
NEXT_PUBLIC_UMAMI_RECORDER_MASK_LEVEL=moderate     # strict | moderate
NEXT_PUBLIC_UMAMI_RECORDER_MAX_DURATION=300000     # ms
```

The recorder URL is derived from `_SRC` (`…/script.js` → `…/recorder.js`). Unless
`NEXT_PUBLIC_UMAMI_RECORDER=false`, the component renders:

```html
<script defer src=".../script.js" data-website-id="ca0941d0-..."></script>
<script defer src=".../recorder.js" data-website-id="ca0941d0-..."
  data-sample-rate="0.15" data-mask-level="moderate" data-max-duration="300000"></script>
```

### Tracking custom events (browser)

```js
umami.track('signup-button');                          // named event
umami.track('signup-button', { plan: 'pro', id: 123 }); // with data
umami.identify({ id: 'user@example.com' });             // distinct ID / session data
```

Or declaratively: `data-umami-event="Signup"` (+ `data-umami-event-*` for data).
Limits: event names ≤ 50 chars; string values ≤ 500; numbers ≤ 4 decimal precision.

---

## 2. Backend integration (`apps/server`)

Clean-architecture, mirroring the existing Cloudflare analytics adapter.

| File | Role |
| --- | --- |
| `shared/infra/umami/umami-client.ts` | login + Redis token cache + `umamiGet()` (retry-once on 401) |
| `analytics/application/umami-overview.usecase.ts` | parallel fan-out, cached ~5 min |
| `analytics/application/umami-realtime.usecase.ts` | live active-visitor count (uncached) |
| `admin/infra/admin.controller.ts` | two admin-guarded routes (`requireRole("admin")`) |

### Env (`shared/infra/env/env.ts`, all optional → graceful "not configured")

```env
UMAMI_API_URL=https://umami-production-c594.up.railway.app
UMAMI_USERNAME=admin
UMAMI_PASSWORD=<secret, gitignored .env only>
UMAMI_WEBSITE_ID=ca0941d0-0c44-4608-88e4-e35250f45e27
UMAMI_TIMEZONE=America/Belem
UMAMI_TOKEN_TTL_SECONDS=43200      # 12h Bearer cache
UMAMI_OVERVIEW_CACHE_SECONDS=300   # 5min overview cache
```

### Auth flow

1. `POST /api/auth/login { username, password }` → `{ token }`.
2. Token cached in Redis (`umami:token`, TTL `UMAMI_TOKEN_TTL_SECONDS`), shared across instances.
3. Every data call sends `Authorization: Bearer <token>`.
4. On `401`, the cache is dropped, we re-login once and retry.

### Our admin routes (consumed by the frontend)

```
GET /admin/analytics/umami/overview?range=24h|7d|30d|90d
    → { data: { range, stats{+comparison}, series[], topPages[], referrers[],
                 countries[], regions[], cities[], languages[],
                 browsers[], os[], devices[], events[],
                 conversionByTeam[{team,views,votes,rate}],
                 webVitals{lcp,inp,cls,fcp,ttfb,count}, utm{source,medium,campaign},
                 funnel[{value,visitors,dropoff,remaining}] } }

GET /admin/analytics/umami/realtime
    → { data: { online: number } }
```

`overview` fans out (in parallel) to: `/stats?compare=prev`, `/pageviews`,
`/metrics?type=path|referrer|country|browser|os|device|event`, and the Reports API
(`POST /reports/performance`, `/reports/utm`, `/reports/funnel`). The three report calls
are wrapped in `safe()` — a missing/empty report degrades to zeros, never a 500.
`realtime` calls `/websites/:id/active`.

---

## 3. Dashboard (`apps/web`)

- Page: `app/[locale]/admin/analytics/umami/page.tsx`
- Component: `components/dashboard/admin-umami.tsx` (recharts area chart + ranked lists)
- Data: `lib/api/admin.ts` (`getUmamiOverview`, `getUmamiRealtime`) +
  `hooks/use-admin-teams.ts` (`useUmamiOverview`, `useUmamiRealtime` — polls 30 s)
- Nav: "Análise Umami" in `admin-shell.tsx`

Range toggle `24h / 7d / 30d / 90d` (default 7 d); stat cards show `compare=prev` deltas.
The admin area is Portuguese-only (hardcoded strings, no i18n — matches `AdminVisitors`).

---

## 3b. Vote tracking & session linking

`lib/analytics/umami.ts` wraps the global tracker type-safely (`trackEvent`,
`identifyVisitor` — no-ops on server or when the tracker is absent). Wired into the
voting flow in `components/solutions/team-detail.tsx`:

| Event | When | Data |
| --- | --- | --- |
| `solution-viewed` | team detail opens | `{ teamId }` |
| `vote-token-requested` | token sent | `{ channel }` |
| `vote-token-failed` | token/vote error | `{ step, reason }` |
| `vote-submitted` | vote succeeds | `{ teamId, channel }` |
| `section-viewed` | home section enters viewport | `{ section }` |
| `winner-video-play` | winner video opens | `{ winnerId, year }` |
| `solutions-search` | gallery search (debounced) | `{ length, hasResults }` |
| `cta-click` | key CTA clicked (declarative `data-umami-event`) | `{ target }` |

`section-viewed` is fired by `components/site/track-section.tsx` (IntersectionObserver,
once). CTAs use Umami's declarative `data-umami-event` / `data-umami-event-*` attributes.
`solution-viewed` and `vote-submitted` also carry `teamName`, which powers the
**conversion-by-team** table (views→votes joined by team name, no DB join needed).

**Fraud forensics.** `/admin/flagged` shows a "Ver sessão no Umami" link per vote
(`lib/analytics/umami-links.ts` → `umamiSessionUrl(fingerprint)`), deep-linking to the
session(s) for that Distinct ID so an admin can inspect the journey and replay.

**Vote ↔ session link.** On a successful vote we call
`identifyVisitor(fingerprint)` (the FingerprintJS `visitorId`). Umami binds that
**Distinct ID** to the cookieless session, so:

- In Umami → **Sessions**, search the fingerprint to replay the journey that led to a vote.
- The vote DB record already stores the same `fingerprint`, so a flagged vote
  cross-references to its Umami session with no extra backend plumbing.

Funnel to build in Umami: `solution-viewed` → `vote-token-requested` → `vote-submitted`.

---

## 4. HTTP API reference

Self-hosted base: `https://<instance>/api`. Auth: `Authorization: Bearer <token>`
from `POST /api/auth/login` (see above). `POST /api/auth/verify` checks a token.
Time params `startAt`/`endAt` are **Unix ms**. All "filters" endpoints accept:
`path, referrer, title, query, browser, os, device, country, region, city, language,
hostname, tag, event, distinctId, utmSource, utmMedium, utmCampaign, utmContent,
utmTerm, segment, cohort`.

### Sending stats (no auth, needs a real `User-Agent`)

```
POST /api/send    { type: "event"|"identify"|"performance", payload: {
  website, hostname, language, referrer, screen, title, url, name?, data?, id?, tag? } }
POST /api/batch   [ { type, payload }, … ]   # array of /send bodies
```

### Website statistics (`/api/websites/:id/…`)

| Endpoint | Returns |
| --- | --- |
| `GET /stats?startAt&endAt&compare=prev` | `{ pageviews, visitors, visits, bounces, totaltime, comparison{…} }` |
| `GET /pageviews?startAt&endAt&unit&timezone&compare` | `{ pageviews:[{x,y}], sessions:[{x,y}] }` |
| `GET /metrics?type=…&startAt&endAt&limit&offset` | `[{ x, y }]` — `x`=value, `y`=visitors |
| `GET /metrics/expanded?type=…` | `[{ name, pageviews, visitors, visits, bounces, totaltime }]` |
| `GET /active` | `{ visitors }` — unique in last 5 min |
| `GET /daterange` | `{ startDate, endDate }` |
| `GET /events/series?startAt&endAt&unit&timezone` | `[{ x:eventName, t, y }]` |

`metrics` `type`: `path | entry | exit | title | query | referrer | channel | domain |
country | region | city | browser | os | device | language | screen | event | hostname |
tag | distinctId`. `unit`: `minute`(≤60m) `hour`(≤30d) `day`(≤6mo) `month` `year`.

### Realtime

```
GET /api/realtime/:websiteId
  → { countries{}, urls{}, referrers{}, events[], series{views[],visitors[]},
      totals{ views, visitors, events, countries }, timestamp }
```

### Events & event data (`/api/websites/:id/…`)

| Endpoint | Returns |
| --- | --- |
| `GET /events?startAt&endAt&search&page&pageSize` | paginated raw events |
| `GET /events/stats?startAt&endAt&compare` | `{ data:{ events, visitors, visits, uniqueEvents, comparison } }` |
| `GET /event-data/events?startAt&endAt&event` | `[{ eventName, propertyName, dataType, total }]` |
| `GET /event-data/fields` · `/properties` · `/values?event&propertyName` | property/value counts |
| `GET /event-data/stats` | `[{ events, properties, records }]` |
| `GET /event-data-pivot?eventName` | rows with `propertyKeys[]`/`propertyValues[]` |

### Sessions (`/api/websites/:id/…`)

`GET /sessions`, `/sessions/stats`, `/sessions/weekly`, `/sessions/:sid`,
`/sessions/:sid/activity`, `/sessions/:sid/properties`, `/session-data/properties`,
`/session-data/values?propertyName`, `/session-data-pivot?propertyName`,
`/session-data/stats?propertyName`.

### Reports (`POST /api/reports/<type>` with `{ websiteId, type, filters, parameters }`)

`attribution` · `breakdown` (`fields[]`) · `funnel` (`steps[]`, `window`) · `goal` ·
`journey` (`steps 3–7`, `startStep`, `endStep`) · `performance` (Core Web Vitals;
`metric=lcp|inp|cls|fcp|ttfb`) · `retention` · `revenue` (`currency`) · `utm`.
CRUD: `GET/POST /api/reports`, `GET/POST/DELETE /api/reports/:id`. Revenue shortcuts:
`GET /websites/:id/revenue/{chart,stats,metrics,sessions}`.

### Management

| Resource | Endpoints |
| --- | --- |
| Websites | `GET/POST /api/websites`, `GET/POST/DELETE /api/websites/:id`, `POST /:id/reset`, `GET /:id/recorder` (public) |
| Me | `GET /api/me`, `/me/teams`, `/me/websites` |
| Users (admin) | `POST /api/users`, `GET/POST/DELETE /api/users/:id`, `/:id/websites`, `/:id/teams` |
| Teams | `GET/POST /api/teams`, `POST /api/teams/join`, `GET/POST/DELETE /api/teams/:id`, `/:id/users`, `/:id/websites` |
| Admin | `GET /api/admin/users`, `/admin/websites`, `/admin/teams` |
| Links / Pixels | `GET/POST /api/links` · `/pixels` (+ `:id` CRUD) |
| Share | `POST /api/share`, `GET/POST/DELETE /api/share/id/:shareId`, `GET/POST /api/websites/:id/shares` |

### `@umami/api-client` (not used here)

The npm client needs `UMAMI_API_CLIENT_SECRET` = the server's `APP_SECRET`, which we
don't hold — we authenticate with admin username/password instead. Kept as a note in
case the app secret becomes available.
