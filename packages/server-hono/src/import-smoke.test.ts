import { describe, expect, it } from "vitest";
import { pathToFileURL } from "node:url";
import path from "node:path";

describe("built package import smoke", () => {
  it("imports ESM createRankMySeoApp from dist", async () => {
    const dist = path.resolve(__dirname, "../dist/index.js");
    const mod = await import(pathToFileURL(dist).href);
    expect(typeof mod.createRankMySeoApp).toBe("function");
  });
});
