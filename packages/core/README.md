# @rankmyseo/core

Headless core for [RankMySEO](https://github.com/madebyaris/rankmyseo) — domain models, Zod schemas, the SEO audit engine, report rollups, and the port interfaces (`RankStore`, `RankDataSource`, `Scheduler`). **Zero framework or database dependencies.**

## Install

```bash
npm i @rankmyseo/core
```

## What's inside

- **Zod schemas** — `Project`, `Keyword`, `RankSnapshot`, `Audit`, `Report`, `PageSignals`, `DashboardConfig`, …
- **Audit engine** — `runAuditChecks(signals)` scores a page across 16 on-page checks (title, meta, headings, OG, JSON-LD, HTTPS, indexability, viewport, lang, image alt, content depth, and Core Web Vitals incl. INP).
- **HTML parser** — `extractPageSignals(html, url)` (dependency-free, runs anywhere).
- **Recommendations** — `buildAuditRecommendations`, `buildBlogRecommendations`.
- **Ports** — implement `RankStore` and validate it with `runStoreContractTests()` from `@rankmyseo/core/testing`.

## Usage

```ts
import { extractPageSignals, runAuditChecks, buildAuditRecommendations } from "@rankmyseo/core";

const signals = extractPageSignals(html, "https://example.com");
const { score, checks } = runAuditChecks(signals);
const recommendations = buildAuditRecommendations(checks);
```

## Documentation

See the [README](https://github.com/madebyaris/rankmyseo#readme) and the [Wiki](https://github.com/madebyaris/rankmyseo/wiki).

## License

Apache-2.0
