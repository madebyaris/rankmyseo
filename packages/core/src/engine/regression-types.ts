import type { PageSignals } from "../schemas/index.js";
import { AUDIT_ENGINE_VERSION, type AuditEngineResult } from "./audit.js";

export const SEO_PAGE_SNAPSHOT_VERSION = 1 as const;
export const SEO_REGRESSION_RESULT_VERSION = 1 as const;

export type SeoRegressionSeverity = "error" | "warning" | "info";

export interface SeoPageSnapshot {
  version: typeof SEO_PAGE_SNAPSHOT_VERSION;
  route: string;
  requestedUrl: string;
  finalUrl: string;
  statusCode: number;
  redirectChain: string[];
  signals: PageSignals;
  audit: Pick<AuditEngineResult, "score" | "checks" | "engineVersion">;
  capturedAt: string;
  originLabel: "production" | "preview" | "baseline" | "candidate";
}

export interface SeoRegressionFinding {
  id: string;
  ruleId:
    | "http-status"
    | "redirect-final-url"
    | "indexability"
    | "canonical"
    | "title"
    | "json-ld";
  severity: SeoRegressionSeverity;
  route: string;
  message: string;
  remediation: string;
  baseline: unknown;
  current: unknown;
}

export interface SeoRegressionResult {
  version: typeof SEO_REGRESSION_RESULT_VERSION;
  ok: boolean;
  productionOrigin: string;
  candidateOrigin: string;
  baseRef?: string;
  headRef?: string;
  routesScanned: string[];
  routesSkipped: string[];
  findings: SeoRegressionFinding[];
  scanErrors: Array<{ route: string; origin: string; message: string }>;
  engineVersion: typeof AUDIT_ENGINE_VERSION;
}

export const DEFAULT_REGRESSION_RULE_IDS = [
  "http-status",
  "redirect-final-url",
  "indexability",
  "canonical",
  "title",
  "json-ld",
] as const;

export type DefaultRegressionRuleId =
  (typeof DEFAULT_REGRESSION_RULE_IDS)[number];
