# @rankmyseo/cli

Command-line tools for [RankMySEO](https://github.com/madebyaris/rankmyseo) — interactive package install, scaffold config, run migrations, schedule jobs, doctor checks, and SEO regression gates.

## Install

Prefer the meta installer (includes this CLI in the recommended preset):

```bash
npm i rankmyseo
npx rankmyseo install
```

Or install the CLI directly:

```bash
npm i -D @rankmyseo/cli
npx rankmyseo-cli install --preset recommended
```

## Commands

```bash
rankmyseo-cli install [--preset recommended|full|custom] [--packages a,b] [--yes]
rankmyseo-cli init       # scaffold rankmyseo.config.ts
rankmyseo-cli migrate    # initialize SQLite schema via createStore()
rankmyseo-cli schedule   # run one rank ingestion pass (reads rankmyseo.config.ts when present)
rankmyseo-cli doctor     # validate config + storage wiring
rankmyseo-cli regression check --candidate-url <preview> [--base-ref sha] [--head-ref HEAD] [--all-routes] [--json]
rankmyseo-cli version    # print CLI version
```

### `regression check`

Compares production pages with a CI-supplied preview URL using `regression.routeMap` in config.

| Exit code | Meaning |
| --- | --- |
| `0` | No gated regressions |
| `1` | Findings at/above `failOn` |
| `2` | Config / network / runtime failure |

When you use the [`rankmyseo`](https://www.npmjs.com/package/rankmyseo) meta package, the same commands are available as `npx rankmyseo …` (including `init` / `migrate` after `@rankmyseo/cli` is installed).

## Documentation

See the [Wiki → Configuration](https://github.com/madebyaris/rankmyseo/wiki/Configuration) and [Wiki → SEO Regression](https://github.com/madebyaris/rankmyseo/wiki/SEO-Regression).

## License

Apache-2.0
