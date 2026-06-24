# RankMySEO — Product Requirements Document

> An open-source, framework-agnostic SEO toolkit for the JavaScript/TypeScript
> ecosystem — the power of a top WordPress SEO suite, as an npm package you drop
> into any JS/TS app — with first-class keyword/rank tracking, persistent reports,
> and an **AI agent layer** that understands your data and can reshape your dashboard.

- **Status:** Draft v0.1 (stack + architecture proposal)
- **Owner:** TBD
- **Last updated:** 2026-06-24
- **License:** MIT (intended)

---

## 1. Summary & motivation

Leading WordPress SEO suites are powerful but locked to the PHP/WordPress runtime.
Comparable products ship ~18 modules covering analytics, SEO analysis, content AI,
schema, redirections, 404 monitoring, sitemaps, local SEO, image SEO, and more.

**RankMySEO** re-imagines the high-value, stack-portable subset of that feature set
as a set of composable TypeScript packages that:

1. Run in **any JS/TS stack** (Next.js, Remix, SvelteKit, Nuxt, Astro, Hono,
   Express, Cloudflare Workers, plain Node) via a headless core + thin adapters.
2. **Persist** keyword rankings, SEO audits, and reports to a database the host
   app already uses (Postgres, SQLite/libSQL, MySQL, Cloudflare D1).
3. Expose an **interactive dashboard** (keyword tracking, rank history, audits,
   reports) as headless hooks + optional prebuilt UI.
4. Ship an **agent layer** (AI SDK tools + an MCP server) so an LLM can read the
   user's SEO data and **customize the default dashboard** on request.

### Non-goals (v1)

- Not a WordPress plugin and not a port of any existing SEO plugin. No PHP.
- Self-hosted / bring-your-own-keys. RankMySEO is an OSS package set; the
  port/adapter design (§4) keeps it deployment-agnostic without coupling to any
  specific hosting model.
- Clean-room, MIT; no third-party plugin code is copied.
- Backlink crawling and full content-AI generation are later phases, not v1.

---

## 2. Goals & success signals

| Goal | Success signal |
| --- | --- |
| Stack-agnostic install | `npm i @rankmyseo/core @rankmyseo/server` works in Next, Hono, and SvelteKit demos with only an adapter swap |
| Keyword/rank tracking | A user adds keywords, a scheduled job logs positions, and rank history renders over time |
| Persistent reports | Audits + rank snapshots survive restarts; queryable by project/date range |
| DB portability | Same app code runs on Postgres (prod) and SQLite (dev) by changing one connection string |
| Pluggable data sources | User picks GSC (free) and/or DataForSEO/Serper/SerpApi by providing a key — no code changes |
| Agent-driven dashboard | A user types "show my top 10 declining keywords as a chart" and the dashboard reconfigures |

---

## 3. Personas

- **Indie dev / agency** embedding SEO tracking into a client dashboard.
- **SaaS team** adding an "SEO" tab to their product without a third-party iframe.
- **Self-hoster** who wants a free, full-featured SEO tool decoupled from WordPress.

---

## 4. Architecture overview

The guiding pattern is the **engine + adapter (headless core)** model: a pure,
dependency-light TypeScript core, surrounded by thin, swappable adapters for the
HTTP framework, the database, the SEO data source, and the UI framework. This is
the established 2026 approach for shipping a library that works across the JS
ecosystem ([engine-adapter pattern][src-engine-adapter]; Node `exports`
field for clean public APIs [Node docs][src-node-exports]).

