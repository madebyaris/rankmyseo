import { describe, it, expect, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import {
  createRankMySeoPlugin,
  RankMySeoPlugin,
  useRankMySeoClient,
} from "./plugin.js";
import { useKeywords } from "./composables/use-keywords.js";

function mockOkJson(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ data }),
    text: async () => JSON.stringify({ data }),
  };
}

describe("RankMySeoPlugin", () => {
  it("injects client via createRankMySeoPlugin", () => {
    let seenBaseUrl: string | undefined;
    const Child = defineComponent({
      setup() {
        const client = useRankMySeoClient();
        seenBaseUrl = client.config.baseUrl;
        return () => h("div");
      },
    });

    mount(Child, {
      global: {
        plugins: [
          createRankMySeoPlugin({
            baseUrl: "http://localhost:3456",
            tenantId: "t",
            projectId: "p",
          }),
        ],
      },
    });

    expect(seenBaseUrl).toBe("http://localhost:3456");
  });

  it("injects client via RankMySeoPlugin options", () => {
    let seenTenant: string | undefined;
    const Child = defineComponent({
      setup() {
        const client = useRankMySeoClient();
        seenTenant = client.config.tenantId;
        return () => h("div");
      },
    });

    mount(Child, {
      global: {
        plugins: [
          [
            RankMySeoPlugin,
            {
              baseUrl: "http://localhost:3456",
              tenantId: "tenant-a",
              projectId: "project-1",
            },
          ],
        ],
      },
    });

    expect(seenTenant).toBe("tenant-a");
  });

  it("useRankMySeoClient throws without plugin", () => {
    const Child = defineComponent({
      setup() {
        useRankMySeoClient();
        return () => h("div");
      },
    });

    expect(() => mount(Child)).toThrow(/RankMySeoPlugin/);
  });
});

describe("useKeywords", () => {
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

    let api: ReturnType<typeof useKeywords> | undefined;
    const Child = defineComponent({
      setup() {
        api = useKeywords();
        return () => h("div");
      },
    });

    mount(Child, {
      global: {
        plugins: [
          createRankMySeoPlugin({
            baseUrl: "http://localhost:3456",
            tenantId: "t",
            projectId: "p",
            fetchImpl,
          }),
        ],
      },
    });

    expect(api).toBeDefined();
    await vi.waitFor(() => {
      expect(api!.loading.value).toBe(false);
    });

    expect(api!.keywords.value).toHaveLength(1);
    expect(api!.keywords.value[0]?.text).toBe("seo tools");
    expect(fetchImpl).toHaveBeenCalled();
  });
});
