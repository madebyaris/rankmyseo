# Roadmap and License

## License

**Apache License 2.0**

Copyright 2025 RankMySEO contributors.

You may use, modify, and distribute this software under Apache-2.0 terms. See the `LICENSE` file in the repository root.

## Product vision

RankMySEO is a **modular, embeddable SEO toolkit** — not a hosted SaaS lock-in. Bring your own hosting, database, and (optionally) AI keys.

### Principles

1. **Free-first data** — Google Search Console and fixture sources in OSS; paid SERP APIs reserved for commercial tier
2. **Server/client split** — heavy logic on server; React hooks are thin HTTP clients
3. **Opt-in features** — blog module, AI agent, and widgets are composable
4. **No consumer Tailwind tax** — `@rankmyseo/ui` ships self-contained CSS

## Milestones (high level)

Canonical milestone plan (M0–M5). Through M4 is implemented and verified offline (fixture datasource + mock LLM); live GSC/PSI/LLM paths are implemented but unverified without keys.

| Milestone | Status | Scope |
| --- | --- | --- |
| **M0 — Skeleton** | Done | Monorepo, `@rankmyseo/core` ports + Zod models, SQLite store, Hono adapter, Vitest |
| **M1 — Rank tracking** | Done | GSC/fixture datasource, scheduler port, snapshot ingestion, React hooks, rank chart widget |
| **M2 — Audits & reports** | Done | On-page audit engine, Core Web Vitals, report rollups (SQLite; Postgres deferred to M5) |
| **M3 — Agent layer** | Done | AI SDK tools + MCP, dashboard config + widget registry, `needsApproval` on mutating tools |
| **M4 — Site integration** | Done | On-page collector + score, live scan, meta/schema generators, sitemap, agent-readiness (`llms.txt`, markdown negotiation), optional blog |
| **M5 — Ecosystem** | Planned | More framework adapters (Next, SvelteKit, Express), Postgres/Prisma/Kysely storage, docs site |

**Beyond M5 (exploratory, unscheduled):** WordPress plugin (PHP wrapper around the server) and a hosted SaaS tier with paid SERP providers (kept out of OSS by design).

Exact internal milestone detail is in the local `PRD.md` (gitignored, not published).

## What's in OSS today

- Full monorepo: core, storage, server, react, ui, agent, cli
- Reference dashboard and playground apps
- Fixture + GSC datasource adapters
- Blog module (API + BlogManager widget)
- Website scan and meta generation
- Apache-2.0 license

## What's not in OSS (yet)

- Paid SERP rank providers
- Hosted SaaS deployment
- WordPress plugin package

## Links

- Repository: https://github.com/madebyaris/rankmyseo
- Wiki home: [[Home]]
- Issues and feature requests: GitHub Issues

## Trademark

"RankMySEO" is the project name. Third-party integrations (Google, etc.) are trademarks of their respective owners.
