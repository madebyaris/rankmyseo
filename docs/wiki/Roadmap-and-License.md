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

| Milestone | Status | Scope |
| --- | --- | --- |
| M1 Core + storage | Done | Schemas, SQLite, config |
| M2 Rank tracking | Done | Keywords, snapshots, datasource port |
| M3 Audits + reports | Done | On-page rules, CWV, reports |
| M4 Scan + meta + blog | Done | Live scan, meta gen, optional blog |
| M5 Dashboard widgets | Done | KeywordTable, charts, BlogManager |
| M6 AI agent | Partial | Tools defined; LLM wiring optional |
| M7 WordPress plugin | Planned | PHP wrapper around server |
| M8 SaaS tier | Planned | Hosted rank APIs, multi-tenant |

Exact internal milestone detail is in local `PRD.md` (not in git).

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
- Official npm publish (packages are workspace-local for now)

## Links

- Repository: https://github.com/madebyaris/rankmyseo
- Wiki home: [[Home]]
- Issues and feature requests: GitHub Issues

## Trademark

"RankMySEO" is the project name. Third-party integrations (Google, etc.) are trademarks of their respective owners.
