import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

describe("built package import smoke", () => {
  it("imports ESM createStore from dist", async () => {
    const dist = path.resolve(__dirname, "../dist/index.js");
    const mod = await import(pathToFileURL(dist).href);
    expect(typeof mod.createStore).toBe("function");
  });

  it("imports CJS createStore from dist", () => {
    const require = createRequire(import.meta.url);
    const mod = require("../dist/index.cjs") as { createStore: unknown };
    expect(typeof mod.createStore).toBe("function");
  });
});
