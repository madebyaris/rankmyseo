# RankMySEO Wiki

Welcome to the **RankMySEO** documentation wiki — an open-source, framework-agnostic SEO toolkit for JavaScript/TypeScript.

**Repository:** [github.com/madebyaris/rankmyseo](https://github.com/madebyaris/rankmyseo)  
**License:** Apache-2.0  
**Status:** M0–M5 implemented (ecosystem adapters shipped); published on npm under the [`@rankmyseo`](https://www.npmjs.com/org/rankmyseo) scope (v0.3.x).

---

## What is RankMySEO?

RankMySEO is a **composable npm package set** — not a hosted SaaS iframe. You bring your own database, framework, and deployment. The core ships with:

- Keyword and rank snapshot tracking
- SEO audit engine with live URL scanning
- Meta tag generation (title, OG, JSON-LD)
- Optional blog module with keyword intent and recommendations
- Report rollups and customizable dashboard widgets
- AI agent layer for dashboard customization (AI SDK + MCP)
- Agent-readiness site features (`llms.txt`, markdown negotiation) for coding agents — not SEO ranking levers
- Framework adapters (Hono, Express, Next, Nitro) + SvelteKit/Astro via `createHandler`
- Storage: SQLite + Postgres (Drizzle), optional Prisma / Kysely
- Headless React / Vue / Svelte clients; React UI widgets; SEO regression CI gate

---

## Support matrix (summary)

| Surface | Support |
| --- | --- |
| Node.js ≥ 20 full stack | **Yes** |
| Edge / Cloudflare Workers (full stack) | **No** |
| React UI widgets (`@rankmyseo/ui`) | **Yes** |
| Vue / Svelte headless | **Yes** |
| Vue / Svelte UI widgets | **Deferred** |
| SQLite + Postgres (Drizzle / Prisma / Kysely) | **Yes** |
| MySQL | **No** |

Details: monorepo docs site (`apps/docs`, `pnpm --filter @rankmyseo/docs dev`) and [[Architecture]].

---

## Quick links

| Topic | Page |
| --- | --- |
| Install & first run | [[Getting-Started]] |
| System design & trust boundaries | [[Architecture]] |
| All npm packages | [[Packages]] |
| `rankmyseo.config.ts` reference | [[Configuration]] |
| HTTP API routes | [[API-Reference]] |
| Dashboard widgets & styling | [[Dashboard-and-Widgets]] |
| Optional blog module | [[Blog-Module]] |
| GSC, PSI, fixture datasources | [[Data-Sources]] |
| React hooks (`@rankmyseo/react`) | [[React-Hooks]] |
| AI agent & MCP tools | [[AI-Agent]] |
| SEO regression CI gate | [[SEO-Regression]] |
| Contributing & monorepo dev | [[Development]] |
| Roadmap & license | [[Roadmap-and-License]] |

External packages: [`@rankmyseo/client`](https://www.npmjs.com/package/@rankmyseo/client) · [`@rankmyseo/collector`](https://www.npmjs.com/package/@rankmyseo/collector) · adapters via [[Packages]].

---

## Apps (reference)

| App | Command | URL |
| --- | --- | --- |
| Playground (API + manual UI) | `pnpm dev:playground` | http://localhost:3456 |
| Dashboard (React demo) | `pnpm dev:playground` then `pnpm dev:dashboard` | http://localhost:5173 |
| Docs site (Astro + client dogfood) | `pnpm --filter @rankmyseo/docs dev` | http://localhost:4321 |

The dashboard proxies API calls to the playground on port **3456**.

---

## Design principles

1. **Headless core** — `@rankmyseo/core` has zero framework dependencies.
2. **Ports & adapters** — storage, datasources, scheduler, and server are swappable.
3. **Multi-tenant** — every row scoped by `tenantId` + `projectId`.
4. **Free-first OSS** — GSC, PSI, and fixture datasources; paid SERP brokers reserved for future SaaS.
5. **Modular UI** — `@rankmyseo/ui` uses custom CSS (shadcn-like); no Tailwind/shadcn required in consumer apps.
6. **Server-only secrets** — backend packages use `server-only` guards; React hooks talk HTTP only.
