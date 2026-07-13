# Packages

All packages live under `packages/` in the monorepo. Published names are scoped `@rankmyseo/*`.

## Backend (server-only)

| Package | Description |
| --- | --- |
| `@rankmyseo/core` | Zod schemas, audit/meta/report engines, config loader, port interfaces |
| `@rankmyseo/storage` | Drizzle adapter — `createStore(url)` for SQLite + Postgres |
| `@rankmyseo/storage-prisma` | Optional Prisma `RankStore` (Postgres) — `createPrismaStore(url)` |
| `@rankmyseo/storage-kysely` | Optional Kysely `RankStore` (Postgres) — `createKyselyStore(url)` |
| `@rankmyseo/datasource` | `FixtureDataSource`, `GscDataSource`, `PsiClient`, factory |
| `@rankmyseo/scheduler` | `NodeCronScheduler`, `ManualScheduler`, ingest job |
| `@rankmyseo/server` | Framework-agnostic `createHandler` — full HTTP API |
| `@rankmyseo/server-hono` | Hono adapter — `createRankMySeoApp(store, options)` |
| `@rankmyseo/server-express` | Express middleware — `createRankMySeoExpress(store, options)` |
| `@rankmyseo/server-next` | Next.js App Router — `createRankMySeoRouteHandlers(store, options)` |
| `@rankmyseo/server-nitro` | Nitro/h3 — `createRankMySeoNitroHandler(store, options)` |
| `@rankmyseo/agent` | AI SDK tools + MCP server for dashboard/agent chat |
| `@rankmyseo/scanner` | SSRF-safe page fetch for `/scan` and regression CLI |
| `@rankmyseo/cli` | `init`, `migrate`, `schedule`, `doctor`, `regression check` |

## Frontend

| Package | Description |
| --- | --- |
| `@rankmyseo/client` | Framework-neutral HTTP client for the RankMySEO API |
| `@rankmyseo/collector` | On-page SEO signal collector (`web-vitals`) |
| `@rankmyseo/react` | Headless React hooks + collector re-exports |
| `@rankmyseo/vue` | Headless Vue 3 composables + plugin + collector |
| `@rankmyseo/svelte` | Headless Svelte stores + context + collector |
| `@rankmyseo/ui` | Dashboard widget registry, `DashboardRenderer`, optional blog UI |

## Apps (private, not published)

| App | Purpose |
| --- | --- |
| `apps/playground` | Hono dev server + SQLite + manual test UI |
| `apps/dashboard` | React reference dashboard (uses shadcn locally for demo shell; library widgets use `@rankmyseo/ui` CSS) |

## Dependency rules

- `core` — no internal `@rankmyseo/*` deps
- `client` — depends on `core` only
- `collector` — depends on `core` (+ `web-vitals`)
- `react` / `vue` / `svelte` — depend on `client` + `collector` + `core`
- `ui` — depends on `core` + `react`
- `server` — depends on `core`, optionally `agent`
- `storage` / `storage-prisma` / `storage-kysely` — depend on `core` only (plus their ORM peers)
- Client bundles must **never** import `storage`, `storage-prisma`, `storage-kysely`, `datasource`, `scheduler`, `scanner`, `agent`, `cli`, or `server`

## Testing exports

`@rankmyseo/core/testing` exports:

- `runStoreContractTests(makeStore)` — conformance suite for custom `RankStore` implementations
- `runServerAdapterContractTests(options)` — HTTP adapter conformance (keywords, snapshots, site routes, scope errors)
- `newId()` — UUID helper for tests

Postgres contract tests (storage / storage-prisma / storage-kysely) run when `RANKMYSEO_POSTGRES_URL` or `DATABASE_URL` is set; otherwise they skip.

## Examples

Thin Request/Response fixtures (not full apps) live under `examples/`:

- `examples/sveltekit-adapter` — SvelteKit `+server.ts` pattern
- `examples/astro-adapter` — Astro `pages/api/.../[...path].ts` pattern
