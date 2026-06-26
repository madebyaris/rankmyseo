import { z } from "zod";

export const tenantScopeSchema = z.object({
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
});

export type TenantScope = z.infer<typeof tenantScopeSchema>;

export const projectSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  domain: z.string().min(1),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Project = z.infer<typeof projectSchema>;

export const keywordSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  text: z.string().min(1),
  country: z.string().default("us"),
  device: z.enum(["desktop", "mobile"]).default("desktop"),
  tags: z.array(z.string()).default([]),
  createdAt: z.coerce.date(),
});

export type Keyword = z.infer<typeof keywordSchema>;

export const createKeywordInputSchema = keywordSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateKeywordInput = z.infer<typeof createKeywordInputSchema>;

export const rankSnapshotSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  keywordId: z.string().min(1),
  position: z.number().int().positive().nullable(),
  url: z.union([z.string().url(), z.null()]),
  source: z.string().min(1),
  device: z.enum(["desktop", "mobile"]).default("desktop"),
  country: z.string().default("us"),
  capturedAt: z.coerce.date(),
  serpFeatures: z.record(z.string(), z.unknown()).optional(),
});

export type RankSnapshot = z.infer<typeof rankSnapshotSchema>;

export const createRankSnapshotInputSchema = rankSnapshotSchema.omit({
  id: true,
});

export type CreateRankSnapshotInput = z.infer<
  typeof createRankSnapshotInputSchema
>;

export const auditCheckResultSchema = z.object({
  ruleId: z.string().min(1),
  passed: z.boolean(),
  message: z.string(),
  severity: z.enum(["info", "warning", "error"]),
});

export type AuditCheckResult = z.infer<typeof auditCheckResultSchema>;

export const auditCheckSchema = auditCheckResultSchema.extend({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  auditId: z.string().min(1),
});

export type AuditCheck = z.infer<typeof auditCheckSchema>;

export const pageSignalsSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  metaDescription: z.string().optional(),
  canonical: z.union([z.string().url(), z.null()]).optional(),
  h1Count: z.number().int().nonnegative().default(0),
  h2Count: z.number().int().nonnegative().optional(),
  hasOgTags: z.boolean().default(false),
  hasJsonLd: z.boolean().default(false),
  lang: z.union([z.string(), z.null()]).optional(),
  hasViewportMeta: z.boolean().optional(),
  robotsNoindex: z.boolean().optional(),
  imageCount: z.number().int().nonnegative().optional(),
  imagesWithAlt: z.number().int().nonnegative().optional(),
  wordCount: z.number().int().nonnegative().optional(),
  webVitals: z
    .object({
      lcp: z.number().optional(),
      fid: z.number().optional(),
      cls: z.number().optional(),
      inp: z.number().optional(),
    })
    .optional(),
});

export type PageSignals = z.infer<typeof pageSignalsSchema>;

export const auditSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  url: z.string().url(),
  score: z.number().min(0).max(100),
  checks: z.array(auditCheckResultSchema).default([]),
  createdAt: z.coerce.date(),
});

export type Audit = z.infer<typeof auditSchema>;

export const createAuditInputSchema = auditSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateAuditInput = z.infer<typeof createAuditInputSchema>;

export const reportMoverSchema = z.object({
  keywordId: z.string().min(1),
  keywordText: z.string().min(1),
  previousPosition: z.number().int().positive().nullable(),
  currentPosition: z.number().int().positive().nullable(),
  delta: z.number(),
});

export type ReportMover = z.infer<typeof reportMoverSchema>;

export const reportSummarySchema = z.object({
  topMovers: z.array(reportMoverSchema).default([]),
  avgPositionDelta: z.number().optional(),
  auditScoreTrend: z
    .array(
      z.object({
        date: z.coerce.date(),
        score: z.number(),
      }),
    )
    .default([]),
});

export type ReportSummary = z.infer<typeof reportSummarySchema>;

export const reportSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  from: z.coerce.date(),
  to: z.coerce.date(),
  summary: reportSummarySchema.optional(),
  createdAt: z.coerce.date(),
});

