# @rankmyseo/scheduler

Scheduler adapters for [RankMySEO](https://github.com/madebyaris/rankmyseo) rank-ingestion jobs — `NodeCronScheduler` for production and `ManualScheduler` for tests/dev. Implements the `Scheduler` port from `@rankmyseo/core`. Server-only.

## Install

```bash
npm i @rankmyseo/scheduler @rankmyseo/core
```

## Usage

```ts
import { NodeCronScheduler } from "@rankmyseo/scheduler";

const scheduler = new NodeCronScheduler();
scheduler.register("0 6 * * *", async () => {
  // run rank ingestion
});
```

## Documentation

See the [Wiki](https://github.com/madebyaris/rankmyseo/wiki).

## License

Apache-2.0
