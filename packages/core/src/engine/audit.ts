import type {
  AuditCheckResult,
  AuditCheckStatus,
  PageSignals,
} from "../schemas/index.js";

/** Bump when rule IDs or scoring methodology change in a baseline-breaking way. */
export const AUDIT_ENGINE_VERSION = "1" as const;

export interface AuditEngineResult {
  checks: AuditCheckResult[];
  score: number;
  engineVersion: typeof AUDIT_ENGINE_VERSION;
}

type RuleResult = {
  status: AuditCheckStatus;
  message: string;
};

type Rule = {
  ruleId: string;
  severity: AuditCheckResult["severity"];
  run: (signals: PageSignals) => RuleResult;
};

function measured(
  status: Exclude<AuditCheckStatus, "unknown">,
  message: string,
): RuleResult {
  return { status, message };
}

function unknown(message: string): RuleResult {
  return { status: "unknown", message };
}

const RULES: Rule[] = [
  {
    ruleId: "title-length",
    severity: "error",
    run: (s) => {
      if (s.title === undefined) {
        return measured("fail", "Missing title element");
      }
      const len = s.title.length;
      if (len >= 30 && len <= 60) {
        return measured("pass", `Title length ${len} is within 30–60 chars`);
      }
      return measured("fail", `Title length ${len} should be 30–60 chars`);
    },
  },
  {
    ruleId: "meta-description",
    severity: "warning",
    run: (s) => {
      if (s.metaDescription === undefined) {
        return measured("fail", "Missing meta description");
      }
      const len = s.metaDescription.length;
      if (len >= 70 && len <= 160) {
        return measured("pass", `Meta description ${len} chars is good`);
      }
      return measured("fail", `Meta description ${len} chars should be 70–160`);
    },
  },
  {
    ruleId: "canonical",
    severity: "warning",
    run: (s) => {
      if (s.canonical === undefined) {
        return unknown("Canonical URL not measured");
      }
      return s.canonical
        ? measured("pass", "Canonical URL is set")
        : measured("fail", "Missing canonical URL");
    },
  },
  {
    ruleId: "single-h1",
    severity: "error",
    run: (s) =>
      s.h1Count === 1
        ? measured("pass", "Exactly one H1 found")
        : measured("fail", `Found ${s.h1Count} H1 elements (expected 1)`),
  },
  {
    ruleId: "og-tags",
    severity: "info",
    run: (s) =>
      s.hasOgTags
        ? measured("pass", "Open Graph tags present")
        : measured("fail", "Missing Open Graph tags"),
  },
  {
    ruleId: "json-ld",
    severity: "info",
    run: (s) => {
      const types = s.jsonLdTypes ?? [];
      if (s.jsonLdValid === false) {
        return measured("fail", "JSON-LD present but invalid JSON");
      }
      if (s.hasJsonLd || types.length > 0) {
        const label =
          types.length > 0
            ? `JSON-LD present: ${types.join(", ")}`
            : "JSON-LD schema present";
        return measured("pass", label);
      }
      return measured("fail", "No JSON-LD schema found");
    },
  },
  {
    ruleId: "cwv-lcp",
    severity: "warning",
    run: (s) => {
      const lcp = s.webVitals?.lcp;
      if (lcp === undefined) {
        return unknown("LCP not measured");
      }
      return lcp <= 2500
        ? measured("pass", `LCP ${lcp}ms passes 2.5s threshold`)
        : measured("fail", `LCP ${lcp}ms exceeds 2.5s threshold`);
    },
  },
  {
    ruleId: "cwv-cls",
    severity: "warning",
    run: (s) => {
      const cls = s.webVitals?.cls;
      if (cls === undefined) {
        return unknown("CLS not measured");
      }
      return cls <= 0.1
        ? measured("pass", `CLS ${cls} passes 0.1 threshold`)
        : measured("fail", `CLS ${cls} exceeds 0.1 threshold`);
    },
  },
  {
    ruleId: "cwv-inp",
    severity: "warning",
    run: (s) => {
      const inp = s.webVitals?.inp;
      if (inp === undefined) {
        return unknown("INP not measured");
      }
      return inp <= 200
        ? measured("pass", `INP ${inp}ms passes 200ms threshold`)
        : measured("fail", `INP ${inp}ms exceeds 200ms threshold`);
    },
  },
  {
    ruleId: "https",
    severity: "error",
    run: (s) => {
      const isHttps = s.url.startsWith("https://");
      return isHttps
        ? measured("pass", "Served over HTTPS")
        : measured("fail", "Page is not served over HTTPS");
    },
  },
  {
    ruleId: "robots-indexable",
    severity: "error",
    run: (s) => {
      if (s.robotsNoindex === undefined && s.xRobotsNoindex === undefined) {
        return unknown("Indexability directives not measured");
      }
      const blocked = s.robotsNoindex === true || s.xRobotsNoindex === true;
      return blocked
        ? measured(
            "fail",
            "Page is blocked from indexing by a robots noindex directive",
          )
        : measured("pass", "Page is indexable");
    },
  },
  {
    ruleId: "viewport-meta",
    severity: "warning",
    run: (s) => {
      if (s.hasViewportMeta === undefined) {
        return unknown("Viewport meta not measured");
      }
      return s.hasViewportMeta
        ? measured("pass", "Mobile viewport meta tag present")
        : measured("fail", "Missing mobile viewport meta tag");
    },
  },
  {
    ruleId: "lang-attribute",
    severity: "warning",
    run: (s) => {
      if (s.lang === undefined) {
        return unknown("Language attribute not measured");
      }
      return s.lang
        ? measured("pass", `Document language declared (${s.lang})`)
        : measured("fail", "Missing <html lang> attribute");
    },
  },
  {
    ruleId: "heading-structure",
    severity: "info",
    run: (s) => {
      if (s.h2Count === undefined) {
        return unknown("Heading structure not measured");
      }
      return s.h2Count >= 1
        ? measured("pass", `Found ${s.h2Count} H2 subheadings`)
        : measured(
            "fail",
            "No H2 subheadings — content lacks a scannable structure",
          );
    },
  },
  {
    ruleId: "image-alt",
    severity: "warning",
    run: (s) => {
      if (s.imageCount === undefined || s.imagesWithAlt === undefined) {
        return unknown("Image alt coverage not measured");
      }
      if (s.imageCount === 0) {
        return measured("not_applicable", "No images to check for alt text");
      }
      const missing = s.imageCount - s.imagesWithAlt;
      return missing <= 0
        ? measured("pass", `All ${s.imageCount} images have alt text`)
        : measured(
            "fail",
            `${missing} of ${s.imageCount} images are missing alt text`,
          );
    },
  },
  {
    ruleId: "content-depth",
    severity: "warning",
    run: (s) => {
      if (s.wordCount === undefined) {
        return unknown("Content length not measured");
      }
      return s.wordCount >= 250
        ? measured("pass", `Content depth ${s.wordCount} words`)
        : measured(
            "fail",
            `Thin content: ${s.wordCount} words (aim for 250+)`,
          );
    },
  },
];

export function listAuditRuleIds(): readonly string[] {
  return RULES.map((rule) => rule.ruleId);
}

/**
 * Score = passed / (passed + failed) * 100.
 * Unknown and not_applicable checks are excluded so missing measurements
 * cannot inflate the score.
 */
export function runAuditChecks(signals: PageSignals): AuditEngineResult {
  const checks: AuditCheckResult[] = RULES.map((rule) => {
    const result = rule.run(signals);
    return {
      ruleId: rule.ruleId,
      passed: result.status === "pass" || result.status === "not_applicable",
      status: result.status,
      message: result.message,
      severity: rule.severity,
    };
  });

  const scored = checks.filter(
    (c) => c.status === "pass" || c.status === "fail",
  );
  const passed = scored.filter((c) => c.status === "pass").length;
  const score =
    scored.length === 0 ? 0 : Math.round((passed / scored.length) * 100);

  return { checks, score, engineVersion: AUDIT_ENGINE_VERSION };
}
