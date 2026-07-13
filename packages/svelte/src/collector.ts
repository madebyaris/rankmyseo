import {
  collectPageSignals,
  postPageSignals,
  startPageCollector,
  type PageCollectorConfig,
  type StartPageCollectorOptions,
} from "@rankmyseo/collector";

export { collectPageSignals, postPageSignals, startPageCollector };
export type { PageCollectorConfig, StartPageCollectorOptions };

/**
 * Starts the page collector. Call from `onMount` and return the dispose
 * function (or call it in `onDestroy`).
 *
 * ```ts
 * import { onMount } from "svelte";
 * import { mountPageCollector } from "@rankmyseo/svelte";
 *
 * onMount(() => mountPageCollector({ baseUrl, tenantId, projectId }));
 * ```
 */
export function mountPageCollector(
  options: StartPageCollectorOptions & { enabled?: boolean },
): () => void {
  if (options.enabled === false) {
    return () => {};
  }
  return startPageCollector(options);
}
