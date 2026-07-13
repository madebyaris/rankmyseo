# Development

Monorepo managed with **pnpm workspaces** and **Turborepo**.

## Prerequisites

- Node.js 20+
- pnpm 10+

## Install

```bash
git clone https://github.com/madebyaris/rankmyseo.git
cd rankmyseo
pnpm install
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm build` | Build all packages |
| `pnpm test` | Run Vitest across workspace |
| `pnpm typecheck` | TypeScript check all packages |
| `pnpm lint` | `tsc --noEmit` per package + dependency-cruiser |
| `pnpm publint` | Package export hygiene |
| `pnpm test:coverage` | Vitest coverage across packages |
| `pnpm dev:playground` | API server on `:3456` |
| `pnpm dev:dashboard` | Reference dashboard on `:5173` |

## Project layout

```
rankmyseo/
├── apps/
│   ├── dashboard/     # Reference UI (shadcn shell + @rankmyseo/ui widgets)
│   └── playground/    # Demo API server + seed data
├── packages/
│   ├── core/          # Schemas, engines, ports
│   ├── storage/       # SQLite repos
│   ├── datasource/    # GSC, fixture, PSI
│   ├── scheduler/     # Ingestion jobs
│   ├── server/        # HTTP routes
│   ├── server-hono/   # Hono adapter
│   ├── server-express/# Express adapter
│   ├── server-next/   # Next.js App Router adapter
│   ├── server-nitro/  # Nitro/h3 adapter
│   ├── react/         # Hooks + provider
│   ├── ui/            # Widget components + CSS
│   ├── agent/         # AI agent tools
│   ├── scanner/       # SSRF-safe page fetch
│   └── cli/           # rankmyseo CLI (init/migrate/schedule/doctor/regression)
```

## Local workflow

Terminal 1 — API:

```bash
pnpm dev:playground
```

Terminal 2 — Dashboard:

```bash
pnpm dev:dashboard
```

Open http://localhost:5173. Default tenant/project headers match playground seeds.

## Configuration file

Playground loads `rankmyseo.config.ts` from repo root (or app directory). See [[Configuration]].

## Testing

```bash
pnpm test                    # all
pnpm --filter @rankmyseo/core test
```

Tests use fixture datasource — no external API keys required.

## Adding a package

1. Create under `packages/<name>/`
2. Add to `pnpm-workspace.yaml` if needed
3. Reference workspace deps as `"@rankmyseo/foo": "workspace:*"`
4. Export from `package.json` `"exports"` field

## Database

SQLite file created on first server start. Blog posts, keywords, snapshots, dashboard config, audits — all in `rms_*` tables.

Reset: delete the `.db` file and restart playground (seeds re-run).

## Contributing

1. Fork and branch from `main`
2. Keep changes scoped — one feature per PR
3. Run `pnpm build && pnpm test && pnpm typecheck && pnpm lint && pnpm publint`
4. See [CONTRIBUTING.md](https://github.com/madebyaris/rankmyseo/blob/main/CONTRIBUTING.md) for adapter conformance expectations
5. Apache-2.0 — contributions under same license

## Internal docs

`PRD.md` is gitignored (product requirements, local only). Public docs live in this wiki and `README.md`.

See [[Roadmap-and-License]] for license and roadmap summary.