```
                         ┌──────────────────────────────────────┐
                         │            Host application            │
                         │   (Next / SvelteKit / Hono / Workers)  │
                         └───────────────┬────────────────────────┘
                                         │ uses
                ┌────────────────────────┼─────────────────────────┐
                │                        │                          │
        ┌───────▼───────┐       ┌────────▼────────┐        ┌────────▼────────┐
        │ @rankmyseo/ui │       │ @rankmyseo/     │        │ @rankmyseo/     │
        │ react|vue|... │       │ server (+adapt) │        │ agent (AISDK+MCP)│
        └───────┬───────┘       └────────┬────────┘        └────────┬────────┘
                │ headless hooks         │ HTTP handlers            │ tools
                └────────────────────────┼──────────────────────────┘
                                         │
                                ┌────────▼────────┐
                                │ @rankmyseo/core │  pure TS engine
                                │ (domain + rules)│  zero framework deps
                                └────────┬────────┘
                       ┌─────────────────┼──────────────────┐
                       │                 │                  │
              ┌────────▼──────┐ ┌────────▼───────┐ ┌────────▼────────┐
              │ storage port  │ │ datasource port│ │  scheduler port │
              │ drizzle: pg / │ │ gsc / dataforseo│ │ cron / queue /  │
              │ sqlite / d1   │ │ serper / serpapi│ │ durable object  │
              └───────────────┘ └────────────────┘ └─────────────────┘
```

**Why ports/adapters everywhere:** the core never imports a framework, a DB
driver, or an HTTP server. It depends only on TypeScript **interfaces** (ports).
Each integration is a separate package implementing that port, so users install
only what they need and we can add a new framework in a ~20-line adapter.

### 4.1 Trust boundary & data-breach prevention

Splitting into packages helps DX and clarity, but **an npm package boundary is
not a security boundary** — anyone can `import` a "backend" package into client
code. Breach protection comes from three *enforced* mechanisms, not the split:

1. **Build-time import guards.** Every module that reads secrets, touches the DB,
   or wraps a privileged SDK does `import 'server-only'` (mirror `client-only`
   for browser-only code). A wrong import becomes a **red build error**, not a
   silent leak, and the guard propagates transitively up the import chain.
   [Next.js server/client][src-server-only], [TanStack Start execution model][src-tanstack]
2. **Secret hygiene.** Secrets are read **per-request inside server handlers**,
   never at module top-level and never behind `NEXT_PUBLIC_`/`VITE_` prefixes
   (those are inlined as plaintext into the client bundle). [Next.js][src-server-only]
3. **Scoped API + authz.** The browser only talks to `@rankmyseo/server` over
   HTTP with a short-lived, **project-scoped token** — it never receives DB creds
   or provider/LLM keys. Strip sensitive fields with DTOs (or React `taint*`
   APIs) before they can cross into client props / the RSC payload.
   [RSC payload leak case][src-rsc-leak]

So: yes, split the packages (next section), but treat `@rankmyseo/server` and its
dependencies as the **single trust core** and enforce the fence with `server-only`.

---

## 5. Package layout (monorepo)

pnpm workspaces + Turborepo, releases via Changesets, ESM-first, Node >=20
baseline — the conventional, validated setup for multi-package TS libraries in
2026 ([deterministic tsup builds + Changesets][src-ooops]).

| Package | Responsibility | Key deps |
| --- | --- | --- |
| `@rankmyseo/core` | Domain models, SEO audit rules, rank-tracking logic, port interfaces, Zod schemas. **Zero** framework/DB deps. | `zod` |
| `@rankmyseo/server` | Framework-agnostic request handler built on Web-standard `Request`/`Response`; route logic for the dashboard API. | `@rankmyseo/core` |
| `@rankmyseo/server-next` · `-hono` · `-express` · `-sveltekit` | ~20-line adapters mapping each framework's req/res to the core handler. | peer: the framework |
| `@rankmyseo/storage` | Storage **port** + Drizzle implementations. Dialect-specific schemas (`pg`, `sqlite`, `mysql`, `d1`) selected by a factory. | `drizzle-orm` (peer driver) |
| `@rankmyseo/datasource` | Data-source **port** + provider adapters: `gsc`, `dataforseo`, `serper`, `serpapi`, `psi`. | per-provider SDK/fetch |
| `@rankmyseo/agent` | AI SDK tool definitions + an MCP server exposing SEO + dashboard-config capabilities. | `ai`, `@modelcontextprotocol/sdk` |
| `@rankmyseo/react` · `-vue` · `-svelte` | Headless hooks (`useRankTracker`, `useAudit`, `useReport`) over the API; framework as peer dep. | peer: framework |
| `@rankmyseo/ui` | Optional prebuilt dashboard (shadcn/Tailwind) consuming the headless hooks. | peer: react |
| `@rankmyseo/cli` | Scaffold config, run migrations, register scheduled jobs. | — |

