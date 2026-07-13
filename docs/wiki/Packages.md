# Packages

All packages live under `packages/` in the monorepo. Published names are scoped `@rankmyseo/*`.

## Backend (server-only)

| Package | Description |
| --- | --- |
| `@rankmyseo/core` | Zod schemas, audit/meta/report engines, config loader, port interfaces |
| `@rankmyseo/storage` | Default Drizzle SQLite adapter — `createStore(url)` |
| `@rankmyseo/datasource` | `FixtureDataSource`, `GscDataSource`, `PsiClient`, factory |
| `@rankmyseo/scheduler` | `NodeCronScheduler`, `ManualScheduler`, ingest job |
| `@rankmyseo/server` | Framework-agnostic `createHandler` — full HTTP API |
| `@rankmyseo/server-hono` | Hono adapter — `createRankMySeoApp(store, options)` |
| `@rankmyseo/agent` | AI SDK tools + MCP server for dashboard/agent chat |
| `@rankmyseo/scanner` | SSRF-safe page fetch for `/scan` and regression CLI |
| `@rankmyseo/cli` | `init`, `migrate`, `schedule`, `doctor`, `regression check` |

## Frontend

| Package | Description |
| --- | --- |
| `@rankmyseo/react` | Headless React hooks + on-page collector (`web-vitals`) |
| `@rankmyseo/ui` | Dashboard widget registry, `DashboardRenderer`, optional blog UI |

## Apps (private, not published)

| App | Purpose |
| --- | --- |
| `apps/playground` | Hono dev server + SQLite + manual test UI |
| `apps/dashboard` | React reference dashboard (uses shadcn locally for demo shell; library widgets use `@rankmyseo/ui` CSS) |

## Dependency rules

- `core` — no internal `@rankmyseo/*` deps
- `react` — depends on `core` only (HTTP client)
- `ui` — depends on `core` + `react`
- `server` — depends on `core`, optionally `agent`
- Client bundles must **never** import `storage`, `datasource`, `scheduler`, `scanner`, `agent`, `cli`, or `server`

## Testing exports

`@rankmyseo/core/testing` exports:

- `runStoreContractTests(makeStore)` — conformance suite for custom `RankStore` implementations
- `runServerAdapterContractTests(options)` — HTTP adapter conformance (keywords, snapshots, site routes, scope errors)
- `newId()` — UUID helper for tests

## Planned (M5)

- `@rankmyseo/vue`, `@rankmyseo/svelte`
- `@rankmyseo/server-next`
- Postgres / Prisma / Kysely storage adapters
- npm publish via Changesets
