# @rankmyseo/vue

Headless Vue 3 composables for [RankMySEO](https://github.com/madebyaris/rankmyseo). Talks to the backend over HTTP via `@rankmyseo/client` — **no DB access or secrets in the browser.** On-page collection lives in `@rankmyseo/collector` and is re-exported here.

## Install

```bash
npm i @rankmyseo/vue vue
```

`vue` (^3.4) is a peer dependency.

## Usage

```ts
import { createApp } from "vue";
import { createRankMySeoPlugin, useScan } from "@rankmyseo/vue";

const app = createApp(App);
app.use(
  createRankMySeoPlugin({
    baseUrl: "/api",
    tenantId: "tenant-a",
    projectId: "project-1",
  }),
);
app.mount("#app");
```

```vue
<script setup lang="ts">
import { useScan } from "@rankmyseo/vue";
const { result, scanning, scan } = useScan();
</script>
```

Other composables: `useKeywords`, `useRankTracker`, `useAudit`, `useReport`, `useDashboardConfig`, `useBlog`, `useBlogModule`, `useMetaGenerator`, `useSchemaGenerator`, `useRankMySeoChat`, `usePageCollector`.

## License

Apache-2.0