`package.json` exports use **types-first conditional exports** and are validated
with `publint` ([types-first exports + publint][src-engine-adapter]):

```jsonc
{
  "type": "module",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  },
  "files": ["dist"]
}
```

### 5.1 Three tiers (your backend / frontend / dashboard split)

Your instinct to split by **backend / frontend / dashboard** is correct; it maps
onto the package set as three **trust tiers**. A host app installs one package
per tier it needs (e.g. `server-next` + `react` + `ui`), or just the backend if
it brings its own UI.

| Tier | Packages | Runs | Sees secrets? |
| --- | --- | --- | --- |
| **Backend** (trust core) | `core`, `server` (+adapters), `storage`, `datasource`, `agent`, `cli` | Server only (`import 'server-only'`) | Yes — DB creds, provider & LLM keys |
| **Frontend** (client SDK) | `react` / `vue` / `svelte` headless hooks | Browser | **No** — calls the backend API with a scoped token |
| **Dashboard** (UI) | `ui` (shadcn components) | Browser | **No** — consumes the frontend hooks |

**Minimum requirement to adopt RankMySEO:** a JS/TS runtime + a supported
database (or the remote store). The host's framework, bundler, and UI stack are
otherwise irrelevant — that is the whole point of the port/adapter design.

---

## 6. Core domain model

Primary entities (all `tenantId`/`projectId`-scoped for row-level multi-tenancy):

- **Project** — a tracked website/property (domain, locale, GSC property id).
- **Keyword** — a query tracked for a project (text, country, device, tags).
- **RankSnapshot** — append-only time-series row: `{keywordId, position, url,
  source, device, country, capturedAt, serpFeatures}`. The heart of rank history.
- **Audit** — a point-in-time SEO analysis run (score + per-check results).
- **AuditCheck** — one of N rules (title length, meta description, canonical,
  schema presence, Core Web Vitals, etc.), mirroring a standard battery of on-page SEO checks.
- **Report** — a saved/scheduled rollup (keywords + audits over a window).
- **DashboardConfig** — JSON layout/widget config (see §9), agent-editable.

`RankSnapshot` is append-only and queried by range → treat as **time-series**:
partition by month on Postgres (or use the TimescaleDB extension where
available) while keeping the logical schema portable. Use row-level `projectId`
isolation rather than schema-per-tenant for operational simplicity
([Drizzle temporal & multi-tenancy guidance][src-drizzle-best]).

---

## 7. Data sources (rank & SEO signals)

No single source covers everything, so RankMySEO defines a **DataSource port**
and ships multiple providers. Users supply keys and pick a default; competitor
tracking and owned-site analytics use different providers by design.

| Provider | Use | Cost (verified 2026) | Notes |
| --- | --- | --- | --- |
| **Google Search Console API** | Owned-site clicks/impressions/CTR/avg position, 16mo history | **Free** | Foundation. Owned properties only. [vrid][src-gsc], [TMB][src-seo-apis] |
| **PageSpeed Insights API** | Core Web Vitals for audits | **Free** | Powers the performance checks. [TMB][src-seo-apis] |
| **DataForSEO** | Any-domain SERP positions, competitor & keyword data | **$0.60/1K** (Standard, ~5min) · $1.20 Priority · $2.00 Live | Best $/scale; pay-as-you-go, $50 min top-up. [benchmark][src-bench], [honest][src-honest] |
| **Serper** | Budget SERP scraping | **$0.30/1K** (2.5K free/mo) | Cheapest for high-volume position checks. [TMB][src-seo-apis] |
| **SerpApi** | Real-time, sub-second SERP | **$15–25/1K** | Fastest but premium; note a **pending Google DMCA suit (May 2026)** — flag as supply risk. [honest][src-honest] |

**Recommended default:** GSC + PSI (free, owned-site truth) for v1, with
DataForSEO as the recommended paid provider for competitor/any-domain tracking
because of its cost advantage at scale. Provider choice is config, not code.

