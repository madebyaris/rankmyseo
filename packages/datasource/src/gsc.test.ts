import { describe, expect, it } from "vitest";
import { GscDataSource } from "./gsc.js";

describe("GscDataSource", () => {
  it("maps Search Console query text to keyword ids", async () => {
    const source = new GscDataSource({
      accessToken: "token",
      siteUrl: "https://example.com",
      keywords: [
        { id: "kw-1", text: "best seo tools" },
        { id: "kw-2", text: "rank tracker" },
      ],
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            rows: [
              { keys: ["best seo tools"], position: 3.2 },
              { keys: ["other query"], position: 10 },
            ],
          }),
          { status: 200 },
        ),
    });

    const snapshots = await source.fetchPositions({
      tenantId: "t",
      projectId: "p",
      keywordIds: ["kw-1", "kw-2"],
      country: "us",
      device: "desktop",
    });

    expect(snapshots).toHaveLength(2);
    expect(snapshots[0]?.position).toBe(3);
    expect(snapshots[1]?.position).toBeNull();
    expect(snapshots[0]?.serpFeatures?.metric).toBe(
      "search_console_average_position",
    );
  });
});
