import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

/**
 * Import smoke against built dist without Vitest aliases.
 * Proves generic Node can load the package (no React/Next server-only guard).
 */
describe("built package import smoke", () => {
  it("imports ESM createHandler from dist", async () => {
    const dist = path.resolve(__dirname, "../dist/index.js");
    const mod = await import(pathToFileURL(dist).href);
    expect(typeof mod.createHandler).toBe("function");
    expect(typeof mod.stripBasePath).toBe("function");
  });

  it("imports CJS createHandler from dist", () => {
    const require = createRequire(import.meta.url);
    const mod = require("../dist/index.cjs") as {
      createHandler: unknown;
      stripBasePath: unknown;
    };
    expect(typeof mod.createHandler).toBe("function");
    expect(typeof mod.stripBasePath).toBe("function");
  });
});