```ts
interface RankDataSource {
  id: string;                         // "gsc" | "dataforseo" | ...
  capabilities: { ownedOnly: boolean; realtime: boolean; competitors: boolean };
  fetchPositions(input: PositionQuery): Promise<RankSnapshot[]>;
}
```

---

## 8. Storage (DB- and ORM-agnostic persistence)

> **First, a scope correction:** the **dashboard/frontend never touches a
> database**. It talks to `@rankmyseo/server` over HTTP. So a user's ORM choice
> only matters in the **backend tier** (§5.1) — whatever Drizzle/Prisma/Kysely/
> raw SQL they use *for their own app* is irrelevant to RankMySEO's UI.

Drizzle is our **default, batteries-included adapter — not a requirement.** The
contract is the `RankStore` **port** in `@rankmyseo/core`, which has **zero**
Drizzle dependency. We ship Drizzle adapters because we use **Drizzle ORM**, but Drizzle generates **dialect-specific** code at
compile time — you cannot runtime-swap one `db` object across Postgres/SQLite/
MySQL. The validated approach is a **repository/adapter layer**: a storage port
in `@rankmyseo/core`, dialect-specific schema files, and a factory that picks the
implementation from the connection string
([Drizzle multi-DB discussion][src-drizzle-multi]).

```ts
// @rankmyseo/core — the port (no Drizzle import here)
interface RankStore {
  keywords: KeywordRepo;
  snapshots: RankSnapshotRepo;   // append + range queries
  audits: AuditRepo;
  reports: ReportRepo;
  dashboard: DashboardConfigRepo;
}

// @rankmyseo/storage — factory
export function createStore(databaseUrl: string): RankStore {
  if (databaseUrl.startsWith("postgres")) return createPgStore(databaseUrl);
  if (databaseUrl.startsWith("mysql"))    return createMysqlStore(databaseUrl);
  return createSqliteStore(databaseUrl); // sqlite:// or file path; libSQL/D1 variants
}
```

- **Prod:** Postgres (Neon/Supabase/RDS). **Dev/edge:** SQLite/libSQL.
  **Cloudflare:** D1. Migrations run per dialect via `drizzle-kit`.

### 8.1 Not using Drizzle? Bring your own store

A user on Prisma, Kysely, TypeORM, raw SQL, MongoDB, or an existing data service
has three paths, in increasing effort:

1. **Use our Drizzle adapter anyway (recommended default).** It owns RankMySEO's
   tables independently of the host's ORM. Point it at a **separate database, a
   separate schema/namespace, or a table prefix** so it never collides with the
   host's own tables. Two ORMs coexisting in one process is fine — they just
   manage different tables.
2. **Implement `RankStore` with their own ORM.** Since the port is a plain TS
   interface, a Prisma/Kysely/Mongo user can satisfy it with ~5 repository
   objects and avoid adding Drizzle at all. We publish the required **schema/DDL
   spec** (table shapes, indexes, the append-only `RankSnapshot` time-series) so
   they can create tables with their own migration tool.
3. **Point at the remote store** (the `*-cloud` client adapter), where persistence
   is handled for them and no local DB/ORM is involved.

**Optional first-party adapters.** Beyond the default Drizzle adapter, we plan to
ship official, **opt-in** adapter packages so common stacks don't have to
hand-roll path 2 — e.g. `@rankmyseo/storage-prisma`, `@rankmyseo/storage-kysely`,
`@rankmyseo/storage-mongo`. Each is a separate install (you pull only the one you
use), each implements `RankStore`, and each is gated by the same conformance
suite. The default stays Drizzle; adapters are additive, never required.

To keep custom adapters honest, `@rankmyseo/core` ships a **conformance test
suite** (`runStoreContractTests(store)`): any `RankStore` implementation — ours
or theirs — must pass the same Vitest suite (CRUD, range queries, append-only
snapshot semantics, tenant isolation). This makes "bring your own store" a
**verified** contract, not a hope.

---

## 9. Dashboard & the agent layer

