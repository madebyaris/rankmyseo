# AGENTS.md — RankMySEO integrator guide

This file is for **AI coding agents** (Cursor, Claude Code, Copilot, etc.) wiring RankMySEO into an application.

## Package decision tree

| Goal | Install |
| --- | --- |
| API-only backend (Hono) | `@rankmyseo/core`, `@rankmyseo/storage`, `@rankmyseo/server-hono`, `hono` |
| + Headless React hooks | add `@rankmyseo/react`, `react` |
| + Framework-neutral HTTP client | add `@rankmyseo/client` (Vue/Svelte/Astro/vanilla) |
| + Browser page collector | add `@rankmyseo/collector` |
| + Prebuilt dashboard widgets | add `@rankmyseo/ui`, `react-dom` |
| + CLI (`init`, `migrate`, `schedule`, `doctor`) | add `@rankmyseo/cli` (dev) or use `rankmyseo` meta installer |
| + AI chat tools / MCP | add `@rankmyseo/agent`, configure `agentModel` on the server handler |
| + SEO regression CI gate | add `@rankmyseo/cli` (+ `@rankmyseo/scanner`), configure `regression` in config |
| Full stack shortcut | `npx rankmyseo install --yes --preset recommended` |

The **recommended** preset installs: `@rankmyseo/core`, `@rankmyseo/storage`, `@rankmyseo/server-hono`, `@rankmyseo/react`, `@rankmyseo/cli` (+ peers `hono`, `react`).

## CLI commands (real binary names)

| User-facing | Direct CLI binary |
| --- | --- |
| `npx rankmyseo init` | `npx rankmyseo-cli init` |
| `npx rankmyseo migrate` | `npx rankmyseo-cli migrate` |
| `npx rankmyseo schedule` | `npx rankmyseo-cli schedule` |
| `npx rankmyseo doctor` | `npx rankmyseo-cli doctor` |
| `npx rankmyseo regression check` | `npx rankmyseo-cli regression check` |

Do **not** use `npx @rankmyseo/cli` — that is not a valid binary name.

Global flags: `--json` (machine-readable output), `--version`.

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Your server bootstrap | LLM for `POST /agent/chat` (bring your own provider wiring) |
| `DATABASE_URL` / `RANKMYSEO_DATABASE_URL` | `rankmyseo-mcp` bin | SQLite/Postgres URL for MCP stdio server |
| `TENANT_ID` / `RANKMYSEO_TENANT_ID` | MCP bin | Default tenant scope |
| `PROJECT_ID` / `RANKMYSEO_PROJECT_ID` | MCP bin | Default project scope |
| `RANKMYSEO_MCP_ALLOW_MUTATIONS` | MCP bin | Set to `1` to register mutating MCP tools (read-only by default) |

RankMySEO does not read OpenAI keys internally — you pass a `LanguageModel` to `createHandler` / `createRankMySeoApp`.

## HTTP scope headers

Most API routes require:

```
x-tenant-id: <tenant>
x-project-id: <project>
```

**These headers select scope — they do not authenticate.** Pass `authorize(request, scope)` to `createHandler` / `createRankMySeoApp` to validate the caller. Return a `Response` to deny.

Mount under a subpath with `basePath: "/api/rankmyseo"` on `createHandler` / `createRankMySeoApp` (Node.js ≥ 20; full stack is not edge/Workers compatible).

**Exempt routes** (no scope headers required; default config tenant/project is used):

- `GET /sitemap.xml`
- `GET /llms.txt`

**Special case:**

- `GET /` — scope headers optional; uses config defaults unless headers are provided

Disabled features:

- `POST /collect`, `/blog/*` → **403** when feature off
- `GET /sitemap.xml`, `/llms.txt` → **404** when feature off

## Minimal Hono + agent snippet

```ts
import { defineConfig } from "@rankmyseo/core";
import { createStore } from "@rankmyseo/storage";
import { createRankMySeoApp } from "@rankmyseo/server-hono";
import { openai } from "@ai-sdk/openai";

const store = createStore("sqlite://./data/rankmyseo.sqlite");

await store.projects.create({
  id: "project-1",
  tenantId: "tenant-a",
  name: "My Site",
  domain: "example.com",
});

const config = defineConfig({
  databaseUrl: "sqlite://./data/rankmyseo.sqlite",
  tenantId: "tenant-a",
  projectId: "project-1",
  dataSources: [{ provider: "fixture", default: true }],
  schedule: { cron: "0 6 * * *", enabled: false },
  siteFeatures: {
    sitemap: true,
    llmsTxt: true,
    collector: true,
    markdownNegotiation: true,
    blog: false,
  },
});

export default createRankMySeoApp(store, {
  config,
  agentModel: openai("gpt-4o"),
});
```

