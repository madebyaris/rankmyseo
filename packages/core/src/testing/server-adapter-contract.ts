import { describe, it, expect, beforeEach } from "vitest";
import type { RankMySeoConfig } from "../config/schema.js";
import type { RankStore } from "../ports/index.js";

export interface ServerAdapterContractOptions {
  makeStore: () => RankStore | Promise<RankStore>;
  makeHandler: (store: RankStore, config: RankMySeoConfig) => (request: Request) => Promise<Response>;
  config: RankMySeoConfig;
  scopeHeaders?: Record<string, string>;
}

export function runServerAdapterContractTests(
  options: ServerAdapterContractOptions,
): void {
  describe("Server adapter contract", () => {
    let handler: (request: Request) => Promise<Response>;
    const scopeHeaders = options.scopeHeaders ?? {
      "x-tenant-id": options.config.tenantId,
      "x-project-id": options.config.projectId,
      "content-type": "application/json",
    };

    beforeEach(async () => {
      const store = await options.makeStore();
      await store.projects.create({
        id: options.config.projectId,
        tenantId: options.config.tenantId,
        name: "Contract Project",
        domain: "example.com",
      });
      handler = options.makeHandler(store, options.config);
    });

    it("creates keyword and appends snapshot", async () => {
      const keywordRes = await handler(
        new Request("http://localhost/keywords", {
          method: "POST",
          headers: scopeHeaders,
          body: JSON.stringify({
            text: "seo toolkit",
            country: "us",
            device: "desktop",
            tags: [],
          }),
        }),
      );
      expect(keywordRes.status).toBe(201);
      const keywordJson = (await keywordRes.json()) as { data: { id: string } };

      const snapshotRes = await handler(
        new Request("http://localhost/snapshots", {
          method: "POST",
          headers: scopeHeaders,
          body: JSON.stringify({
            keywordId: keywordJson.data.id,
            position: 4,
            url: "https://example.com/blog",
            source: "fixture",
            device: "desktop",
            country: "us",
            capturedAt: "2026-06-01T00:00:00.000Z",
          }),
        }),
      );
      expect(snapshotRes.status).toBe(201);

      const rangeRes = await handler(
        new Request(
          `http://localhost/snapshots?keywordId=${keywordJson.data.id}&from=2026-05-31T00:00:00.000Z&to=2026-06-02T00:00:00.000Z`,
          { headers: scopeHeaders },
        ),
      );
      expect(rangeRes.status).toBe(200);
      const rangeJson = (await rangeRes.json()) as {
        data: Array<{ position: number | null }>;
      };
      expect(rangeJson.data).toHaveLength(1);
    });

    it("serves sitemap.xml without scope headers", async () => {
      const res = await handler(new Request("http://localhost/sitemap.xml"));
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("xml");
    });

    it("serves llms.txt without scope headers", async () => {
      const res = await handler(new Request("http://localhost/llms.txt"));
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text.length).toBeGreaterThan(0);
    });

    it("returns 400 when scoped route lacks headers", async () => {
      const res = await handler(new Request("http://localhost/keywords"));
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string; code?: string };
      expect(body.error).toMatch(/x-tenant-id/i);
      expect(body.code).toBe("MISSING_SCOPE");
    });
  });
}