### 9.1 Dashboard as data, not hardcoded layout

The dashboard is described by a **`DashboardConfig`** (JSON): an ordered list of
widgets, each `{ id, type, title, query, options, layout }`. Widget `type`s map
to a **client widget registry** (`RankHistoryChart`, `KeywordTable`,
`AuditScoreCard`, `TopMoversList`, `CoreWebVitalsGauge`, …). Rendering = read
config → look up component → pass query result. This makes the dashboard
**declaratively customizable** and safe for an agent to edit (no code-gen,
just validated config mutations).

### 9.2 Agent: "understand us & customize the dashboard"

Built on the **Vercel AI SDK** (provider-agnostic across OpenAI/Anthropic/
Google/etc.; `streamText` + `useChat`; tools = name + description + Zod schema +
`execute`; built-in agent loop and `needsApproval` human-in-the-loop)
([AI SDK 6 deep dive][src-aisdk6]).

Generative UI uses the **client-side `useChat` + typed tool parts**
(`tool-${name}`) pattern — the AI SDK team has **paused RSC `streamUI`**, so we do
not depend on it ([AI SDK generative UI][src-genui], [GenUI 2026 guide][src-genui-guide]).

Agent tools (each Zod-typed, most mutations gated by `needsApproval`):

| Tool | Purpose |
| --- | --- |
| `queryRankHistory` | Read snapshots for keywords over a range (read-only) |
| `listKeywords` / `addKeyword` | Inspect / extend tracked keywords |
| `runAudit` / `getAudit` | Trigger or read an SEO audit |
| `getDashboardConfig` | Let the model "see" the current layout |
| `updateDashboardConfig` | Add/remove/reorder/retitle widgets (validated, approval-gated) |
| `explainMetric` | Natural-language explanation grounded in the user's data |

**MCP server:** `@rankmyseo/agent` also exposes these as a **Model Context
Protocol** server, so external hosts (Cursor, Claude Desktop, etc.) can drive a
user's RankMySEO instance. We can consume third-party MCP tools via
`experimental_createMCPClient` and **vendor tool definitions** for stability
([AI SDK + MCP][src-mcp]).

> **Safety:** the agent customizes via the **config schema only**; it never
> writes app code or raw SQL. All writes are Zod-validated and, for destructive
> changes, require explicit user approval.

---

## 10. Site integration features

Beyond rank tracking, RankMySEO can analyze and augment the user's *live* site.
Each is opt-in via config (§10.5) and lives in the **backend** tier except the
on-page collector, which has a thin client half that carries no secrets.

### 10.1 On-page SEO score (live page)

A tiny **client collector** (shipped in `@rankmyseo/react` or as a standalone
`<script>`) reads the rendered DOM (title, meta, headings, canonical, OG/schema)
and Core Web Vitals via the `web-vitals` library, then POSTs measurements to a
scoped backend endpoint, which scores them against the audit rules (§6). For
pages we can reach, the backend can also fetch + parse server-side. The collector
ships **no secrets** — it only posts measurements.

### 10.2 Generated `sitemap.xml`

If the host has no sitemap, `@rankmyseo/server` can generate and serve one from
tracked routes/content. Auto-skipped when the app already exposes one
(configurable), so we never clobber an existing sitemap.

### 10.3 `/llms.txt` for agents

Serve a spec-compliant `/llms.txt` at the **site root** (H1 project name →
blockquote summary → H2 link lists of `.md` resources), per the llmstxt.org
convention [src][src-llmstxt]. Serve it **directly** as `text/markdown` /
`text/plain` — *not* gated behind content negotiation, because agents probe the
root path and a wrong `Accept` would otherwise return HTML. Optionally also emit
`llms-full.txt`. [AgentGrade implementation notes][src-agentgrade]

### 10.4 Markdown for agents (`Accept: text/markdown`)

Server adapters honor content negotiation: the **same URL** returns clean
Markdown to agents and HTML to browsers, with `Vary: Accept`, a `406` on strict
mismatch, and a `Link: rel="alternate"` advertisement. This is what makes agent
*consumption* cheap (llms.txt is discovery; negotiation is consumption).
[acceptmarkdown recipes][src-acceptmd], [why it matters][src-docsalot]

