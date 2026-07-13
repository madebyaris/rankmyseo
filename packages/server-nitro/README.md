# @rankmyseo/server-nitro

[Nitro](https://nitro.build) / [h3](https://h3.dev) adapter for [RankMySEO](https://github.com/madebyaris/rankmyseo) — use from Nuxt server routes or standalone Nitro. Requires **Node.js ≥ 20**.

## Install

```bash
npm i @rankmyseo/server-nitro @rankmyseo/core @rankmyseo/storage h3
```

`h3` is a peer dependency (`^1` — the version shipped with Nitro / Nuxt 3).

## Usage — Nitro / Nuxt catch-all

`server/api/rankmyseo/[...].ts`:

```ts
import { defineConfig } from "@rankmyseo/core";
import { createStore } from "@rankmyseo/storage";
import { createRankMySeoNitroHandler } from "@rankmyseo/server-nitro";

const store = createStore(process.env.DATABASE_URL!);

const config = defineConfig({
  databaseUrl: process.env.DATABASE_URL!,
  tenantId: "tenant-a",
  projectId: "project-1",
  dataSources: [{ provider: "fixture", default: true }],
});

export default createRankMySeoNitroHandler(store, {
  config,
  basePath: "/api/rankmyseo",
});
```

The adapter converts the h3 event with `toWebRequest`, calls `createHandler`, and writes the result with `sendWebResponse` (streaming-friendly when the runtime supports it).

## Documentation

See the [Wiki → Getting Started](https://github.com/madebyaris/rankmyseo/wiki/Getting-Started).

## License

Apache-2.0
