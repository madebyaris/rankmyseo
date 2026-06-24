import { describe, it, expect } from "vitest";
import { buildReport, buildReportSummary } from "../engine/report.js";

describe("buildReport", () => {
  const keywords = [
    {
      id: "kw-1",
      tenantId: "t",
      projectId: "p",
      text: "seo tools",
      country: "us",
      device: "desktop" as const,
      tags: [],
      createdAt: new Date(),
    },
    {
      id: "kw-2",
      tenantId: "t",
      projectId: "p",
      text: "rank tracker",
      country: "us",
      device: "desktop" as const,
      tags: [],
      createdAt: new Date(),
    },
  ];

  const snapshots = [
    {
      id: "s1",
      tenantId: "t",
      projectId: "p",
      keywordId: "kw-1",
      position: 10,
      url: "https://example.com",
      source: "fixture",
      device: "desktop" as const,
      country: "us",
      capturedAt: new Date("2026-06-01T00:00:00.000Z"),
    },
    {
      id: "s2",
      tenantId: "t",
      projectId: "p",
      keywordId: "kw-1",
      position: 5,
      url: "https://example.com",
      source: "fixture",
      device: "desktop" as const,
      country: "us",
      capturedAt: new Date("2026-06-07T00:00:00.000Z"),
    },
    {
      id: "s3",
      tenantId: "t",
      projectId: "p",
      keywordId: "kw-2",
      position: 8,
      url: "https://example.com",
      source: "fixture",
      device: "desktop" as const,
      country: "us",
      capturedAt: new Date("2026-06-07T00:00:00.000Z"),
    },
  ];

  it("computes top movers and avg delta", () => {
    const from = new Date("2026-06-01T00:00:00.000Z");
    const to = new Date("2026-06-07T00:00:00.000Z");

    const summary = buildReportSummary({
      keywords,
      snapshots,
      audits: [],
      from,
      to,
    });

    expect(summary.topMovers[0]?.keywordText).toBe("seo tools");
    expect(summary.topMovers[0]?.delta).toBe(5);
    expect(summary.avgPositionDelta).toBe(2.5);
  });

  it("builds a full report object", () => {
    const from = new Date("2026-06-01T00:00:00.000Z");
    const to = new Date("2026-06-07T00:00:00.000Z");

    const report = buildReport({
      tenantId: "t",
      projectId: "p",
      title: "June report",
      from,
      to,
      keywords,
      snapshots,
      audits: [],
    });

    expect(report.title).toBe("June report");
    expect(report.summary?.topMovers.length).toBeGreaterThan(0);
  });
});
