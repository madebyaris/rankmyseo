import { createContext, useContext } from "react";

export interface RankMySeoClientConfig {
  baseUrl: string;
  tenantId: string;
  projectId: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

export interface RankMySeoContextValue extends RankMySeoClientConfig {
  api: <T>(path: string, init?: RequestInit) => Promise<T>;
}

const RankMySeoContext = createContext<RankMySeoContextValue | null>(null);

export function createRankMySeoClient(
  config: RankMySeoClientConfig,
): RankMySeoContextValue {
  const fetchImpl = config.fetchImpl ?? fetch;

  async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("x-tenant-id", config.tenantId);
    headers.set("x-project-id", config.projectId);
    headers.set("content-type", "application/json");
    if (config.token) headers.set("authorization", `Bearer ${config.token}`);

    const res = await fetchImpl(`${config.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!res.ok) {
      throw new Error(`RankMySEO API error: ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return { ...config, api };
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
