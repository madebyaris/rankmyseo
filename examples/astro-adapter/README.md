# Astro adapter fixture

RankMySEO works with [Astro](https://astro.build) API routes using the native Web `Request` / `Response` bridge — no dedicated `@rankmyseo/server-*` package is required.

## Pattern

`src/pages/api/rankmyseo/[...path].ts`:

```ts
import { defineConfig } from "@rankmyseo/core";
import { createStore } from "@rankmyseo/storage";
import { createHandler } from "@rankmyseo/server";

const store = createStore(import.meta.env.DATABASE_URL);
const config = defineConfig({
  databaseUrl: import.meta.env.DATABASE_URL,
  tenantId: "tenant-a",
  projectId: "project-1",
  dataSources: [{ provider: "fixture", default: true }],
});

const handler = createHandler(store, {
  config,
  basePath: "/api/rankmyseo",
});

/** Handle all methods for the catch-all API path. */
export const ALL = ({ request }: { request: Request }) => handler(request);
```

This repo ships the same helper in [`src/pages/api/rankmyseo/[...path].ts`](./src/pages/api/rankmyseo/[...path].ts).

Astro endpoints run on the server; use a Node adapter (or hybrid output) so SQLite / full RankMySEO stack can run.

## Verify

```bash
pnpm --filter @rankmyseo/example-astro-adapter test
```

## Install (in a real Astro app)

```bash
npm i @rankmyseo/core @rankmyseo/storage @rankmyseo/server
```
