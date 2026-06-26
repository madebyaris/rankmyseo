# Data Sources

Rank data flows through the `RankDataSource` port. OSS ships **free-first** providers only.

## Providers

| Provider | ID | Owned sites only | Realtime | Competitors |
| --- | --- | --- | --- | --- |
| **fixture** | `fixture` | No | No | No |
| **Google Search Console** | `gsc` | Yes | No | No |

PageSpeed Insights (`PsiClient`) is a separate utility for CWV metrics, not a rank datasource.

## Configuration

```typescript
dataSources: [
  { provider: "fixture", default: true },
  {
    provider: "gsc",
    apiKey: process.env.GSC_API_KEY,
    default: false,
  },
]
```

## Factory

```typescript
import { createDataSource, createDefaultDataSource } from "@rankmyseo/datasource";

const source = createDefaultDataSource({
  configs: config.dataSources,
  siteUrl: "https://example.com",
});

const snapshots = await source.fetchPositions({
  tenantId: "tenant-a",
  projectId: "project-1",
  keywordIds: ["kw-1", "kw-2"],
  country: "us",
  device: "desktop",
});
```

## Fixture (offline default)

Deterministic fake positions for development and CI. No API keys required. Used in playground and all automated tests.

## Google Search Console

Uses your site's **owned** Search Console data — the same free-first approach as Rank Math and similar WordPress plugins. Requires a valid API key and verified site.

**Status:** Implemented but unverified without live GSC credentials in CI.

## PageSpeed Insights

```typescript
import { PsiClient } from "@rankmyseo/datasource";

const psi = new PsiClient({ apiKey: process.env.PSI_API_KEY });
const vitals = await psi.fetchWebVitals("https://example.com");
```

Used by the on-page collector and audit CWV rules.

## Scheduled ingestion

```bash
pnpm exec rankmyseo schedule
```

Runs one ingestion pass: reads keywords, calls default datasource, appends snapshots.

With `NodeCronScheduler`:

```typescript
import { NodeCronScheduler } from "@rankmyseo/scheduler";
import { createIngestJob } from "@rankmyseo/scheduler";
```

## OSS vs SaaS

Paid SERP brokers (DataForSEO, Serper, etc.) are **not** included in the open-source package. The architecture supports custom `RankDataSource` implementations for a future commercial SaaS tier.

To build a custom adapter:

```typescript
class MyDataSource implements RankDataSource {
  readonly id = "my-provider";
  readonly capabilities = { ownedOnly: false, realtime: true, competitors: true };
  async fetchPositions(input) { /* … */ }
}
```

## Adding a provider (contributors)

1. Implement `RankDataSource` in `packages/datasource/src/`
2. Add provider to `dataSourceProviderSchema` in core
3. Wire case in `factory.ts`
4. Add unit tests with mocked fetch
