import { describe, it, expect } from "vitest";
import { runAuditChecks } from "../engine/audit.js";

describe("runAuditChecks", () => {
  it("scores a well-optimized page highly", () => {
    const result = runAuditChecks({
      url: "https://example.com",
      title: "Best SEO Tools for Developers in 2026",
      metaDescription:
        "A comprehensive guide to the best SEO tools for developers, covering rank tracking, audits, and more for your workflow.",
      canonical: "https://example.com",
      h1Count: 1,
      hasOgTags: true,
      hasJsonLd: true,
      webVitals: { lcp: 2000, cls: 0.05 },
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.checks.every((c) => c.ruleId)).toBe(true);
  });

  it("flags missing title and multiple H1s", () => {
    const result = runAuditChecks({
      url: "https://example.com/bad",
      h1Count: 3,
      hasOgTags: false,
      hasJsonLd: false,
    });

    const titleCheck = result.checks.find((c) => c.ruleId === "title-length");
    const h1Check = result.checks.find((c) => c.ruleId === "single-h1");

    expect(titleCheck?.passed).toBe(false);
    expect(h1Check?.passed).toBe(false);
    expect(result.score).toBeLessThan(50);
  });
});
