import type { AuditCheckResult, PageSignals } from "../schemas/index.js";

export interface AuditEngineResult {
  checks: AuditCheckResult[];
  score: number;
}

type Rule = {
  ruleId: string;
  severity: AuditCheckResult["severity"];
  run: (signals: PageSignals) => { passed: boolean; message: string };
};

const RULES: Rule[] = [
  {
    ruleId: "title-length",
    severity: "error",
    run: (s) => {
      const len = s.title?.length ?? 0;
      if (len >= 30 && len <= 60) {
        return { passed: true, message: `Title length ${len} is within 30–60 chars` };
      }
      return {
        passed: false,
        message: `Title length ${len} should be 30–60 chars`,
      };
    },
  },
  {
    ruleId: "meta-description",
    severity: "warning",
    run: (s) => {
      const len = s.metaDescription?.length ?? 0;
      if (len >= 70 && len <= 160) {
        return { passed: true, message: `Meta description ${len} chars is good` };
      }
      return {
        passed: false,
        message: `Meta description ${len} chars should be 70–160`,
      };
    },
  },
  {
    ruleId: "canonical",
    severity: "warning",
    run: (s) => ({
      passed: Boolean(s.canonical),
      message: s.canonical
        ? "Canonical URL is set"
        : "Missing canonical URL",
    }),
  },
  {
    ruleId: "single-h1",
    severity: "error",
    run: (s) => ({
      passed: s.h1Count === 1,
      message:
        s.h1Count === 1
          ? "Exactly one H1 found"
          : `Found ${s.h1Count} H1 elements (expected 1)`,
    }),
  },
  {
    ruleId: "og-tags",
    severity: "info",
    run: (s) => ({
      passed: s.hasOgTags,
      message: s.hasOgTags ? "Open Graph tags present" : "Missing Open Graph tags",
    }),
  },
  {
    ruleId: "json-ld",
    severity: "info",
    run: (s) => {
      const types = s.jsonLdTypes ?? [];
      if (s.hasJsonLd || types.length > 0) {
        const label =
          types.length > 0
            ? `JSON-LD present: ${types.join(", ")}`
            : "JSON-LD schema present";
        return { passed: true, message: label };
      }
      return { passed: false, message: "No JSON-LD schema found" };
    },
  },
  {
    ruleId: "cwv-lcp",
    severity: "warning",
    run: (s) => {
      const lcp = s.webVitals?.lcp;
      if (lcp === undefined) {
        return { passed: true, message: "LCP not measured" };
      }
      return {
        passed: lcp <= 2500,
        message: `LCP ${lcp}ms ${lcp <= 2500 ? "passes" : "exceeds"} 2.5s threshold`,
      };
    },
  },
  {
    ruleId: "cwv-cls",
    severity: "warning",
    run: (s) => {
      const cls = s.webVitals?.cls;
      if (cls === undefined) {
        return { passed: true, message: "CLS not measured" };
      }
      return {
        passed: cls <= 0.1,
        message: `CLS ${cls} ${cls <= 0.1 ? "passes" : "exceeds"} 0.1 threshold`,
      };
    },
  },
  {
    ruleId: "cwv-inp",
    severity: "warning",
    run: (s) => {
      const inp = s.webVitals?.inp;
      if (inp === undefined) {
        return { passed: true, message: "INP not measured" };
      }
      return {
        passed: inp <= 200,
        message: `INP ${inp}ms ${inp <= 200 ? "passes" : "exceeds"} 200ms threshold`,
      };
    },
  },
  {
    ruleId: "https",
    severity: "error",
    run: (s) => {
      const isHttps = s.url.startsWith("https://");
      return {
        passed: isHttps,
        message: isHttps ? "Served over HTTPS" : "Page is not served over HTTPS",
      };
    },
  },
  {
    ruleId: "robots-indexable",
    severity: "error",
    run: (s) => {
      const blocked = s.robotsNoindex === true;
      return {
        passed: !blocked,
        message: blocked
          ? "Page is blocked from indexing by a robots noindex directive"
          : "Page is indexable",
      };
    },
  },
  {
    ruleId: "viewport-meta",
    severity: "warning",
    run: (s) => {
      if (s.hasViewportMeta === undefined) {
        return { passed: true, message: "Viewport meta not measured" };
      }
      return {
        passed: s.hasViewportMeta,
        message: s.hasViewportMeta
          ? "Mobile viewport meta tag present"
          : "Missing mobile viewport meta tag",
      };
    },
  },
  {
    ruleId: "lang-attribute",
    severity: "warning",
    run: (s) => {
      if (s.lang === undefined) {
        return { passed: true, message: "Language attribute not measured" };
      }
      const hasLang = Boolean(s.lang);
      return {
        passed: hasLang,
        message: hasLang
          ? `Document language declared (${s.lang})`
          : "Missing <html lang> attribute",
      };
    },
  },
  {
    ruleId: "heading-structure",
    severity: "info",
    run: (s) => {
      if (s.h2Count === undefined) {
        return { passed: true, message: "Heading structure not measured" };
      }
      return {
        passed: s.h2Count >= 1,
        message:
          s.h2Count >= 1
            ? `Found ${s.h2Count} H2 subheadings`
            : "No H2 subheadings — content lacks a scannable structure",
      };
    },
  },
  {
    ruleId: "image-alt",
    severity: "warning",
    run: (s) => {
      if (s.imageCount === undefined || s.imagesWithAlt === undefined) {
        return { passed: true, message: "Image alt coverage not measured" };
      }
      if (s.imageCount === 0) {
        return { passed: true, message: "No images to check for alt text" };
      }
      const missing = s.imageCount - s.imagesWithAlt;
      return {
        passed: missing <= 0,
        message:
          missing <= 0
            ? `All ${s.imageCount} images have alt text`
            : `${missing} of ${s.imageCount} images are missing alt text`,
      };
    },
  },
  {
    ruleId: "content-depth",
    severity: "warning",
    run: (s) => {
      if (s.wordCount === undefined) {
        return { passed: true, message: "Content length not measured" };
      }
      return {
        passed: s.wordCount >= 250,
        message:
          s.wordCount >= 250
            ? `Content depth ${s.wordCount} words`
            : `Thin content: ${s.wordCount} words (aim for 250+)`,
      };
    },
  },
];

export function runAuditChecks(signals: PageSignals): AuditEngineResult {
  const checks: AuditCheckResult[] = RULES.map((rule) => {
    const result = rule.run(signals);
    return {
      ruleId: rule.ruleId,
      passed: result.passed,
      message: result.message,
      severity: rule.severity,
    };
  });

  const total = checks.length;
  const passed = checks.filter((c) => c.passed).length;
  const score = total === 0 ? 0 : Math.round((passed / total) * 100);

  return { checks, score };
}
