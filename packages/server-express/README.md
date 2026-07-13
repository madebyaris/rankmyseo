# @rankmyseo/server-express

[Express](https://expressjs.com) adapter for [RankMySEO](https://github.com/madebyaris/rankmyseo) — mounts the full `@rankmyseo/server` API as Express middleware. Requires **Node.js ≥ 20**.

## Install

```bash
npm i @rankmyseo/server-express @rankmyseo/core @rankmyseo/storage express
```

`express` is a peer dependency (`^4` or `^5`).

## Usage

```ts
import express from "express";
import { defineConfig } from "@rankmyseo/core";
import { createStore } from "@rankmyseo/storage";
import { createRankMySeoExpress } from "@rankmyseo/server-express";

const store = createStore("sqlite:///path/to/db.sqlite");

const config = defineConfig({
  databaseUrl: "sqlite:///path/to/db.sqlite",
  tenantId: "tenant-a",
  projectId: "project-1",
  dataSources: [{ provider: "fixture", default: true }],
});

const app = express();
app.use(createRankMySeoExpress(store, { config }));
app.listen(3000);
```

Mount under a subpath with matching `basePath` (the adapter uses `req.originalUrl`):

```ts
app.use(
  "/api/rankmyseo",
  createRankMySeoExpress(store, { config, basePath: "/api/rankmyseo" }),
);
```

### `toNodeHandler`

Wrap any `(Request) => Promise<Response>` handler (including raw `createHandler`) as Express middleware:

```ts
import { createHandler } from "@rankmyseo/server";
import { toNodeHandler } from "@rankmyseo/server-express";

app.use(toNodeHandler(createHandler(store, { config })));
```

Streaming responses (e.g. agent chat) are piped from the Web `Response` body onto Express `res` as a best-effort stream.

## Documentation

See the [Wiki → Getting Started](https://github.com/madebyaris/rankmyseo/wiki/Getting-Started).

## License

Apache-2.0
