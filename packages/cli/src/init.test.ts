import { describe, it, expect } from "vitest";
import { scaffoldConfig } from "./init.js";

describe("scaffoldConfig", () => {
  it("includes defineConfig and fixture datasource", () => {
    const content = scaffoldConfig();
    expect(content).toContain("defineConfig");
    expect(content).toContain('provider: "fixture"');
    expect(content).toContain("rankmyseo.sqlite");
  });
});
