import { z } from "zod";

// Local copies of the shapes we need to avoid circular imports with schemas/index.
const pageSignalsSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  metaDescription: z.string().optional(),
  canonical: z.union([z.string().url(), z.null()]).optional(),
  h1Count: z.number().int().nonnegative().default(0),
  h2Count: z.number().int().nonnegative().optional(),
  hasOgTags: z.boolean().default(false),
  hasJsonLd: z.boolean().default(false),
  jsonLdTypes: z.array(z.string()).optional(),
  jsonLdValid: z.boolean().optional(),
  lang: z.union([z.string(), z.null()]).optional(),
  hasViewportMeta: z.boolean().optional(),
  robotsNoindex: z.boolean().optional(),
  xRobotsNoindex: z.boolean().optional(),
  imageCount: z.number().int().nonnegative().optional(),
  imagesWithAlt: z.number().int().nonnegative().optional(),
  wordCount: z.number().int().nonnegative().optional(),
  webVitals: z
    .object({
      lcp: z.number().optional(),
      fid: z.number().optional(),
      cls: z.number().optional(),
      inp: z.number().optional(),
      source: z.enum(["lab", "field", "collector"]).optional(),
    })
    .optional(),
});

const auditCheckResultSchema = z.object({
  ruleId: z.string().min(1),
  passed: z.boolean(),
  status: z.enum(["pass", "fail", "unknown", "not_applicable"]).optional(),
  message: z.string(),
  severity: z.enum(["info", "warning", "error"]),
});

export const seoPageSnapshotSchema = z.object({
  version: z.literal(1),
  route: z.string().min(1),
  requestedUrl: z.string().url(),
  finalUrl: z.string().url(),
  statusCode: z.number().int(),
  redirectChain: z.array(z.string()).default([]),
  signals: pageSignalsSchema,
  audit: z.object({
    score: z.number().min(0).max(100),
    checks: z.array(auditCheckResultSchema),
    engineVersion: z.string(),
  }),
  capturedAt: z.string(),
  originLabel: z.enum(["production", "preview", "baseline", "candidate"]),
});

export type SeoPageSnapshotInput = z.infer<typeof seoPageSnapshotSchema>;

export const seoRegressionFindingSchema = z.object({
  id: z.string().min(1),
  ruleId: z.enum([
    "http-status",
    "redirect-final-url",
    "indexability",
    "canonical",
    "title",
    "json-ld",
  ]),
  severity: z.enum(["error", "warning", "info"]),
  route: z.string().min(1),
  message: z.string().min(1),
  remediation: z.string().min(1),
  baseline: z.unknown(),
  current: z.unknown(),
});

export const seoRegressionResultSchema = z.object({
  version: z.literal(1),
  ok: z.boolean(),
  productionOrigin: z.string().min(1),
  candidateOrigin: z.string().min(1),
  baseRef: z.string().optional(),
  headRef: z.string().optional(),
  routesScanned: z.array(z.string()),
  routesSkipped: z.array(z.string()).default([]),
  findings: z.array(seoRegressionFindingSchema),
  scanErrors: z
    .array(
      z.object({
        route: z.string(),
        origin: z.string(),
        message: z.string(),
      }),
    )
    .default([]),
  engineVersion: z.string(),
});
