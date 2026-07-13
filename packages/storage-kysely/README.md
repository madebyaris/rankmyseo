# @rankmyseo/storage-kysely

Kysely + `pg` implementation of the RankMySEO `RankStore` port (Postgres).

## Install

```bash
npm i @rankmyseo/storage-kysely @rankmyseo/core
```

## Usage

```ts
import { createKyselyStore } from "@rankmyseo/storage-kysely";

const store = createKyselyStore(process.env.DATABASE_URL!);
```

Tables are created automatically on first use (`CREATE TABLE IF NOT EXISTS`).

## Contract tests

```bash
export RANKMYSEO_POSTGRES_URL=postgres://test:test@localhost:5432/rankmyseo
pnpm --filter @rankmyseo/storage-kysely test
```

Tests skip when neither `RANKMYSEO_POSTGRES_URL` nor `DATABASE_URL` is set.

## License

Apache-2.0