### 10.5 Configuration (`rankmyseo.config.ts`)

A single typed, Zod-validated config declares: database URL, enabled data sources
+ keys, schedule, which site features are on (sitemap / llms.txt / collector),
and dashboard defaults. `@rankmyseo/cli` scaffolds it; the **agent may only edit
the dashboard subset** (§9), never secrets or feature toggles.

---

## 11. Proposed stack (at a glance)

- **Language/runtime:** TypeScript (strict), Node >=20, ESM-first, Web-standard `Request`/`Response`.
- **Monorepo:** pnpm workspaces + Turborepo; **Changesets** for versioning/release.
- **Build:** `tsup` (dts + dual ESM/CJS where needed); `publint` in CI; Vitest for tests.
- **Validation/contracts:** Zod (shared schemas across core, server, agent).
- **DB:** Drizzle ORM (Postgres / SQLite-libSQL / MySQL / D1) behind a storage port.
- **Data sources:** GSC + PSI (free) baseline; DataForSEO/Serper/SerpApi pluggable.
- **AI:** Vercel AI SDK (v6) + Model Context Protocol; client-side generative UI.
- **UI:** Headless hooks per framework + optional shadcn/Tailwind dashboard.
- **Scheduling:** scheduler port with adapters (node-cron, BullMQ/queue, Workers Cron / Durable Objects).

---

## 12. Milestones / roadmap

| Phase | Scope | Outcome |
| --- | --- | --- |
| **M0 — Skeleton** | Monorepo, `@rankmyseo/core` ports + Zod models, SQLite store, one server adapter (Hono), Vitest | Core compiles; CRUD keyword/snapshot verified in tests |
| **M1 — Rank tracking slice** | GSC datasource, scheduler port (node-cron), rank snapshot ingestion, `useRankTracker` (React), basic chart widget | End-to-end: add keyword → scheduled fetch → rank history renders |
| **M2 — Audits & reports** | Audit engine (subset of standard on-page checks) + PSI, report rollups, Postgres store + migrations | Audits persist; reports query by range; runs on PG and SQLite |
| **M3 — Agent layer** | AI SDK tools, `DashboardConfig` + widget registry, agent-driven config edits with approval | "Customize my dashboard" works in the demo |
| **M4 — Site integration** | On-page collector (`web-vitals`) + score, generated `sitemap.xml`, `/llms.txt`, `Accept: text/markdown` negotiation, `rankmyseo.config.ts` | Live-page score + agent-readable site, all opt-in |
| **M5 — Ecosystem** | More framework adapters (Next, SvelteKit, Express), optional storage adapters (`storage-prisma`/`-kysely`/`-mongo`), DataForSEO/Serper providers, MCP server, docs site | Multi-stack demos; published `@rankmyseo/*` packages |

Each phase ships **one vertical slice** before widening (per fullstack-delivery
guidance). M1 is the riskiest assumption (datasource + scheduling + persistence
+ render) and is intentionally prioritized.

---

## 13. Risks & open questions

**Risks**
- **SERP scraping legality/supply** — SerpApi has a pending Google DMCA suit
  (May 2026); keep providers swappable and default to GSC where possible. [src][src-honest]
- **Drizzle dialect drift** — column types differ across dialects; mitigated by
  per-dialect schemas + CI matrix (PG + SQLite). [src][src-drizzle-multi]
- **AI SDK churn** — MCP support is still `experimental_`; vendor tool defs. [src][src-mcp]
- **Secret leakage across the client fence** — the top breach risk for an
  embeddable package; mitigated by `server-only` guards, scoped tokens, and DTOs
  (§4.1). Treat any secret reachable from a `'use client'` graph as compromised.
- **Scope creep** — comparable SEO suites span ~18 modules; v1 deliberately covers tracking +
  audits + reports + agent + the §10 site features, not WooCommerce/local-SEO.

