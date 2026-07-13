# @rankmyseo/collector

Framework-neutral on-page SEO signal collector. Gathers DOM signals and optional Core Web Vitals, then POSTs them to RankMySEO `POST /collect`.

## Install

```bash
npm i @rankmyseo/collector
```

## Usage

```ts
import {
  collectPageSignals,
  postPageSignals,
  startPageCollector,
} from "@rankmyseo/collector";

const signals = collectPageSignals();

await postPageSignals({
  baseUrl: "/api/rankmyseo",
  tenantId: "tenant-a",
  projectId: "project-1",
});

const dispose = startPageCollector({
  baseUrl: "/api/rankmyseo",
  tenantId: "tenant-a",
  projectId: "project-1",
  delayMs: 3000,
});

// later
dispose();
```

`startPageCollector` returns an idempotent dispose function. Inject `document` / `location` via `collectPageSignals({ document, location })` in tests.

## License

Apache-2.0
