# RankMySEO examples

Thin, executable fixtures that show how to mount RankMySEO in frameworks that already speak Web `Request` / `Response`. These are not full apps — copy the pattern into your project.

| Example | Framework | Approach |
| --- | --- | --- |
| [sveltekit-adapter](./sveltekit-adapter/) | SvelteKit | `createHandler` in `+server.ts` |
| [astro-adapter](./astro-adapter/) | Astro | `createHandler` in `pages/api/.../[...path].ts` |

## Published adapters

For Express, Next.js App Router, Nitro/h3, and Hono, use the packages:

| Package | Entry |
| --- | --- |
| `@rankmyseo/server-hono` | `createRankMySeoApp` |
| `@rankmyseo/server-express` | `createRankMySeoExpress` |
| `@rankmyseo/server-next` | `createRankMySeoRouteHandlers` |
| `@rankmyseo/server-nitro` | `createRankMySeoNitroHandler` |

## Run fixture tests

```bash
pnpm --filter @rankmyseo/example-sveltekit-adapter test
pnpm --filter @rankmyseo/example-astro-adapter test
```