**Open questions (need your call)**
1. **Primary UI framework** for the reference dashboard first — React (shadcn), or framework-neutral from day one?
2. **Default paid SERP provider** to document first — DataForSEO (cheapest at scale) vs Serper (cheapest entry)?
3. **Multi-tenant from day one** (`tenantId` everywhere) or single-tenant v1 to move faster?
4. **License** confirm MIT (vs Apache-2.0 for patent grant)?
5. **LLM provider** — which AI SDK providers to support first (OpenAI / Anthropic / Google / local)?
6. **Client fence enforcement** — enforce the trust boundary (§4.1) via `server-only`
   guards **plus a CI import-lint from M0** that fails the build if a backend-only
   symbol enters a `'use client'` graph? (Recommended: yes — cheap tripwire, catches
   leaks before release.)

---

## Appendix A — Sources inspected

| Topic | Source |
| --- | --- |
| Engine-adapter / headless pattern, types-first exports | [dev.to][src-engine-adapter] |
| Node `exports` field semantics | [Node.js docs][src-node-exports] |
| Deterministic tsup + Changesets monorepo | [ooops-system][src-ooops] |
| GSC vs SERP APIs, owned vs any-domain | [vrid][src-gsc], [TMB][src-seo-apis] |
| DataForSEO vs SerpApi benchmark/pricing | [apiserpent][src-bench], [nextgrowth][src-honest] |
| Drizzle multi-DB repository pattern | [drizzle discussion][src-drizzle-multi], [best practices][src-drizzle-best] |
| AI SDK 6 tools/agent loop | [digitalapplied][src-aisdk6] |
| Generative UI (client-side, RSC paused) | [ai-sdk.dev][src-genui], [GenUI guide][src-genui-guide] |
| AI SDK + MCP | [MintMCP][src-mcp] |
| `server-only` guard / client fence | [Next.js docs][src-server-only], [TanStack Start][src-tanstack] |
| RSC payload secret-leak case | [bswanson][src-rsc-leak] |
| `llms.txt` spec & serving | [llmstxt.org][src-llmstxt], [AgentGrade][src-agentgrade] |
| Markdown content negotiation | [acceptmarkdown][src-acceptmd], [docsalot][src-docsalot] |

[src-engine-adapter]: https://dev.to/jacksonkasi/how-to-build-framework-agnostic-open-source-tools-the-engine-adapter-pattern-1h72
[src-node-exports]: https://nodejs.org/api/packages.html
[src-ooops]: https://github.com/Ooops-Studio/ooops-system
[src-gsc]: https://vrid.ai/blog/check-your-keyword-position-using-google-api
[src-seo-apis]: https://thatmarketingbuddy.com/best/seo-apis
[src-bench]: https://apiserpent.com/blog/serpapi-vs-dataforseo-benchmark
[src-honest]: https://nextgrowth.ai/dataforseo-vs-serpapi/
[src-drizzle-multi]: https://github.com/drizzle-team/drizzle-orm/discussions/5269
[src-drizzle-best]: https://paulserban.eu/blog/post/drizzle-orm-best-practices-principles-patterns-and-real-world-case-studies/
[src-aisdk6]: https://www.digitalapplied.com/blog/vercel-ai-sdk-6-deep-dive-features-tool-calls-2026
[src-genui]: https://ai-sdk.dev/v7/docs/ai-sdk-ui/generative-user-interfaces
[src-genui-guide]: https://medium.com/@akshaychame2/the-complete-guide-to-generative-ui-frameworks-in-2026-fde71c4fa8cc
[src-mcp]: https://www.mintmcp.com/blog/connect-multiple-ai-models
[src-server-only]: https://nextjs.org/docs/app/getting-started/server-and-client-components
[src-tanstack]: https://tanstack.com/start/latest/docs/framework/react/guide/execution-model
[src-rsc-leak]: https://www.bswanson.dev/blog/nextjs-hydration-payload/
[src-llmstxt]: https://llmstxt.org/
[src-agentgrade]: https://agentgrade.com/kb/llms-txt
[src-acceptmd]: https://acceptmarkdown.com/recipes
[src-docsalot]: https://docsalot.dev/blog/we-shipped-llms-txt-heres-why-it-matters
