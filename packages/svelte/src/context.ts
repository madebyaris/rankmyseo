import { getContext, setContext } from "svelte";
import {
  createRankMySeoClient,
  type RankMySeoClient,
  type RankMySeoClientConfig,
} from "@rankmyseo/client";

export type { RankMySeoClient, RankMySeoClientConfig };

export const RANKMYSEO_CONTEXT_KEY = "rankmyseo-client";

export function setRankMySeoContext(client: RankMySeoClient): void {
  setContext(RANKMYSEO_CONTEXT_KEY, client);
}

export function getRankMySeoContext(): RankMySeoClient {
  const client = getContext<RankMySeoClient | undefined>(RANKMYSEO_CONTEXT_KEY);
  if (!client) {
    throw new Error(
      "RankMySEO context not set. Call setRankMySeoContext(client) in a parent component.",
    );
  }
  return client;
}

/**
 * Convenience: create a typed client and set it as Svelte context.
 * Call from a root layout / +layout.svelte `onMount` is too late — call during
 * component init (top-level of `<script>`).
 */
export function initRankMySeoContext(
  config: RankMySeoClientConfig,
): RankMySeoClient {
  const client = createRankMySeoClient(config);
  setRankMySeoContext(client);
  return client;
}

export { createRankMySeoClient };
