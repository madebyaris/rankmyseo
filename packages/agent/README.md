# @rankmyseo/agent

AI agent layer for [RankMySEO](https://github.com/madebyaris/rankmyseo) — [Vercel AI SDK](https://ai-sdk.dev) tool definitions plus a [Model Context Protocol](https://modelcontextprotocol.io) server, so an LLM can read a user's SEO data and customize the dashboard (approval-gated). Server-only.

## Install

```bash
npm i @rankmyseo/agent @rankmyseo/core
```

## Tools

`queryRankHistory`, `listKeywords` / `addKeyword`, `runAudit` / `getAudit`, `getDashboardConfig`, `updateDashboardConfig` (approval-gated), `explainMetric`.

Mutations are Zod-validated; destructive changes require explicit approval. The agent edits the **dashboard config schema only** — never app code or raw SQL.

## Documentation

See the [Wiki → AI Agent](https://github.com/madebyaris/rankmyseo/wiki/AI-Agent).

## License

Apache-2.0
