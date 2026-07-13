import { describe, expect, it } from "vitest";
import {
  normalizeBasePath,
  stripBasePath,
  rewriteRequestBasePath,
} from "./handler.js";

describe("basePath helpers", () => {
  it("normalizes trailing and missing slashes", () => {
    expect(normalizeBasePath(undefined)).toBe("");
    expect(normalizeBasePath("/")).toBe("");
    expect(normalizeBasePath("api/seo")).toBe("/api/seo");
    expect(normalizeBasePath("/api/seo/")).toBe("/api/seo");
  });

  it("strips mounted prefixes", () => {
    expect(stripBasePath("/api/seo", "/api/seo")).toBe("/");
    expect(stripBasePath("/api/seo/keywords", "/api/seo")).toBe("/keywords");
    expect(stripBasePath("/other", "/api/seo")).toBeNull();
  });

  it("rewrites request URLs under the mount", () => {
    const rewritten = rewriteRequestBasePath(
      new Request("http://localhost/api/seo/keywords?x=1"),
      "/api/seo",
    );
    expect(rewritten).not.toBeNull();
    expect(new URL(rewritten!.url).pathname).toBe("/keywords");
    expect(new URL(rewritten!.url).searchParams.get("x")).toBe("1");

    expect(
      rewriteRequestBasePath(new Request("http://localhost/keywords"), "/api/seo"),
    ).toBeNull();
  });
});
