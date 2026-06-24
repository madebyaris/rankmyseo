import { describe, it, expect } from "vitest";
import {
  buildAuditRecommendations,
  buildBlogRecommendations,
} from "./recommend.js";

describe("buildAuditRecommendations", () => {
  it("creates prioritized recs only for failed checks", () => {
    const recs = buildAuditRecommendations([
      { ruleId: "title-length", passed: true, message: "ok", severity: "error" },
      { ruleId: "canonical", passed: false, message: "Missing canonical URL", severity: "warning" },
      { ruleId: "single-h1", passed: false, message: "Found 2 H1", severity: "error" },
    ]);

    expect(recs).toHaveLength(2);
    expect(recs.find((r) => r.id === "audit:single-h1")?.priority).toBe("high");
    expect(recs.find((r) => r.id === "audit:canonical")?.priority).toBe("medium");
  });
});

describe("buildBlogRecommendations", () => {
  it("flags missing meta and intent guidance", () => {
    const recs = buildBlogRecommendations({
      intent: "transactional",
      targetKeyword: "buy widgets",
      metaTitle: "",
      metaDescription: "",
      content: "Some content without the phrase.",
    });

    expect(recs.some((r) => r.id === "blog:meta-title")).toBe(true);
    expect(recs.some((r) => r.id === "blog:meta-description")).toBe(true);
    expect(recs.some((r) => r.id === "blog:keyword-in-body")).toBe(true);
    expect(recs.some((r) => r.id === "blog:intent-transactional")).toBe(true);
  });
});
