import { onMounted, onUnmounted } from "vue";
import {
  collectPageSignals,
  postPageSignals,
  startPageCollector,
  type PageCollectorConfig,
  type StartPageCollectorOptions,
} from "@rankmyseo/collector";

export { collectPageSignals, postPageSignals, startPageCollector };
export type { PageCollectorConfig, StartPageCollectorOptions };

export function usePageCollector(options: {
  baseUrl: string;
  tenantId: string;
  projectId: string;
  enabled?: boolean;
  delayMs?: number;
  fetchImpl?: typeof fetch;
}) {
  let dispose: (() => void) | undefined;

  onMounted(() => {
    if (options.enabled === false) return;
    dispose = startPageCollector({
      baseUrl: options.baseUrl,
      tenantId: options.tenantId,
      projectId: options.projectId,
      delayMs: options.delayMs,
      fetchImpl: options.fetchImpl,
    });
  });

  onUnmounted(() => {
    dispose?.();
    dispose = undefined;
  });
}
