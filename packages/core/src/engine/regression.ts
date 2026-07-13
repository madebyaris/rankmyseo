import { AUDIT_ENGINE_VERSION } from "./audit.js";
import type {
  DefaultRegressionRuleId,
  SeoPageSnapshot,
  SeoRegressionFinding,
  SeoRegressionResult,
} from "./regression-types.js";
import {
  DEFAULT_REGRESSION_RULE_IDS,
  SEO_REGRESSION_RESULT_VERSION,
} from "./regression-types.js";

export type {
  DefaultRegressionRuleId,
  SeoPageSnapshot,
  SeoRegressionFinding,
  SeoRegressionResult,
} from "./regression-types.js";
export {
  DEFAULT_REGRESSION_RULE_IDS,
  SEO_PAGE_SNAPSHOT_VERSION,
  SEO_REGRESSION_RESULT_VERSION,
} from "./regression-types.js";

function isBlocked(snapshot: SeoPageSnapshot): boolean {
  return (
    snapshot.signals.robotsNoindex === true ||
    snapshot.signals.xRobotsNoindex === true
  );
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.href.replace(/\/$/, "") || parsed.origin;
  } catch {
    return url;
  }
}

function sameRoutePath(a: string, b: string): boolean {
  try {
    return new URL(a).pathname === new URL(b).pathname;
  } catch {
    return normalizeUrl(a) === normalizeUrl(b);
  }
}

/**
 * Compare production (baseline) vs preview (current) page snapshots.
 * Only transitions from healthy → unhealthy fail the gate.
 * Improvements and pre-existing failures do not produce findings.
 */
