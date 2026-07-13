# React Hooks

`@rankmyseo/react` provides hooks that talk to the RankMySEO HTTP API. Wrap your app in `RankMySeoProvider`.

## Setup

```tsx
import { RankMySeoProvider, createRankMySeoClient } from "@rankmyseo/react";

const client = createRankMySeoClient({
  baseUrl: "http://localhost:3456",
  tenantId: "tenant-a",
  projectId: "project-1",
});

export function App() {
  return (
    <RankMySeoProvider value={client}>
      <Dashboard />
    </RankMySeoProvider>
  );
}
```

Note: the provider prop is `value`, not `client`.

## Core hooks

### `useDashboardConfig`

Load and update dashboard widget layout.

```tsx
const { config, loading, refresh, update } = useDashboardConfig();
await update([{ id: "w1", type: "KeywordTable", title: "Keywords", query: {}, options: {} }]);
```

### `useKeywords`

```tsx
const { keywords, loading, error, refresh, addKeyword } = useKeywords();
```

There is no `deleteKeyword` helper yet — call the API directly if needed.

### `useRankTracker`

Historical rank snapshots for charting (defaults to last 12 months when `keywordId` is set).

```tsx
const { snapshots, loading, loadHistory } = useRankTracker("kw-1");
```

### `useAudit`

```tsx
const { audits, loading, refresh } = useAudit();
```

### `useReport`

```tsx
const { reports, loading, error, refresh, createReport } = useReport();
```

## Feature hooks

### `useScan`

Live URL scan (title, meta, headings, signals, recommendations).

```tsx
const { scan, scanning, result, error } = useScan();
await scan("https://example.com");
```

### `useMetaGenerator`

Generate SEO meta title and description.

```tsx
const { generate, generating, result, error } = useMetaGenerator();
```

### `useSchemaGenerator`

Generate Schema.org JSON-LD.

```tsx
const { generate, generating, result, error } = useSchemaGenerator();
```

### `useBlog`

Full blog CRUD when `siteFeatures.blog` is enabled.

```tsx
const { posts, loading, error, refresh, createPost, updatePost, deletePost, getPost } = useBlog();
```

### `useBlogModule`

Opt-in blog widget management.

```tsx
const { enabled, enable, disable, options } = useBlogModule();
```

### `useRankMySeoChat`

Posts messages to `POST /agent/chat` (requires server `agentModel`).

```tsx
const { sendMessage, streaming } = useRankMySeoChat();
const text = await sendMessage([{ role: "user", content: "Summarize rank changes" }]);
```

Returns raw stream text today — for tool-approval flows use AI SDK `useChat` against `/agent/chat`.

## Error handling

Hooks that fetch data expose `error` where applicable. HTTP failures throw or surface as `Error` with status text.

## TypeScript

Types re-export from `@rankmyseo/core` / `@rankmyseo/core/schemas`. Config JSON Schemas: `@rankmyseo/core/json-schema`.

See [[API-Reference]] for endpoint details each hook calls.
