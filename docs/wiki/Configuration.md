# Configuration

Configuration is validated at runtime by Zod in `@rankmyseo/core`. Use `defineConfig()` when authoring `rankmyseo.config.ts` — invalid values throw on load.

## Full schema

```typescript
import { defineConfig } from "@rankmyseo/core";

export default defineConfig({
  databaseUrl: "sqlite://./data/rankmyseo.sqlite",
  tenantId: "tenant-a",
  projectId: "project-1",

  dataSources: [
    { provider: "fixture", default: true },
    // { provider: "gsc", apiKey: "...", default: true },
  ],

  schedule: {
    cron: "0 6 * * *",
    enabled: false,
  },

  siteFeatures: {
    sitemap: true,
    llmsTxt: true,
    collector: true,
    markdownNegotiation: true,
    blog: false,           // opt-in blog API
  },

  sitemapRoutes: ["/", "/about"],

  llmsTxt: {
    projectName: "My Site",
    summary: "SEO tracking powered by RankMySEO.",
    links: [{ title: "About", url: "/about.md" }],
  },

  dashboard: {
    widgets: [/* optional default widgets */],
  },
});
```

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `databaseUrl` | string | required | SQLite path (`sqlite:///abs/path` or `sqlite://./relative`) |
| `tenantId` | string | required | Default tenant for single-tenant setups |
| `projectId` | string | required | Default project |
| `dataSources` | array | `[{ provider: "fixture", default: true }]` | Rank data providers |
| `schedule.cron` | string | `"0 6 * * *"` | Cron expression for ingestion |
| `schedule.enabled` | boolean | `false` | Enable scheduled jobs |
| `siteFeatures.sitemap` | boolean | `true` | Serve `GET /sitemap.xml` |
| `siteFeatures.llmsTxt` | boolean | `true` | Serve `GET /llms.txt` |
| `siteFeatures.collector` | boolean | `true` | Enable `POST /collect` |
| `siteFeatures.markdownNegotiation` | boolean | `true` | HTML/markdown on `GET /` |
| `siteFeatures.blog` | boolean | `false` | Enable `/blog` CRUD routes |
| `sitemapRoutes` | string[] | `["/"]` | Paths included in sitemap |
| `llmsTxt` | object | optional | Content for llms.txt |
| `dashboard.widgets` | array | optional | Seed dashboard layout |

## Data source providers

Only `"fixture"` and `"gsc"` are valid in OSS:

```typescript
dataSources: [
  { provider: "fixture", default: true },
  { provider: "gsc", apiKey: process.env.GSC_API_KEY, default: false },
]
```

## CLI scaffold

```bash
npx rankmyseo init
# or: pnpm exec rankmyseo-cli init
```

Generates a starter `rankmyseo.config.ts` with `blog: false`. Refuses to overwrite an existing file.

Load at runtime:

```typescript
import { loadRankMySeoConfig } from "@rankmyseo/core";
const config = await loadRankMySeoConfig("rankmyseo.config.ts");
```

## Handler options

When using `createHandler` or `createRankMySeoApp`, pass:

```typescript
createHandler(store, {
  config: myConfig,
  agentModel: openai("gpt-4o"),  // optional — enables POST /agent/chat
});
```

Without `agentModel`, `/agent/chat` returns 503.