export function comparePageSnapshots(input: {
  baseline: SeoPageSnapshot;
  current: SeoPageSnapshot;
  ruleIds?: readonly DefaultRegressionRuleId[];
}): SeoRegressionFinding[] {
  const ruleIds = new Set(input.ruleIds ?? DEFAULT_REGRESSION_RULE_IDS);
  const { baseline, current } = input;
  const route = current.route || baseline.route;
  const findings: SeoRegressionFinding[] = [];

  if (ruleIds.has("http-status")) {
    const baseOk = baseline.statusCode >= 200 && baseline.statusCode < 400;
    const currOk = current.statusCode >= 200 && current.statusCode < 400;
    if (baseOk && !currOk) {
      findings.push({
        id: `http-status:${route}`,
        ruleId: "http-status",
        severity: "error",
        route,
        message: `HTTP status degraded from ${baseline.statusCode} to ${current.statusCode}`,
        remediation:
          "Restore a successful HTTP response for this route on the preview deployment.",
        baseline: baseline.statusCode,
        current: current.statusCode,
      });
    }
  }

  if (ruleIds.has("redirect-final-url")) {
    const baseFinal = normalizeUrl(baseline.finalUrl);
    const currFinal = normalizeUrl(current.finalUrl);
    const baseMatched = sameRoutePath(baseline.requestedUrl, baseline.finalUrl);
    const currMatched = sameRoutePath(current.requestedUrl, current.finalUrl);
    if (baseMatched && !currMatched) {
      findings.push({
        id: `redirect-final-url:${route}`,
        ruleId: "redirect-final-url",
        severity: "error",
        route,
        message: `Unexpected redirect: final URL changed to ${current.finalUrl}`,
        remediation:
          "Fix redirects so the route resolves to the intended canonical path.",
        baseline: baseFinal,
        current: currFinal,
      });
    }
  }

  if (ruleIds.has("indexability")) {
    const baseBlocked = isBlocked(baseline);
    const currBlocked = isBlocked(current);
    if (!baseBlocked && currBlocked) {
      findings.push({
        id: `indexability:${route}`,
        ruleId: "indexability",
        severity: "error",
        route,
        message: "Page newly blocked from indexing (robots noindex)",
        remediation:
          "Remove the noindex meta/X-Robots-Tag unless this page is intentionally excluded.",
        baseline: {
          robotsNoindex: baseline.signals.robotsNoindex ?? false,
          xRobotsNoindex: baseline.signals.xRobotsNoindex ?? false,
        },
        current: {
          robotsNoindex: current.signals.robotsNoindex ?? false,
          xRobotsNoindex: current.signals.xRobotsNoindex ?? false,
        },
      });
    }
  }

  if (ruleIds.has("canonical")) {
    const baseCanonical = baseline.signals.canonical ?? null;
    const currCanonical = current.signals.canonical ?? null;
    if (baseCanonical && !currCanonical) {
      findings.push({
        id: `canonical-removed:${route}`,
        ruleId: "canonical",
        severity: "error",
        route,
        message: "Canonical URL was removed",
        remediation: "Restore <link rel=\"canonical\"> pointing to the preferred URL.",
        baseline: baseCanonical,
        current: currCanonical,
      });
    } else if (
      baseCanonical &&
      currCanonical &&
      normalizeUrl(baseCanonical) !== normalizeUrl(currCanonical)
    ) {
      findings.push({
        id: `canonical-changed:${route}`,
        ruleId: "canonical",
        severity: "warning",
        route,
        message: "Canonical URL changed",
        remediation:
          "Confirm the new canonical is intentional; unintended changes dilute ranking signals.",
        baseline: baseCanonical,
        current: currCanonical,
      });
    }
  }

  if (ruleIds.has("title")) {
    const baseTitle = baseline.signals.title?.trim() ?? "";
    const currTitle = current.signals.title?.trim() ?? "";
    if (baseTitle && !currTitle) {
      findings.push({
        id: `title:${route}`,
        ruleId: "title",
        severity: "error",
        route,
        message: "Document title was removed",
        remediation: "Restore a unique <title> that describes the page.",
        baseline: baseTitle,
        current: currTitle || null,
      });
    }
  }

  if (ruleIds.has("json-ld")) {
    const baseTypes = new Set(baseline.signals.jsonLdTypes ?? []);
    const currTypes = new Set(current.signals.jsonLdTypes ?? []);
    const removed = [...baseTypes].filter((t) => !currTypes.has(t));
    const baseValid = baseline.signals.jsonLdValid !== false;
    const currValid = current.signals.jsonLdValid !== false;

    if (baseValid && !currValid) {
      findings.push({
        id: `json-ld-invalid:${route}`,
        ruleId: "json-ld",
        severity: "error",
        route,
        message: "JSON-LD became invalid",
        remediation: "Fix malformed JSON-LD so structured data can be parsed.",
        baseline: { jsonLdValid: true, types: [...baseTypes] },
        current: {
          jsonLdValid: false,
          types: [...currTypes],
        },
      });
    } else if (removed.length > 0) {
      findings.push({
        id: `json-ld-removed:${route}`,
        ruleId: "json-ld",
        severity: "warning",
        route,
        message: `JSON-LD types removed: ${removed.join(", ")}`,
        remediation:
          "Restore removed Schema.org types if the page still represents that content.",
        baseline: [...baseTypes],
        current: [...currTypes],
      });
    }
  }

  return findings;
}

export function summarizeRegression(input: {
  findings: SeoRegressionFinding[];
  productionOrigin: string;
  candidateOrigin: string;
  routesScanned: string[];
  routesSkipped?: string[];
  scanErrors?: SeoRegressionResult["scanErrors"];
  baseRef?: string;
  headRef?: string;
  failOn?: "error" | "warning";
}): SeoRegressionResult {
  const failOn = input.failOn ?? "error";
  const gated = input.findings.filter((f) =>
    failOn === "error" ? f.severity === "error" : true,
  );

  return {
    version: SEO_REGRESSION_RESULT_VERSION,
    ok: gated.length === 0 && (input.scanErrors?.length ?? 0) === 0,
    productionOrigin: input.productionOrigin,
    candidateOrigin: input.candidateOrigin,
    baseRef: input.baseRef,
    headRef: input.headRef,
    routesScanned: input.routesScanned,
    routesSkipped: input.routesSkipped ?? [],
    findings: input.findings,
    scanErrors: input.scanErrors ?? [],
    engineVersion: AUDIT_ENGINE_VERSION,
  };
}
