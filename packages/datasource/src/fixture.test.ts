import { describe, it, expect } from "vitest";
import { FixtureDataSource } from "./fixture.js";

describe("FixtureDataSource", () => {
  it("returns deterministic positions per keyword", async () => {
    const ds = new FixtureDataSource();
    const result = await ds.fetchPositions({
      tenantId: "t",
      projectId: "p",
      keywordIds: ["kw-a", "kw-b"],
      country: "us",
      device: "desktop",
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.source).toBe("fixture");
    expect(result[0]?.position).toBeGreaterThan(0);

    const again = await ds.fetchPositions({
      tenantId: "t",
      projectId: "p",
      keywordIds: ["kw-a"],
      country: "us",
      device: "desktop",
    });
    expect(again[0]?.position).toBe(result[0]?.position);
  });
});
