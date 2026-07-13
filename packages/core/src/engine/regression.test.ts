import { describe, expect, it } from "vitest";
import {
  AUDIT_ENGINE_VERSION,
  comparePageSnapshots,
  SEO_PAGE_SNAPSHOT_VERSION,
  summarizeRegression,
  type PageSignals,
  type SeoPageSnapshot,
} from "../index.js";

function snapshot(
  overrides: Partial<Omit<SeoPageSnapshot, "signals" | "audit">> & {
    signals?: Partial<PageSignals>;
    audit?: SeoPageSnapshot["audit"];
  } = {},
): SeoPageSnapshot {
  const url = overrides.requestedUrl ?? "https://example.com/";
  return {
    version: SEO_PAGE_SNAPSHOT_VERSION,
    route: overrides.route ?? "/",
    requestedUrl: url,
    finalUrl: overrides.finalUrl ?? url,
    statusCode: overrides.statusCode ?? 200,
    redirectChain: overrides.redirectChain ?? [],
    signals: {
      url: overrides.finalUrl ?? url,
      title: "Example page title here for testing",
      metaDescription:
        "A long enough meta description that stays within recommended bounds for search snippets.",
      canonical: "https://example.com/",
      h1Count: 1,
      hasOgTags: true,
      hasJsonLd: true,
      jsonLdTypes: ["Article"],
      jsonLdValid: true,
      robotsNoindex: false,
      xRobotsNoindex: false,
      ...overrides.signals,
    },
    audit: overrides.audit ?? {
      score: 90,
      checks: [],
      engineVersion: AUDIT_ENGINE_VERSION,
    },
    capturedAt: overrides.capturedAt ?? new Date().toISOString(),
    originLabel: overrides.originLabel ?? "production",
  };
}

describe("comparePageSnapshots", () => {
  it("flags healthy → unhealthy transitions only", () => {
    const baseline = snapshot({});
    const current = snapshot({
      originLabel: "preview",
      statusCode: 500,
      signals: {
        title: undefined,
        canonical: null,
        robotsNoindex: true,
        jsonLdTypes: [],
        jsonLdValid: false,
        hasJsonLd: false,
      },
    });

    const findings = comparePageSnapshots({ baseline, current });
    const ids = findings.map((f) => f.ruleId);
    expect(ids).toContain("http-status");
    expect(ids).toContain("indexability");
    expect(ids).toContain("canonical");
    expect(ids).toContain("title");
    expect(ids).toContain("json-ld");
  });

  it("ignores pre-existing failures and improvements", () => {
    const baseline = snapshot({
      statusCode: 500,
      signals: { title: undefined, robotsNoindex: true },
    });
    const current = snapshot({
      originLabel: "preview",
      statusCode: 200,
      signals: {
        title: "Recovered title for the improved page",
        robotsNoindex: false,
      },
    });

    expect(comparePageSnapshots({ baseline, current })).toEqual([]);
  });

  it("does not fail on score-only noise", () => {
    const baseline = snapshot({
      audit: { score: 90, checks: [], engineVersion: AUDIT_ENGINE_VERSION },
    });
    const current = snapshot({
      originLabel: "preview",
      audit: { score: 40, checks: [], engineVersion: AUDIT_ENGINE_VERSION },
    });
    expect(comparePageSnapshots({ baseline, current })).toEqual([]);
  });

  it("summarizeRegression gates by severity", () => {
    const findings = comparePageSnapshots({
      baseline: snapshot({}),
      current: snapshot({
        originLabel: "preview",
        signals: { canonical: "https://example.com/other" },
      }),
    });
    const warningOnly = summarizeRegression({
      findings,
      productionOrigin: "https://example.com",
      candidateOrigin: "https://preview.example.com",
      routesScanned: ["/"],
      failOn: "error",
    });
    expect(warningOnly.ok).toBe(true);

    const failWarnings = summarizeRegression({
      findings,
      productionOrigin: "https://example.com",
      candidateOrigin: "https://preview.example.com",
      routesScanned: ["/"],
      failOn: "warning",
    });
    expect(failWarnings.ok).toBe(false);
  });
});
