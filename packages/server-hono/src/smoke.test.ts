import { describe, it, expect } from "vitest";
import { createStore } from "@rankmyseo/storage";
import { createRankMySeoApp } from "./index.js";

describe("createRankMySeoApp smoke", () => {
  const scopeHeaders = {
    "x-tenant-id": "tenant-a",
    "x-project-id": "project-1",
  };

  it("adds keyword -> appends snapshot -> range-reads snapshots", async () => {
    const store = createStore(":memory:");
    await store.projects.create({
      id: "project-1",
      tenantId: "tenant-a",
      name: "Smoke Project",
      domain: "example.com",
    });

    const app = createRankMySeoApp(store);

    const keywordRes = await app.request("/keywords", {
      method: "POST",
      headers: {
        ...scopeHeaders,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text: "seo toolkit",
        country: "us",
        device: "desktop",
        tags: [],
      }),
    });

    expect(keywordRes.status).toBe(201);
    const keywordJson = (await keywordRes.json()) as {
      data: { id: string };
    };
    const keywordId = keywordJson.data.id;

    const snapshotRes = await app.request("/snapshots", {
      method: "POST",
      headers: {
        ...scopeHeaders,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        keywordId,
        position: 4,
        url: "https://example.com/blog",
        source: "gsc",
        device: "desktop",
        country: "us",
        capturedAt: "2026-06-01T00:00:00.000Z",
      }),
    });

    expect(snapshotRes.status).toBe(201);

    const rangeRes = await app.request(
      `/snapshots?keywordId=${keywordId}&from=2026-05-31T00:00:00.000Z&to=2026-06-02T00:00:00.000Z`,
      {
        method: "GET",
        headers: scopeHeaders,
      },
    );

    expect(rangeRes.status).toBe(200);
    const rangeJson = (await rangeRes.json()) as {
      data: Array<{ position: number | null }>;
    };
    expect(rangeJson.data).toHaveLength(1);
    expect(rangeJson.data[0]?.position).toBe(4);
  });
});
