import { useEffect } from "react";
import {
  collectPageSignals,
  postPageSignals,
  startPageCollector,
  type PageCollectorConfig,
} from "@rankmyseo/collector";

export { collectPageSignals, postPageSignals, startPageCollector };
export type { PageCollectorConfig };

export function usePageCollector(options: {
  baseUrl: string;
  tenantId: string;
  projectId: string;
  enabled?: boolean;
  delayMs?: number;
}) {
  const enabled = options.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    return startPageCollector({
      baseUrl: options.baseUrl,
      tenantId: options.tenantId,
      projectId: options.projectId,
      delayMs: options.delayMs,
    });
  }, [
    enabled,
    options.baseUrl,
    options.tenantId,
    options.projectId,
    options.delayMs,
  ]);
}
