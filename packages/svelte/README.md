# @rankmyseo/svelte

Headless Svelte stores for [RankMySEO](https://github.com/madebyaris/rankmyseo). Talks to the backend over HTTP via `@rankmyseo/client` — **no DB access or secrets in the browser.** Compatible with Svelte 4 and 5 (uses `svelte/store`, not runes-only APIs).

## Install

```bash
npm i @rankmyseo/svelte svelte
```

`svelte` (^4 || ^5) is a peer dependency.

## Usage

```svelte
<script lang="ts">
  import {
    createRankMySeoClient,
    setRankMySeoContext,
    createKeywordsStore,
    mountPageCollector,
  } from "@rankmyseo/svelte";
  import { onMount } from "svelte";

  const client = createRankMySeoClient({
    baseUrl: "/api",
    tenantId: "tenant-a",
    projectId: "project-1",
  });
  setRankMySeoContext(client);

  const { keywords, loading, refresh } = createKeywordsStore(client);

  onMount(() =>
    mountPageCollector({
      baseUrl: "/api",
      tenantId: "tenant-a",
      projectId: "project-1",
    }),
  );
</script>

{#if $loading}
  <p>Loading…</p>
{:else}
  <ul>
    {#each $keywords as kw}
      <li>{kw.text}</li>
    {/each}
  </ul>
{/if}
```

Store factories: `createKeywordsStore`, `createRankTrackerStore`, `createAuditStore`, `createReportStore`, `createDashboardConfigStore`, `createScanStore`, `createMetaGeneratorStore`, `createSchemaGeneratorStore`, `createBlogStore`, `createBlogModuleStore`, `createChatStore`.

Context helpers: `setRankMySeoContext`, `getRankMySeoContext`, `initRankMySeoContext`. Convenience wrappers (`keywordsStore()`, etc.) read the context.

## License

Apache-2.0
