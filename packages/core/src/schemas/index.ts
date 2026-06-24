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

export const auditCheckSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  auditId: z.string().min(1),
  ruleId: z.string().min(1),
  passed: z.boolean(),
  message: z.string(),
  severity: z.enum(["info", "warning", "error"]),
});

export type AuditCheck = z.infer<typeof auditCheckSchema>;

export const auditSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  url: z.string().url(),
  score: z.number().min(0).max(100),
  createdAt: z.coerce.date(),
});

export type Audit = z.infer<typeof auditSchema>;

export const reportSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  from: z.coerce.date(),
  to: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export type Report = z.infer<typeof reportSchema>;

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
