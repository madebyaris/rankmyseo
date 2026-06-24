import { describe, it, expect, vi } from "vitest";
import { ManualScheduler } from "./manual.js";
import { registerIngestionJob } from "./ingest-job.js";
import type { RankDataSource, RankStore } from "@rankmyseo/core";

describe("registerIngestionJob", () => {
  it("runs ingestion when triggered manually", async () => {
    const scheduler = new ManualScheduler();
    const fetchPositions = vi.fn().mockResolvedValue([
      {
        tenantId: "t",
        projectId: "p",
        keywordId: "kw-1",
        position: 5,
        url: "https://example.com",
        source: "fixture",
        device: "desktop" as const,
        country: "us",
        capturedAt: new Date(),
      },
    ]);

    const dataSource = {
      id: "fixture",
      capabilities: { ownedOnly: false, realtime: true, competitors: true },
      fetchPositions,
    } satisfies RankDataSource;

    const append = vi.fn().mockImplementation(async (input) => ({
      ...input,
      id: "snap-1",
    }));

    const store = {
      snapshots: { append },
    } as unknown as RankStore;

    registerIngestionJob(scheduler, {
      dataSource,
      store,
      getQuery: async () => ({
        tenantId: "t",
        projectId: "p",
        keywordIds: ["kw-1"],
        country: "us",
        device: "desktop",
      }),
    });

    await scheduler.run("rank-ingestion");

    expect(fetchPositions).toHaveBeenCalledOnce();
    expect(append).toHaveBeenCalledOnce();
    expect(scheduler.runs).toContain("rank-ingestion");
  });
});