Scaffold config:

```bash
npx rankmyseo init
npx rankmyseo migrate
npx rankmyseo doctor --json
```

## Dashboard widget types

Valid `type` values (shared enum in `@rankmyseo/core`):

- `KeywordTable`
- `RankHistoryChart`
- `AuditScoreCard`
- `TopMoversList`
- `CoreWebVitalsGauge`
- `BlogManager`

Example widget:

```json
{
  "id": "w1",
  "type": "KeywordTable",
  "title": "Keywords",
  "query": {},
  "options": {}
}
```

## AI SDK tools (`createAgentTools`)

| Tool | Mutating | Approval required |
| --- | --- | --- |
| `listKeywords` | no | no |
| `queryRankHistory` | no | no |
| `getAudit` | no | no |
| `getDashboardConfig` | no | no |
| `explainMetric` | no | no (template stub, not LLM-grounded) |
| `generateSchema` | no | no |
| `addKeyword` | yes | yes (`needsApproval`) |
| `runAudit` | yes | yes |
| `updateDashboardConfig` | yes | yes |
| `buildReport` | yes | yes |

`POST /agent/chat` returns a **UI message stream** (not plain text). Use AI SDK `useChat` + `addToolApprovalResponse` on the client for approval-gated tools.

## MCP server

Programmatic:

```ts
import { startMcpStdioServer } from "@rankmyseo/agent";
```

CLI (stdio):

```bash
DATABASE_URL=sqlite://./data/rankmyseo.sqlite TENANT_ID=tenant-a PROJECT_ID=project-1 npx rankmyseo-mcp
```

MCP tools use **snake_case** names matching the AI SDK tools (`list_keywords`, `query_rank_history`, `add_keyword`, …).

**Mutating MCP tools are off by default.** Set `allowMutations: true` or `RANKMYSEO_MCP_ALLOW_MUTATIONS=1` to enable `add_keyword`, `run_audit`, `update_dashboard_config`, and `build_report`. Treat MCP as a trusted-local boundary when mutations are enabled.

## SEO regression CLI

```bash
npx rankmyseo-cli regression check \
  --candidate-url https://preview.example.com \
  --base-ref origin/main \
  --json
```

Requires `regression.enabled` + `regression.productionUrl` + `routeMap` in config. Exit `0` = pass, `1` = gated findings, `2` = runtime/config/network error. See the [SEO Regression](https://github.com/madebyaris/rankmyseo/wiki/SEO-Regression) wiki page.

JSON Schemas:

- `@rankmyseo/core/json-schema`
- `@rankmyseo/agent/json-schema`
- `@rankmyseo/agent/tools` (Zod input schemas)

## Common failure modes (from audits)

1. **Wrong CLI binary** — use `npx rankmyseo …` or `rankmyseo-cli`, not `@rankmyseo/cli`.
2. **Missing scope headers** on `/keywords`, `/dashboard`, etc.
3. **Assuming `/sitemap.xml` needs headers** — it does not.
4. **`runAudit` tool vs `/scan` route** — the tool scores provided signals; `/scan` fetches a live URL.
5. **`schedule` is one ingestion pass** — it does not install a cron daemon; use `@rankmyseo/scheduler` in your app for recurring jobs. `schedule.enabled=false` makes the CLI command a no-op.
6. **`migrate` runs inline DDL** via `createStore()` — not `drizzle-kit migrate`.
7. **MCP mutations disabled** — without `RANKMYSEO_MCP_ALLOW_MUTATIONS=1`, mutating tools are not registered.
8. **Scope headers are not auth** — wire `authorize` on the handler for multi-tenant production.

## Error envelope

API errors:

```json
{ "error": "message", "code": "MISSING_SCOPE", "details": {} }
```

Success responses wrap payloads as `{ "data": … }`.

## Agent-readiness features (not SEO ranking levers)

`llms.txt` and markdown `Accept` negotiation help **coding agents and dev tools** consume site content cheaply. They are not evidenced to improve search rankings or AI citation rates — treat them as integrator/agent UX, not organic SEO tactics.
