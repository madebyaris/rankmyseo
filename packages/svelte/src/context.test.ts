import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "svelte/store";
import {
  createRankMySeoClient,
  setRankMySeoContext,
  getRankMySeoContext,
  RANKMYSEO_CONTEXT_KEY,
} from "./context.js";
import { createKeywordsStore } from "./stores/keywords.js";
import { mountPageCollector } from "./collector.js";

const contextMap = new Map<unknown, unknown>();

vi.mock("svelte", async (importOriginal) => {
  const actual = await importOriginal<typeof import("svelte")>();
  return {
    ...actual,
    setContext: (key: unknown, value: unknown) => {
      contextMap.set(key, value);
    },
    getContext: (key: unknown) => contextMap.get(key),
  };
});

function mockOkJson(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ data }),
    text: async () => JSON.stringify({ data }),
  };
}

describe("RankMySEO context", () => {
  beforeEach(() => {
    contextMap.clear();
  });

  it("setRankMySeoContext / getRankMySeoContext round-trip", () => {
    const client = createRankMySeoClient({
      baseUrl: "http://localhost:3456",
      tenantId: "t",
      projectId: "p",
    });
    setRankMySeoContext(client);
    expect(getRankMySeoContext()).toBe(client);
    expect(contextMap.get(RANKMYSEO_CONTEXT_KEY)).toBe(client);
  });

  it("getRankMySeoContext throws when unset", () => {
    expect(() => getRankMySeoContext()).toThrow(/context not set/i);
  });
});

describe("createKeywordsStore", () => {
  it("loads keywords from mocked API", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      mockOkJson([
        {
          id: "kw-1",
          tenantId: "t",
          projectId: "p",
          text: "seo tools",
          country: "us",
          device: "desktop",
          tags: [],
          createdAt: new Date().toISOString(),
        },
      ]),
    );

    const client = createRankMySeoClient({
      baseUrl: "http://localhost:3456",
      tenantId: "t",
      projectId: "p",
      fetchImpl,
    });

    const store = createKeywordsStore(client);

    await vi.waitFor(() => {
      expect(get(store.loading)).toBe(false);
    });

    expect(get(store.keywords)).toHaveLength(1);
    expect(get(store.keywords)[0]?.text).toBe("seo tools");
    expect(get(store.error)).toBeNull();
  });
});

describe("mountPageCollector", () => {
  it("returns a no-op dispose when enabled is false", () => {
    const dispose = mountPageCollector({
      baseUrl: "http://localhost:3456",
      tenantId: "t",
      projectId: "p",
      enabled: false,
    });
    expect(typeof dispose).toBe("function");
    dispose();
  });

  it("starts collector when enabled", () => {
    const dispose = mountPageCollector({
      baseUrl: "http://localhost:3456",
      tenantId: "t",
      projectId: "p",
      delayMs: 10,
      loadWebVitals: async () => ({
        onCLS: () => {},
        onLCP: () => {},
        onINP: () => {},
      }),
    });
    expect(typeof dispose).toBe("function");
    dispose();
  });
});
