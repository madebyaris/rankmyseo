# @rankmyseo/cli

Command-line tools for [RankMySEO](https://github.com/madebyaris/rankmyseo) — scaffold config, run migrations, and register scheduled rank-ingestion jobs.

## Install

```bash
npm i -D @rankmyseo/cli
# or run ad-hoc:
npx @rankmyseo/cli init
```

## Commands

```bash
rankmyseo init       # scaffold rankmyseo.config.ts
rankmyseo migrate    # run SQLite migrations
rankmyseo schedule   # register cron ingestion job (requires config)
```

## Documentation

See the [Wiki → Configuration](https://github.com/madebyaris/rankmyseo/wiki/Configuration).

## License

Apache-2.0
