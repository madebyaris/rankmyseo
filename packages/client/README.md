# @rankmyseo/client

Framework-neutral HTTP client for the RankMySEO API. Used by `@rankmyseo/react` (and future Vue/Svelte adapters).

## Install

```bash
npm i @rankmyseo/client
```

## Usage

```ts
import { createRankMySeoClient } from "@rankmyseo/client";

const client = createRankMySeoClient({
  baseUrl: "/api/rankmyseo",
  tenantId: "tenant-a",
  projectId: "project-1",
});

const keywords = await client.keywords.list();
const scan = await client.scan.run("https://example.com");
const reply = await client.agent.chat([{ role: "user", content: "Summarize rankings" }]);
```

- `request<T>(path, init?)` unwraps `{ data: T }` and throws `RankMySeoApiError` on failure.
- `api<T>(path, init?)` returns raw JSON (compat with older React hooks).

## License

Apache-2.0
