# @rankmyseo/storage

## 1.0.0

### Minor Changes

- 2aa22cb: Make backend packages portable on generic Node by removing the Next-specific `server-only` runtime guard, add `basePath` mounting for `createHandler`, and lazy-load scanner/agent on demand.
- c801bcf: Add Postgres (Drizzle) to `@rankmyseo/storage`, plus optional `@rankmyseo/storage-prisma` and `@rankmyseo/storage-kysely` RankStore adapters with contract tests against real Postgres. MySQL remains unsupported with a clear factory error.

### Patch Changes

- 2dd96f1: Isolate Postgres contract tests across storage adapters (per-database CI URLs) and retry concurrent CREATE TABLE races.
  - @rankmyseo/core@1.0.0

## 0.2.0

### Minor Changes

- Add Schema.org JSON-LD generator (Article, Product, FAQPage, BreadcrumbList, Organization) with POST /schema/generate, useSchemaGenerator hook, dashboard Schema panel, agent/MCP tools, and jsonLdTypes detection in live scans.

### Patch Changes

- Updated dependencies
  - @rankmyseo/core@0.2.0

## 0.1.1

### Patch Changes

- Add per-package README files and npm metadata (`repository`, `homepage`, `bugs`, `keywords`, `engines.node`) so each package page renders docs and links back to the GitHub repository.
- Updated dependencies
  - @rankmyseo/core@0.1.1

## 0.1.0

### Minor Changes

- 5cf1ada: M1–M4 feature verticals: audit engine, reports, datasource/scheduler, full server API, AI agent + MCP, React hooks, shadcn dashboard UI, CLI, and reference apps.

### Patch Changes

- Updated dependencies [5cf1ada]
  - @rankmyseo/core@0.1.0
