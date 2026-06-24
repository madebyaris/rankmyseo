import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { RankMySeoProvider, createRankMySeoClient } from "../client.js";
import { useKeywords } from "./use-keywords.js";

describe("useKeywords", () => {
  it("loads keywords from mocked API", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
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
        ],
      }),
    });

    const client = createRankMySeoClient({
      baseUrl: "http://localhost:3456",
      tenantId: "t",
      projectId: "p",
      fetchImpl,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RankMySeoProvider value={client}>{children}</RankMySeoProvider>
    );

    const { result } = renderHook(() => useKeywords(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.keywords).toHaveLength(1);
    expect(result.current.keywords[0]?.text).toBe("seo tools");
  });
});
