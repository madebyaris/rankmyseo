import { createContext, useContext } from "react";
import {
  createRankMySeoClient as createTypedClient,
  type RankMySeoClient,
  type RankMySeoClientConfig,
} from "@rankmyseo/client";

export type { RankMySeoClientConfig };

export interface RankMySeoContextValue extends RankMySeoClientConfig {
  /** Low-level raw JSON helper (compat). Returns the full response body. */
  api: <T>(path: string, init?: RequestInit) => Promise<T>;
  /** Typed framework-neutral client. */
  client: RankMySeoClient;
}

const RankMySeoContext = createContext<RankMySeoContextValue | null>(null);

/**
 * Creates a React context value backed by `@rankmyseo/client`.
 * Preserves the legacy `.api()` surface used by existing hooks.
 */
export function createRankMySeoClient(
  config: RankMySeoClientConfig,
): RankMySeoContextValue {
  const client = createTypedClient(config);
  return {
    ...config,
    api: client.api,
    client,
  };
}

export function RankMySeoProvider({
  value,
  children,
}: {
  value: RankMySeoContextValue;
  children: React.ReactNode;
}) {
  return (
    <RankMySeoContext.Provider value={value}>{children}</RankMySeoContext.Provider>
  );
}

export function useRankMySeoClient(): RankMySeoContextValue {
  const ctx = useContext(RankMySeoContext);
  if (!ctx) {
    throw new Error("useRankMySeoClient must be used within RankMySeoProvider");
  }
  return ctx;
}
