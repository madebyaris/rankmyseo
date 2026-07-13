import type { PageSignals } from "@rankmyseo/core/schemas";
import {
  collectPageSignals,
  type CollectPageSignalsContext,
} from "./collect.js";

export interface PageCollectorConfig {
  baseUrl: string;
  tenantId: string;
  projectId: string;
  fetchImpl?: typeof fetch;
  /** Delay before posting signals when started via `startPageCollector`. Default 3000. */
  delayMs?: number;
}

export async function postPageSignals(
  config: PageCollectorConfig,
  webVitals?: PageSignals["webVitals"],
  collectCtx?: CollectPageSignalsContext,
): Promise<void> {
  const fetchImpl = config.fetchImpl ?? fetch;
  const signals = { ...collectPageSignals(collectCtx), webVitals };
  await fetchImpl(`${config.baseUrl}/collect`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tenant-id": config.tenantId,
      "x-project-id": config.projectId,
    },
    body: JSON.stringify(signals),
  });
}
