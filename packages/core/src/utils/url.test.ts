import { describe, expect, it } from "vitest";
import { normalizeHttpUrl } from "./url.js";

describe("normalizeHttpUrl", () => {
  it("adds https when scheme is omitted", () => {
    expect(normalizeHttpUrl("madebyaris.com").href).toBe("https://madebyaris.com/");
    expect(normalizeHttpUrl("example.com/about").href).toBe(
      "https://example.com/about",
    );
  });

  it("preserves explicit http(s) URLs", () => {
    expect(normalizeHttpUrl("https://example.com").href).toBe("https://example.com/");
    expect(normalizeHttpUrl("http://example.com").href).toBe("http://example.com/");
  });

  it("trims whitespace", () => {
    expect(normalizeHttpUrl("  example.com  ").href).toBe("https://example.com/");
  });

  it("throws on empty input", () => {
    expect(() => normalizeHttpUrl("   ")).toThrow("URL is required");
  });

  it("throws on invalid URLs", () => {
    expect(() => normalizeHttpUrl("not a url")).toThrow();
  });
});
