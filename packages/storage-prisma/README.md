# @rankmyseo/storage-prisma

Prisma implementation of the RankMySEO `RankStore` port (Postgres).

## Install

```bash
npm i @rankmyseo/storage-prisma @rankmyseo/core @prisma/client
npm i -D prisma
```

## Schema bootstrap

This package ships `prisma/schema.prisma` matching the RankMySEO tables (`rms_*`).

### Option A — auto DDL (dev / tests)

`createPrismaStore(url)` runs `CREATE TABLE IF NOT EXISTS` via `$executeRawUnsafe` on first use. Fine for local contract tests.

### Option B — Prisma Migrate (recommended for production)

```bash
# Point Prisma at this package's schema
export DATABASE_URL=postgres://user:pass@localhost:5432/rankmyseo

# From your app (or copy schema into your Prisma project):
npx prisma db push --schema=node_modules/@rankmyseo/storage-prisma/prisma/schema.prisma
# or: prisma migrate deploy with migrations you maintain from that schema
```

Generate the client after installing:

```bash
npx prisma generate --schema=node_modules/@rankmyseo/storage-prisma/prisma/schema.prisma
```

In this monorepo, `pnpm --filter @rankmyseo/storage-prisma build` runs `prisma generate` automatically.

## Usage

```ts
import { createPrismaStore } from "@rankmyseo/storage-prisma";

const store = createPrismaStore(process.env.DATABASE_URL!);
```

## Contract tests

```bash
export RANKMYSEO_POSTGRES_URL=postgres://test:test@localhost:5432/rankmyseo
pnpm --filter @rankmyseo/storage-prisma test
```

Tests skip when neither `RANKMYSEO_POSTGRES_URL` nor `DATABASE_URL` is set.

## License

Apache-2.0
