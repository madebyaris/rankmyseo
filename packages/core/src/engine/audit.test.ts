import { describe, it, expect } from "vitest";
import { runAuditChecks, AUDIT_ENGINE_VERSION } from "../engine/audit.js";

describe("runAuditChecks", () => {
  it("scores a well-optimized page highly", () => {
    const result = runAuditChecks({
      url: "https://example.com",
      title: "Best SEO Tools for Developers in 2026",
      metaDescription:
        "A comprehensive guide to the best SEO tools for developers, covering rank tracking, audits, and more for your workflow.",
      canonical: "https://example.com",
      h1Count: 1,
      h2Count: 4,
      hasOgTags: true,
      hasJsonLd: true,
      lang: "en",
      hasViewportMeta: true,
      robotsNoindex: false,
      imageCount: 3,
      imagesWithAlt: 3,
      wordCount: 800,
      webVitals: { lcp: 2000, cls: 0.05, inp: 120 },
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.engineVersion).toBe(AUDIT_ENGINE_VERSION);
    expect(result.checks.every((c) => c.ruleId && c.status)).toBe(true);
  });

  it("flags missing title and multiple H1s", () => {
    const result = runAuditChecks({
      url: "http://example.com/bad",
      h1Count: 3,
      h2Count: 0,
      hasOgTags: false,
      hasJsonLd: false,
      lang: null,
      hasViewportMeta: false,
      robotsNoindex: true,
      imageCount: 4,
      imagesWithAlt: 0,
      wordCount: 40,
      webVitals: { lcp: 5000, cls: 0.5, inp: 600 },
    });

    const titleCheck = result.checks.find((c) => c.ruleId === "title-length");
    const h1Check = result.checks.find((c) => c.ruleId === "single-h1");

    expect(titleCheck?.passed).toBe(false);
    expect(titleCheck?.status).toBe("fail");
    expect(h1Check?.passed).toBe(false);
    expect(result.score).toBeLessThan(50);
  });

  it("flags HTTP, noindex, missing viewport, INP and thin content", () => {
    const result = runAuditChecks({
      url: "http://example.com/bad",
      h1Count: 1,
      h2Count: 0,
      hasOgTags: false,
      hasJsonLd: false,
      lang: null,
      hasViewportMeta: false,
      robotsNoindex: true,
      imageCount: 4,
      imagesWithAlt: 1,
      wordCount: 40,
      webVitals: { inp: 600 },
    });

    const byId = (id: string) => result.checks.find((c) => c.ruleId === id);
    expect(byId("https")?.status).toBe("fail");
    expect(byId("robots-indexable")?.status).toBe("fail");
    expect(byId("viewport-meta")?.status).toBe("fail");
    expect(byId("lang-attribute")?.status).toBe("fail");
    expect(byId("heading-structure")?.status).toBe("fail");
    expect(byId("image-alt")?.status).toBe("fail");
    expect(byId("content-depth")?.status).toBe("fail");
    expect(byId("cwv-inp")?.status).toBe("fail");
  });

  it("marks unmeasured signals as unknown and excludes them from the score", () => {
    const result = runAuditChecks({
      url: "https://example.com",
      title: "A reasonable title for the homepage of the site",
      metaDescription:
        "A reasonable meta description that summarizes the page content within the recommended length window for snippets.",
      canonical: "https://example.com",
      h1Count: 1,
      hasOgTags: true,
      hasJsonLd: true,
    });

    const byId = (id: string) => result.checks.find((c) => c.ruleId === id);
    expect(byId("viewport-meta")?.status).toBe("unknown");
    expect(byId("image-alt")?.status).toBe("unknown");
    expect(byId("content-depth")?.status).toBe("unknown");
    expect(byId("cwv-inp")?.status).toBe("unknown");
    expect(byId("https")?.status).toBe("pass");
    expect(result.score).toBe(100);
  });
});
