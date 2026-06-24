import { describe, it, expect } from "vitest";
import { generateMeta, slugify } from "./meta.js";
import { runAuditChecks } from "./audit.js";

describe("slugify", () => {
  it("normalizes to a url-safe slug", () => {
    expect(slugify("Best SEO Tools 2026!")).toBe("best-seo-tools-2026");
  });
});

describe("generateMeta", () => {
  it("produces meta that passes the audit title/description rules", () => {
    const meta = generateMeta({
      title: "How to choose the best SEO tools for small teams",
      content:
        "Choosing SEO tools is hard. This guide compares the best SEO tools for small teams, covering rank tracking, audits, and reporting so you can pick the right fit.",
      targetKeyword: "best seo tools",
      url: "https://example.com/best-seo-tools",
      siteName: "RankMySEO",
    });

    expect(meta.metaTitle.length).toBeLessThanOrEqual(60);
    expect(meta.metaDescription.length).toBeLessThanOrEqual(160);
    expect(meta.slug).toBe("best-seo-tools");
    expect(meta.canonical).toBe("https://example.com/best-seo-tools");
    expect(meta.html).toContain("<title>");
    expect(meta.html).toContain('property="og:title"');
    expect(meta.html).toContain("application/ld+json");

    const { checks } = runAuditChecks({
      url: "https://example.com/best-seo-tools",
      title: meta.metaTitle,
      metaDescription: meta.metaDescription,
      canonical: meta.canonical,
      h1Count: 1,
      hasOgTags: true,
      hasJsonLd: true,
    });
    const titleCheck = checks.find((c) => c.ruleId === "title-length");
    const descCheck = checks.find((c) => c.ruleId === "meta-description");
    expect(titleCheck?.passed).toBe(true);
    expect(descCheck?.passed).toBe(true);
  });

  it("synthesizes a description when no content is given", () => {
    const meta = generateMeta({
      title: "Pricing",
      targetKeyword: "seo pricing",
    });
    expect(meta.metaDescription.toLowerCase()).toContain("seo pricing");
  });
});
