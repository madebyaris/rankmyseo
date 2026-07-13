# @rankmyseo/cli

Command-line tools for [RankMySEO](https://github.com/madebyaris/rankmyseo) — interactive package install, scaffold config, run migrations, and schedule jobs.

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
rankmyseo-cli version    # print CLI version
```

When you use the [`rankmyseo`](https://www.npmjs.com/package/rankmyseo) meta package, the same commands are available as `npx rankmyseo …` (including `init` / `migrate` after `@rankmyseo/cli` is installed).

## Documentation

See the [Wiki → Configuration](https://github.com/madebyaris/rankmyseo/wiki/Configuration).

## License

Apache-2.0
