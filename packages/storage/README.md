# @rankmyseo/storage

Default storage adapter for [RankMySEO](https://github.com/madebyaris/rankmyseo) — a Drizzle ORM implementation of the `RankStore` port (SQLite today; Postgres/MySQL planned). Server-only.

## Install

```bash
npm i @rankmyseo/storage @rankmyseo/core
```

## Usage

```ts
import { createStore } from "@rankmyseo/storage";

const store = createStore("sqlite:///path/to/db.sqlite");

await store.projects.create({
  id: "project-1",
  tenantId: "tenant-a",
  name: "My Site",
  domain: "example.com",
});
```

The factory selects the dialect from the connection string. Tables are created automatically on first `createStore()` (inline DDL). Use `npx rankmyseo migrate` or `npx rankmyseo-cli migrate` to initialize the database file without starting a server.

Not using Drizzle? Implement the `RankStore` port from `@rankmyseo/core` and validate it with `runStoreContractTests()`.

## Documentation

See the [Wiki → Data Sources / Storage](https://github.com/madebyaris/rankmyseo/wiki).

## License

Apache-2.0
