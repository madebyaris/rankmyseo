---
"@rankmyseo/storage": patch
"@rankmyseo/storage-prisma": patch
"@rankmyseo/storage-kysely": patch
---

Isolate Postgres contract tests across storage adapters (per-database CI URLs) and retry concurrent CREATE TABLE races.
