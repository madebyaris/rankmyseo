# @rankmyseo/server-next

[Next.js](https://nextjs.org) App Router adapter for [RankMySEO](https://github.com/madebyaris/rankmyseo). Thin wrapper around `createHandler` — route handlers receive Web `Request` and return `Response`. Requires **Node.js ≥ 20**.

## Install

```bash
npm i @rankmyseo/server-next @rankmyseo/core @rankmyseo/storage
```

`next` is an optional peer dependency (types/docs only — this package does not import Next.js).

## Runtime

RankMySEO needs the **Node.js** runtime (not Edge). Re-export the provided constant from your route module:

```ts
export { runtime } from "@rankmyseo/server-next";
// → "nodejs"
```

## Usage — catch-all App Router route

`app/api/rankmyseo/[[...path]]/route.ts`:

```ts
import { defineConfig } from "@rankmyseo/core";
import { createStore } from "@rankmyseo/storage";
import {
  createRankMySeoRouteHandlers,
  runtime,
} from "@rankmyseo/server-next";

const store = createStore(process.env.DATABASE_URL!);

const config = defineConfig({
  databaseUrl: process.env.DATABASE_URL!,
  tenantId: "tenant-a",
  projectId: "project-1",
  dataSources: [{ provider: "fixture", default: true }],
});

export { runtime };

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD } =
  createRankMySeoRouteHandlers(store, {
    config,
    basePath: "/api/rankmyseo",
  });
```

## Single handler

```ts
import { createRankMySeoNextHandler } from "@rankmyseo/server-next";

const handler = createRankMySeoNextHandler(store, { config, basePath: "/api/rankmyseo" });
export { handler as GET, handler as POST };
```

## Documentation

See the [Wiki → Getting Started](https://github.com/madebyaris/rankmyseo/wiki/Getting-Started).

## License

Apache-2.0
