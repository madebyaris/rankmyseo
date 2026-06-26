# Architecture

## Three trust tiers

```
Backend (server-only)  →  core, server, storage, datasource, scheduler, agent, cli
Frontend (client SDK)  →  @rankmyseo/react — HTTP hooks only, no DB or API keys
Dashboard (UI)         →  @rankmyseo/ui — widgets via react hooks
```

Backend packages import `server-only` and are enforced by **dependency-cruiser** rules so secrets and SQLite never leak into client bundles.

## Layer diagram

```
┌─────────────────────────────────────────────────────────┐
│  Your app (Next.js, Hono, Express, Workers, …)          │
├─────────────────────────────────────────────────────────┤
│  @rankmyseo/server-hono  or  createHandler (Request)    │
├─────────────────────────────────────────────────────────┤
│  @rankmyseo/core  — schemas, engines, ports, config     │
├──────────────┬──────────────┬──────────────┬────────────┤
│  storage     │  datasource  │  scheduler   │  agent     │
│  (SQLite)    │  (GSC/fix)   │  (cron)      │  (AI SDK)  │
└──────────────┴──────────────┴──────────────┴────────────┘
         ▲                              ▲
         │                              │
  @rankmyseo/react (hooks)      @rankmyseo/ui (widgets)
```

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
| Audit | `runAuditChecks` | Scores page signals (title, meta, H1, OG, JSON-LD, CWV) |
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
