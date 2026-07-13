# Getting Started

## Requirements

- **Node.js** ≥ 20
- **pnpm** ≥ 10

## Clone and verify

```bash
git clone https://github.com/madebyaris/rankmyseo.git
cd rankmyseo
pnpm install
pnpm build
pnpm test
```

## Run the demo apps

Terminal 1 — API server (SQLite, seeded data):

```bash
pnpm dev:playground
# → http://localhost:3456
# → Manual test UI: http://localhost:3456/playground
```

Terminal 2 — React dashboard (proxies to :3456):

```bash
pnpm dev:dashboard
# → http://localhost:5173
```

## Install in your app

Interactive (recommended):

```bash
npm i rankmyseo
npx rankmyseo install
```

Choose **Recommended** (core + storage + server-hono + react + cli), **Full** (all packages), or **Custom** (pick from a list).

Non-interactive:

```bash
npx rankmyseo install --yes --preset recommended
```

Then scaffold:

```bash
npx rankmyseo init
npx rankmyseo migrate
npx rankmyseo doctor
# optional: enable regression in config, then
# npx rankmyseo regression check --candidate-url <preview> --base-ref <sha>
```

See [Packages](./Packages.md) for manual `@rankmyseo/*` installs. SEO regression gate: [[SEO-Regression]].

## CLI scaffold (monorepo contributors)

```bash
pnpm exec rankmyseo-cli init              # creates rankmyseo.config.ts
pnpm exec rankmyseo-cli migrate           # SQLite migrations
pnpm exec rankmyseo-cli schedule          # one rank ingestion pass
```

## Minimal Hono integration

```ts
import { defineConfig } from "@rankmyseo/core";
import { createStore } from "@rankmyseo/storage";
import { createRankMySeoApp } from "@rankmyseo/server-hono";

const store = createStore("sqlite:///path/to/db.sqlite");

await store.projects.create({
  id: "project-1",
  tenantId: "tenant-a",
  name: "My Site",
  domain: "example.com",
});

const config = defineConfig({
  databaseUrl: "sqlite:///path/to/db.sqlite",
  tenantId: "tenant-a",
  projectId: "project-1",
  dataSources: [{ provider: "fixture", default: true }],
  schedule: { cron: "0 6 * * *", enabled: false },
  siteFeatures: {
    sitemap: true,
    llmsTxt: true,
    collector: true,
    markdownNegotiation: true,
    blog: false,
  },
});

export default createRankMySeoApp(store, { config });
```

## API scoping

Most routes require tenant/project headers:

| Header | Purpose |
| --- | --- |
| `x-tenant-id` | Tenant scope |
| `x-project-id` | Project scope |

**No headers required:** `GET /sitemap.xml`, `GET /llms.txt`

**Optional headers:** `GET /` (defaults to config `tenantId` / `projectId`)

Example:

```bash
curl http://localhost:3456/keywords \
  -H "x-tenant-id: tenant-a" \
  -H "x-project-id: project-1"
```

## Next steps

- Read [[Configuration]] for all config options
- See [[API-Reference]] for every route
- Add dashboard widgets via [[Dashboard-and-Widgets]]
- Enable blog optionally via [[Blog-Module]]
