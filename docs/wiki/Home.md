# RankMySEO Wiki

Welcome to the **RankMySEO** documentation wiki — an open-source, framework-agnostic SEO toolkit for JavaScript/TypeScript.

**Repository:** [github.com/madebyaris/rankmyseo](https://github.com/madebyaris/rankmyseo)  
**License:** Apache-2.0  
**Status:** M0–M4 implemented; packages not yet published to npm.

---

## What is RankMySEO?

RankMySEO is a **composable npm package set** — not a hosted SaaS iframe. You bring your own database, framework, and deployment. The core ships with:

- Keyword and rank snapshot tracking
- SEO audit engine with live URL scanning
- Meta tag generation (title, OG, JSON-LD)
- Optional blog module with keyword intent and recommendations
- Report rollups and customizable dashboard widgets
- AI agent layer for dashboard customization (AI SDK + MCP)

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
| Contributing & monorepo dev | [[Development]] |
| Roadmap & license | [[Roadmap-and-License]] |

---

## Apps (reference)

| App | Command | URL |
| --- | --- | --- |
| Playground (API + manual UI) | `pnpm dev:playground` | http://localhost:3456 |
| Dashboard (React demo) | `pnpm dev:playground` then `pnpm dev:dashboard` | http://localhost:5173 |

The dashboard proxies API calls to the playground on port **3456**.

---

## Design principles

1. **Headless core** — `@rankmyseo/core` has zero framework dependencies.
2. **Ports & adapters** — storage, datasources, scheduler, and server are swappable.
3. **Multi-tenant** — every row scoped by `tenantId` + `projectId`.
4. **Free-first OSS** — GSC, PSI, and fixture datasources; paid SERP brokers reserved for future SaaS.
5. **Modular UI** — `@rankmyseo/ui` uses custom CSS (shadcn-like); no Tailwind/shadcn required in consumer apps.
6. **Server-only secrets** — backend packages use `server-only` guards; React hooks talk HTTP only.
