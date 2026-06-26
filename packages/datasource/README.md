# @rankmyseo/datasource

Data-source adapters for [RankMySEO](https://github.com/madebyaris/rankmyseo). Free-first: Google Search Console (owned-site rank data) and PageSpeed Insights (Core Web Vitals), plus a deterministic **fixture** source for offline dev and CI. Server-only.

## Install

```bash
npm i @rankmyseo/datasource @rankmyseo/core
```

## Usage

```ts
import { FixtureDataSource } from "@rankmyseo/datasource";

const source = new FixtureDataSource();
const snapshots = await source.fetchPositions({ /* keywords, range */ });
```

Custom/commercial SERP providers plug into the same `RankDataSource` port from `@rankmyseo/core` — no core changes required.

## Documentation

See the [Wiki → Data Sources](https://github.com/madebyaris/rankmyseo/wiki/Data-Sources).

## License

Apache-2.0
