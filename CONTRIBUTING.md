# Contributing to RankMySEO

Thank you for helping improve RankMySEO. This monorepo uses **pnpm workspaces** and **Turborepo**.

## Prerequisites

- Node.js 20+
- pnpm 10+

## Required checks

Before opening a PR, run:

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
pnpm publint
```

CI runs the same commands on Node 20 and 22 for pushes and pull requests to `main`.

Optional locally:

```bash
pnpm test:coverage
```

## Adapter conformance

### Storage adapters

Any new `RankStore` implementation must pass the shared contract suite:

```typescript
import { runStoreContractTests } from "@rankmyseo/core/testing";

runStoreContractTests(() => createYourStore());
```

See `packages/storage/src/sqlite-store.test.ts` for the reference usage.

### Server adapters

Any new HTTP framework adapter (Next.js, SvelteKit, Express, etc.) must pass:

```typescript
import { defineConfig, runServerAdapterContractTests } from "@rankmyseo/core/testing";
import { createHandler } from "@rankmyseo/server";

runServerAdapterContractTests({
  config,
  makeStore: () => createStore(":memory:"),
  makeHandler: (store) => createHandler(store, { config }),
});
```

See `packages/server-hono/src/smoke.test.ts` for the Hono reference adapter.

## Layer boundaries

- Backend packages target **Node.js ≥ 20** (not edge/Workers for the full stack).
- `@rankmyseo/react` and `@rankmyseo/ui` must not import storage, datasource, scheduler, agent, cli, or server.
- `pnpm lint` runs dependency-cruiser to enforce these boundaries.

## Changesets

User-facing package changes should include a changeset:

```bash
pnpm changeset
```

Release automation opens a version PR and publishes to npm when changesets are merged on `main`.

## Scope discipline

- Keep PRs focused — one workstream or feature at a time when possible.
- Match existing naming, exports, and error-handling patterns.
- Update wiki docs in `docs/wiki/` when behavior or public APIs change.

## License

Contributions are accepted under the project's Apache-2.0 license.
