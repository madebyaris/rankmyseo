# Architecture

## Three trust tiers

```
Backend (Node)         →  core, server(+adapters), storage(+prisma/kysely), datasource, scheduler, scanner, agent, cli
Frontend (client SDK)  →  @rankmyseo/client + react / vue / svelte — HTTP only, no DB or API keys
Dashboard (UI)         →  @rankmyseo/ui — React widgets via react hooks (Vue/Svelte UI widgets deferred)
```

Backend packages are intended for **Node.js ≥ 20** only. Layer boundaries are enforced by **dependency-cruiser** so secrets and SQLite never leak into client bundles. Edge/Workers are **not** supported for the full stack (native SQLite + scanner DNS APIs).

## Support matrix

| Surface | Status |
| --- | --- |
| Node.js ≥ 20 full stack | Yes |
| Edge / Cloudflare Workers full stack | No |
| Adapters: Hono / Express / Next / Nitro | Yes |
| SvelteKit / Astro via `createHandler` | Yes (see `examples/`) |
| React UI widgets | Yes |
| Vue / Svelte headless | Yes |
| Vue / Svelte UI widgets | Deferred |
| Storage: SQLite, Postgres Drizzle, Prisma, Kysely | Yes |
| MySQL | No |

## Layer diagram

```
┌─────────────────────────────────────────────────────────┐
│  Your app (Next.js, Hono, Express, SvelteKit, Astro, Nuxt — Node runtime) │
├─────────────────────────────────────────────────────────┤
│  server-hono / express / next / nitro  or  createHandler │
├─────────────────────────────────────────────────────────┤
│  @rankmyseo/core  — schemas, engines, ports, config     │
├──────────────┬──────────────┬──────────────┬────────────┤
│  storage*    │  datasource  │  scheduler   │  agent     │
│  SQLite/PG   │  (GSC/fix)   │  (cron)      │  (AI SDK)  │
└──────────────┴──────────────┴──────────────┴────────────┘
         ▲                              ▲
         │                              │
  client / react / vue / svelte   @rankmyseo/ui (React)
```

\* `@rankmyseo/storage` (Drizzle) or optional `@rankmyseo/storage-prisma` / `@rankmyseo/storage-kysely`.

## Core ports

Defined in `@rankmyseo/core`:

| Port | Purpose |
| --- | --- |
| `RankStore` | Aggregates all repos (projects, keywords, snapshots, audits, reports, dashboard, blog) |
| `RankDataSource` | Fetches rank positions from GSC or fixture |
| `Scheduler` | Registers cron jobs (e.g. rank ingestion) |

Custom storage adapters implement `RankStore` and should pass `runStoreContractTests()` from `@rankmyseo/core/testing`.

## Engines (pure TypeScript)

| Engine | Module | Purpose |
| --- | --- | --- |
| Audit | `runAuditChecks` | Scores page signals (title, meta, headings, OG, JSON-LD, HTTPS, indexability, viewport, lang, image alt, content depth, CWV incl. INP) — see [SEO Playbook](../seo-playbook.md) |
| Parse | `extractPageSignals` | Regex HTML parser for live URL scans |
| Meta | `generateMeta` | Builds title, description, OG, JSON-LD, slug |
| Recommend | `buildAuditRecommendations`, `buildBlogRecommendations` | Prioritized fix suggestions |
| Report | `buildReport` | Rollup top movers and audit trends |

## Multi-tenancy

Every persisted entity carries `tenantId` and `projectId`. Repos filter reads and writes by scope — cross-tenant access returns empty/404.

## Data flow: rank tracking

1. Keywords created via `POST /keywords`
2. Scheduler or manual job calls `RankDataSource.fetchPositions`
3. Snapshots appended via `POST /snapshots` (append-only)
4. Reports aggregate snapshots over a date range

## Data flow: live scan

1. Client calls `POST /scan` with a URL
2. Server fetches HTML, runs `extractPageSignals`
3. `runAuditChecks` produces score + checks
4. `buildAuditRecommendations` returns prioritized fixes
5. Audit persisted to store

## OSS vs future SaaS

The open-source package ships **free-first** datasources only:

- **fixture** — offline deterministic data
- **gsc** — Google Search Console (owned-site data)
- **psi** — PageSpeed Insights client

Paid SERP brokers (DataForSEO, Serper, etc.) are intentionally **not** bundled in OSS; they are planned for a commercial SaaS offering with adapter plug-ins.
