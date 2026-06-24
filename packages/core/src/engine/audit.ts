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
    run: (s) => ({
      passed: s.hasJsonLd,
      message: s.hasJsonLd ? "JSON-LD schema present" : "No JSON-LD schema found",
    }),
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
