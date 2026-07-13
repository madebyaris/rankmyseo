# @rankmyseo/server-hono

[Hono](https://hono.dev) adapter for [RankMySEO](https://github.com/madebyaris/rankmyseo) — mounts the full `@rankmyseo/server` API as a Hono app in a few lines. Requires **Node.js ≥ 20**.

## Install

```bash
npm i @rankmyseo/server-hono @rankmyseo/core @rankmyseo/storage hono
```

`hono` is a peer dependency.

## Usage

```ts
import { defineConfig } from "@rankmyseo/core";
import { createStore } from "@rankmyseo/storage";
import { createRankMySeoApp } from "@rankmyseo/server-hono";

const store = createStore("sqlite:///path/to/db.sqlite");

const config = defineConfig({
  databaseUrl: "sqlite:///path/to/db.sqlite",
  tenantId: "tenant-a",
  projectId: "project-1",
  dataSources: [{ provider: "fixture", default: true }],
});

export default createRankMySeoApp(store, { config });
```

Pass `basePath` through options when mounting under a subpath (same as `createHandler`):

```ts
createRankMySeoApp(store, { config, basePath: "/api/rankmyseo" });
```

## Documentation

See the [Wiki → Getting Started](https://github.com/madebyaris/rankmyseo/wiki/Getting-Started).

## License

Apache-2.0
