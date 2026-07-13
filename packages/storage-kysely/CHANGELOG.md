# @rankmyseo/storage-kysely

## 1.0.0

### Minor Changes

- c801bcf: Add Postgres (Drizzle) to `@rankmyseo/storage`, plus optional `@rankmyseo/storage-prisma` and `@rankmyseo/storage-kysely` RankStore adapters with contract tests against real Postgres. MySQL remains unsupported with a clear factory error.

### Patch Changes

- 2dd96f1: Isolate Postgres contract tests across storage adapters (per-database CI URLs) and retry concurrent CREATE TABLE races.
  - @rankmyseo/core@1.0.0
