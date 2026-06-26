# @rankmyseo/react

Headless React hooks and on-page collector for [RankMySEO](https://github.com/madebyaris/rankmyseo). Talks to the backend over HTTP with a scoped token — **no DB access or secrets in the browser.**

## Install

```bash
npm i @rankmyseo/react react
```

`react` is a peer dependency.

## Usage

```tsx
import { createRankMySeoClient, RankMySeoProvider, useScan } from "@rankmyseo/react";

const client = createRankMySeoClient({
  baseUrl: "/api",
  tenantId: "tenant-a",
  projectId: "project-1",
});

function App() {
  return (
    <RankMySeoProvider value={client}>
      <Scanner />
    </RankMySeoProvider>
  );
}

function Scanner() {
  const { result, scanning, scan } = useScan();
  return <button onClick={() => scan("https://example.com")}>Scan</button>;
}
```

Other hooks: `useRankTracker`, `useAudit`, `useReport`, `useKeywords`, `useDashboardConfig`, `useBlog`, `useMetaGenerator`, `useRankMySeoChat`.

Includes a `web-vitals`-based collector for posting real-user Core Web Vitals.

## Documentation

See the [Wiki → React Hooks](https://github.com/madebyaris/rankmyseo/wiki/React-Hooks).

## License

Apache-2.0