export type Report = z.infer<typeof reportSchema>;

export const createReportInputSchema = reportSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateReportInput = z.infer<typeof createReportInputSchema>;

export const dashboardWidgetSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  query: z.record(z.string(), z.unknown()).default({}),
  options: z.record(z.string(), z.unknown()).default({}),
  layout: z
    .object({
      x: z.number().int().nonnegative(),
      y: z.number().int().nonnegative(),
      w: z.number().int().positive(),
      h: z.number().int().positive(),
    })
    .optional(),
});

export type DashboardWidget = z.infer<typeof dashboardWidgetSchema>;

export const dashboardConfigSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  widgets: z.array(dashboardWidgetSchema),
  updatedAt: z.coerce.date(),
});

export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;

export const snapshotRangeQuerySchema = z.object({
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  keywordId: z.string().min(1).optional(),
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export type SnapshotRangeQuery = z.infer<typeof snapshotRangeQuerySchema>;

export const keywordIntentSchema = z.enum([
  "informational",
  "navigational",
  "commercial",
  "transactional",
]);

export type KeywordIntent = z.infer<typeof keywordIntentSchema>;

export const blogWidgetOptionsSchema = z.object({
  allowCreate: z.boolean().default(true),
  allowDelete: z.boolean().default(true),
  allowPublish: z.boolean().default(true),
  showRecommendations: z.boolean().default(true),
  showIntent: z.boolean().default(true),
  showMetaPreview: z.boolean().default(true),
  intents: z.array(keywordIntentSchema).optional(),
  labels: z
    .object({
      createTitle: z.string().optional(),
      createDescription: z.string().optional(),
      listTitle: z.string().optional(),
      addButton: z.string().optional(),
      recommendations: z.string().optional(),
      publish: z.string().optional(),
      unpublish: z.string().optional(),
      delete: z.string().optional(),
      empty: z.string().optional(),
    })
    .optional(),
});

export type BlogWidgetOptions = z.infer<typeof blogWidgetOptionsSchema>;

export const BLOG_WIDGET_TYPE = "BlogManager" as const;

export function parseBlogWidgetOptions(
  raw: Record<string, unknown> | undefined,
): BlogWidgetOptions {
  return blogWidgetOptionsSchema.parse(raw ?? {});
}

export function dashboardHasBlogWidget(
  widgets: DashboardWidget[] | undefined,
): boolean {
  return widgets?.some((w) => w.type === BLOG_WIDGET_TYPE) ?? false;
}

export const blogPostStatusSchema = z.enum(["draft", "published"]);

export type BlogPostStatus = z.infer<typeof blogPostStatusSchema>;

export const blogPostSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().default(""),
  targetKeyword: z.string().default(""),
  intent: keywordIntentSchema.default("informational"),
  metaTitle: z.string().default(""),
  metaDescription: z.string().default(""),
  status: blogPostStatusSchema.default("draft"),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type BlogPost = z.infer<typeof blogPostSchema>;

export const createBlogPostInputSchema = z.object({
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().optional(),
  content: z.string().default(""),
  targetKeyword: z.string().default(""),
  intent: keywordIntentSchema.default("informational"),
  metaTitle: z.string().default(""),
  metaDescription: z.string().default(""),
  status: blogPostStatusSchema.default("draft"),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostInputSchema>;

export const updateBlogPostInputSchema = createBlogPostInputSchema
  .omit({ tenantId: true, projectId: true })
  .partial();

export type UpdateBlogPostInput = z.infer<typeof updateBlogPostInputSchema>;

export const recommendationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  detail: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  category: z.string().min(1),
});

export type Recommendation = z.infer<typeof recommendationSchema>;

export const generatedMetaSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  slug: z.string(),
  canonical: z.string().nullable(),
  openGraph: z.object({
    title: z.string(),
    description: z.string(),
    type: z.string(),
  }),
  jsonLd: z.record(z.string(), z.unknown()),
  html: z.string(),
});

export type GeneratedMeta = z.infer<typeof generatedMetaSchema>;

export { normalizeHttpUrl } from "../utils/url.js";
