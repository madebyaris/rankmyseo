# AI Agent

RankMySEO includes an optional AI agent layer for conversational SEO assistance.

## Package

`@rankmyseo/agent` — AI SDK tools, UI-message chat streaming, and an MCP stdio server.

Exports:

- `createAgentTools()` — AI SDK tool set
- `streamAgentChat()` — server-side chat orchestration
- `createRankMySeoMcpServer()` / `startMcpStdioServer()` — MCP host integration
- `@rankmyseo/agent/tools` — Zod input schemas
- `@rankmyseo/agent/json-schema` — JSON Schemas for tool inputs
- `rankmyseo-mcp` bin — stdio MCP server (`DATABASE_URL`, `TENANT_ID`, `PROJECT_ID`)

## AI SDK tools (`createAgentTools`)

| Tool | Description | Approval gated |
| --- | --- | --- |
| `listKeywords` | List tracked keywords | no |
| `queryRankHistory` | Rank snapshots for ISO-8601 date range | no |
| `getAudit` | Fetch audit by id | no |
| `getDashboardConfig` | Read dashboard widget layout | no |
| `explainMetric` | Template summary of tracking stats (not LLM-grounded) | no |
| `generateSchema` | Schema.org JSON-LD generator | no |
| `addKeyword` | Create keyword | **yes** |
| `runAudit` | Score provided page signals (does not fetch URL) | **yes** |
| `updateDashboardConfig` | Upsert dashboard widgets | **yes** |
| `buildReport` | Create report rollup | **yes** |

Tool definitions live in `packages/agent/src/tools.ts`.

For live URL fetching, use the HTTP route `POST /scan` — not the `runAudit` tool.

## MCP tools (snake_case parity)

`list_keywords`, `query_rank_history`, `add_keyword`, `run_audit`, `get_audit`, `get_dashboard_config`, `update_dashboard_config`, `explain_metric`, `build_report`, `generate_schema`

MCP tools include `readOnlyHint` / `destructiveHint` / `idempotentHint` annotations where applicable.

## React integration

`useRankMySeoChat` from `@rankmyseo/react` posts to `POST /agent/chat` and returns `{ sendMessage, streaming }`.

The server responds with an **AI SDK UI message stream** (for tool approvals and structured parts). For full approval UX, use AI SDK `useChat` against your mounted `/agent/chat` route with `addToolApprovalResponse`.

```tsx
import { useRankMySeoChat } from "@rankmyseo/react";

function ChatPanel() {
  const { sendMessage, streaming } = useRankMySeoChat();

  return (
    <button
      disabled={streaming}
      onClick={() => void sendMessage([{ role: "user", content: "List my keywords" }])}
    >
      Send
    </button>
  );
}
```

## Server route

`POST /agent/chat` requires `agentModel` in `createHandler` / `createRankMySeoApp` options. Without it, the route returns **503**.

Configure an AI SDK `LanguageModel` in your server bootstrap — credentials stay in your app, not in RankMySEO packages.

## Environment (MCP bin)

```
DATABASE_URL=sqlite://./data/rankmyseo.sqlite
TENANT_ID=tenant-a
PROJECT_ID=project-1
```

## OSS scope

The agent is **optional**. Rank tracking, audits, scan, meta, and blog do not require AI.

See [[Development]] for running the agent locally and [[AGENTS.md]] in the repo root for integrator-agent details.
