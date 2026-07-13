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
    // { provider: "gsc", apiKey: process.env.GSC_ACCESS_TOKEN, default: true },
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

  // Opt-in SEO regression gate (see Wiki → SEO-Regression)
  regression: {
    enabled: false,
    productionUrl: "https://www.example.com",
    alwaysRoutes: ["/"],
    routeMap: [
      { files: ["app/**/*.tsx", "pages/**/*.tsx"], routes: ["/", "/about"] },
    ],
    failOn: "error",
    timeoutMs: 10_000,
    maxBytes: 1_500_000,
  },
});
```

## Fields

| Field | Type | Default | Description |
| --- | --- | --- |
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
| `regression` | object | optional | Opt-in production vs preview SEO regression gate |

### `regression` fields

| Field | Type | Default | Description |
| --- | --- | --- |
| `enabled` | boolean | `false` | Must be true for `regression check` |
| `productionUrl` | string (URL) | optional | Live production origin |
| `alwaysRoutes` | string[] | `[]` | Routes always scanned |
| `routeMap` | `{ files, routes }[]` | `[]` | Changed-file globs → routes |
| `failOn` | `"error"` \| `"warning"` | `"error"` | Severity gate for exit `1` |
| `timeoutMs` | number | `10000` | Per-request scan timeout |
| `maxBytes` | number | `1500000` | Max response body bytes |

## Data source providers

Only `"fixture"` and `"gsc"` are valid in OSS:

```typescript
dataSources: [
  { provider: "fixture", default: true },
  // Config field remains `apiKey` for backwards compatibility; GscDataSource expects an OAuth access token.
  { provider: "gsc", apiKey: process.env.GSC_ACCESS_TOKEN, default: false },
]
```

## CLI scaffold

```bash
npx rankmyseo init
# or: pnpm exec rankmyseo-cli init
```

Generates a starter `rankmyseo.config.ts` with `blog: false` and `regression.enabled: false`. Refuses to overwrite an existing file.

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
  agentModel: openai("gpt-4o"), // optional — enables POST /agent/chat
  authorize: async (request, scope) => {
    // Scope headers select tenant/project — they do not authenticate.
    // Return a Response to deny; return void/undefined to allow.
  },
});
```

Without `agentModel`, `/agent/chat` returns 503.

See also [[SEO-Regression]] for the CI gate CLI.
