# @rankmyseo/storage

Default storage adapter for [RankMySEO](https://github.com/madebyaris/rankmyseo) — a Drizzle ORM implementation of the `RankStore` port for **SQLite** and **Postgres**. Server-only.

## Install

```bash
npm i @rankmyseo/storage @rankmyseo/core
```

## Usage

```ts
import { createStore } from "@rankmyseo/storage";

// SQLite
const sqlite = createStore("sqlite:///path/to/db.sqlite");

// Postgres
const postgres = createStore("postgres://user:pass@localhost:5432/rankmyseo");
```

`createStore(url)` routes by scheme:

| URL | Adapter |
| --- | --- |
| `sqlite://…` / `:memory:` | Drizzle + better-sqlite3 |
| `postgres://…` / `postgresql://…` | Drizzle + `pg` |
| `mysql://…` | **Not supported** — throws a clear error |

Tables are created automatically on first use (inline DDL). Use `npx rankmyseo migrate` or `npx rankmyseo-cli migrate` to initialize without starting a server.

You can also call `createSqliteStore(path)` or `createPostgresStore(url)` directly.

### Contract tests against Postgres

```bash
export RANKMYSEO_POSTGRES_URL=postgres://test:test@localhost:5432/rankmyseo
pnpm --filter @rankmyseo/storage test
```

Tests skip when neither `RANKMYSEO_POSTGRES_URL` nor `DATABASE_URL` is set.

Not using Drizzle? Implement the `RankStore` port from `@rankmyseo/core` (or use `@rankmyseo/storage-prisma` / `@rankmyseo/storage-kysely`) and validate with `runStoreContractTests()`.

## Documentation

See the [Wiki → Packages](https://github.com/madebyaris/rankmyseo/wiki/Packages).

## License

Apache-2.0
