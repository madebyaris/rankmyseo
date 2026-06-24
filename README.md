# RankMySEO

An open-source, framework-agnostic SEO toolkit for the JavaScript/TypeScript ecosystem. Drop it into any JS/TS app — Next.js, Hono, SvelteKit, Express, Workers, plain Node — with keyword/rank tracking, persistent reports, and (planned) an AI agent layer that can reshape your dashboard.

**Status:** Early development (M0 skeleton). Packages are not published to npm yet.

## Why RankMySEO?

Most SEO tooling is locked to a single platform or shipped as a hosted SaaS iframe. RankMySEO is a **composable npm package set**:

- **Headless core** — domain logic and ports with zero framework dependencies
- **Your database** — Drizzle adapter today (SQLite); Postgres/MySQL and optional Prisma/Kysely adapters planned
- **Your stack** — thin adapters per framework; the dashboard never touches your DB directly
- **Multi-tenant ready** — every row is scoped by `tenantId` + `projectId`

See [PRD.md](./PRD.md) for the full architecture, roadmap, and design decisions.

## Packages (M0)

| Package | Description |
| --- | --- |
| [`@rankmyseo/core`](./packages/core) | Zod schemas, `RankStore` / `RankDataSource` / `Scheduler` ports, store conformance tests |
| [`@rankmyseo/storage`](./packages/storage) | Default Drizzle SQLite adapter (`createStore`) |
| [`@rankmyseo/server`](./packages/server) | Framework-agnostic HTTP handler (`Request` / `Response`) |
| [`@rankmyseo/server-hono`](./packages/server-hono) | Hono adapter — `createRankMySeoApp(store)` |

Planned: `@rankmyseo/react`, `@rankmyseo/ui`, `@rankmyseo/datasource`, `@rankmyseo/agent`, and more framework adapters.

## Quick start (local monorepo)

**Requirements:** Node.js ≥ 20, pnpm ≥ 10

```bash
git clone https://github.com/madebyaris/rankmyseo.git
cd rankmyseo
pnpm install
pnpm build
pnpm test
```

### Minimal Hono integration

```ts
import { createStore } from "@rankmyseo/storage";
import { createRankMySeoApp } from "@rankmyseo/server-hono";

const store = createStore(":memory:"); // or sqlite:///path/to/db.sqlite

await store.projects.create({
  id: "project-1",
  tenantId: "tenant-a",
  name: "My Site",
  domain: "example.com",
});

export default createRankMySeoApp(store);
```

### API scoping

All routes require tenant/project headers:

| Header | Purpose |
| --- | --- |
| `x-tenant-id` | Tenant scope |
| `x-project-id` | Project scope |

**M0 routes:**

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/keywords` | List keywords |
| `POST` | `/keywords` | Create keyword |
| `GET` | `/keywords/:id` | Get keyword |
| `DELETE` | `/keywords/:id` | Delete keyword |
| `POST` | `/snapshots` | Append rank snapshot |
| `GET` | `/snapshots?keywordId=&from=&to=` | Query snapshot history |

Example:

```bash
curl -X POST http://localhost:3000/keywords \
  -H "x-tenant-id: tenant-a" \
  -H "x-project-id: project-1" \
  -H "content-type: application/json" \
  -d '{"text":"best seo tools","country":"us","device":"desktop","tags":[]}'
```

## Architecture

Three trust tiers keep secrets on the server:

```
Backend (server-only)  →  core, server, storage, datasource, agent
Frontend (client SDK)  →  headless hooks — no DB or API keys
Dashboard (UI)         →  optional prebuilt components
```

Backend packages use `import 'server-only'` and dependency-cruiser rules to prevent accidental client-bundle leaks. Custom storage adapters can implement the `RankStore` port and pass `runStoreContractTests()` from `@rankmyseo/core/testing`.

## Development

```bash
pnpm build      # build all packages
pnpm test       # run Vitest (store contract + Hono smoke)
pnpm typecheck  # TypeScript strict
pnpm lint       # tsc + dependency-cruiser
pnpm publint    # package export hygiene
```

Monorepo tooling: **pnpm workspaces**, **Turborepo**, **tsup**, **Changesets**, **Vitest**.

## Roadmap

| Phase | Focus |
| --- | --- |
| **M0** ✓ | Core ports, SQLite store, Hono adapter, conformance tests |
| **M1** | GSC datasource, scheduler, React hooks, rank chart |
| **M2** | SEO audits, reports, Postgres adapter |
| **M3** | AI agent + customizable dashboard config |
| **M4** | On-page scoring, sitemap, `llms.txt`, markdown negotiation |
| **M5** | More adapters (Next, SvelteKit), optional ORM stores, MCP server |

Details in [PRD.md](./PRD.md).

## License

MIT — see [LICENSE](./LICENSE) when added. Clean-room implementation; no third-party plugin code is copied.
