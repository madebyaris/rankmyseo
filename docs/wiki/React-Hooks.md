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
    <RankMySeoProvider client={client}>
      <Dashboard />
    </RankMySeoProvider>
  );
}
```

## Core hooks

### `useDashboardConfig`

Load and update dashboard widget layout.

```tsx
const { config, loading, error, updateConfig } = useDashboardConfig();
// config.widgets — array of WidgetConfig
await updateConfig({ widgets: [...] });
```

### `useKeywords`

```tsx
const { keywords, loading, createKeyword, deleteKeyword } = useKeywords();
```

### `useRankTracker`

Historical rank snapshots for charting.

```tsx
const { snapshots, loading } = useRankTracker({ keywordId: "kw-1" });
```

### `useAudit`

```tsx
const { audits, loading, runAudit } = useAudit();
```

### `useReport`

```tsx
const { report, loading, generate } = useReport();
```

## Feature hooks

### `useScan`

Live URL scan (title, meta, headings, links, images).

```tsx
const { scan, scanning, result, error } = useScan();
await scan({ url: "https://example.com" });
```

### `useMetaGenerator`

Generate SEO meta title and description.

```tsx
const { generate, generating, result } = useMetaGenerator();
await generate({
  title: "Best Rank Trackers",
  content: "...",
  targetKeyword: "rank tracker",
});
```

### `useBlog`

Full blog CRUD when `siteFeatures.blog` is enabled.

```tsx
const {
  posts,
  loading,
  createPost,
  updatePost,
  deletePost,
  getPost,
} = useBlog();
```

### `useBlogModule`

Opt-in blog widget management.

```tsx
const { enabled, enable, disable, options } = useBlogModule();
// enable() adds BlogManager to dashboard config
// disable() removes it
```

### `useRankMySeoChat`

Streaming AI agent chat (requires agent server).

```tsx
const { messages, send, streaming } = useRankMySeoChat();
```

## Error handling

All hooks expose `error` where applicable. HTTP errors surface as `Error` with message from API body when available.

## TypeScript

Types re-export from `@rankmyseo/core` where possible. Import schemas for form validation:

```tsx
import { blogPostSchema } from "@rankmyseo/core";
```

See [[API-Reference]] for endpoint details each hook calls.
