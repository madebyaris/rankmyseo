# AI Agent

RankMySEO includes an optional AI agent layer for conversational SEO assistance.

## Package

`@rankmyseo/agent` — tool definitions, system prompts, and orchestration logic.

## Tools (MCP-style)

The agent can invoke server-backed tools:

| Tool | Description |
| --- | --- |
| `scan_url` | On-page analysis of a URL |
| `generate_meta` | Meta title/description generation |
| `generate_schema` | Schema.org JSON-LD (Article, Product, FAQ, Breadcrumb, Organization) |
| `list_keywords` | Tracked keywords for project |
| `get_rank_history` | Rank snapshots for a keyword |
| `run_audit` | Trigger site audit |
| `list_blog_posts` | Blog posts (when enabled) |
| `create_blog_post` | Create draft post |

Tool schemas live in `packages/agent/src/tools/`.

## React integration

```tsx
import { useRankMySeoChat } from "@rankmyseo/react";

function ChatPanel() {
  const { messages, send, streaming, error } = useRankMySeoChat();

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>{m.role}: {m.content}</div>
      ))}
      <button disabled={streaming} onClick={() => send("Scan my homepage")}>
        Send
      </button>
    </div>
  );
}
```

## Server route

Agent chat is exposed via the server package (streaming SSE or chunked responses depending on adapter). Configure LLM credentials in environment — not bundled in OSS defaults.

## Environment

Typical variables (exact names in server config):

```
OPENAI_API_KEY=sk-...
# or compatible OpenAI API endpoint
```

Without credentials, agent routes return appropriate errors; core rank/audit/blog features work independently.

## Extending tools

1. Add tool definition in `packages/agent/src/tools/`
2. Register handler in agent router
3. Update system prompt with tool description
4. Add tests with mocked LLM responses

## OSS scope

The agent is **optional**. Rank tracking, audits, scan, meta, and blog do not require AI. This matches the product goal: free-first SEO tooling with AI as an enhancement.

See [[Development]] for running the agent locally.
