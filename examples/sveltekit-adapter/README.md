# SvelteKit adapter fixture

RankMySEO works with [SvelteKit](https://kit.svelte.dev) using the native Web `Request` / `Response` bridge — no dedicated `@rankmyseo/server-*` package is required.

## Pattern

Place a catch-all route at `src/routes/api/rankmyseo/[...path]/+server.ts`:

```ts
import { defineConfig } from "@rankmyseo/core";
import { createStore } from "@rankmyseo/storage";
import { createHandler } from "@rankmyseo/server";

const store = createStore(process.env.DATABASE_URL!);
const config = defineConfig({
  databaseUrl: process.env.DATABASE_URL!,
  tenantId: "tenant-a",
  projectId: "project-1",
  dataSources: [{ provider: "fixture", default: true }],
});

const handler = createHandler(store, {
  config,
  basePath: "/api/rankmyseo",
});

export const GET = ({ request }: { request: Request }) => handler(request);
export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
```

This repo ships a small helper in [`src/+server.ts`](./src/+server.ts) that builds those exports.

## Verify

```bash
pnpm --filter @rankmyseo/example-sveltekit-adapter test
```

## Install (in a real SvelteKit app)

```bash
npm i @rankmyseo/core @rankmyseo/storage @rankmyseo/server
```
