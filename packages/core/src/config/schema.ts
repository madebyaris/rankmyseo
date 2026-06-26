import { z } from "zod";
import { dashboardWidgetSchema } from "../schemas/index.js";

export const dataSourceProviderSchema = z.enum(["fixture", "gsc"]);

export type DataSourceProvider = z.infer<typeof dataSourceProviderSchema>;

export const dataSourceConfigSchema = z.object({
  provider: dataSourceProviderSchema,
  apiKey: z.string().optional(),
  default: z.boolean().optional(),
});

export type DataSourceConfig = z.infer<typeof dataSourceConfigSchema>;

export const siteFeaturesConfigSchema = z.object({
  sitemap: z.boolean().default(true),
  llmsTxt: z.boolean().default(true),
  collector: z.boolean().default(true),
  markdownNegotiation: z.boolean().default(true),
  /** Opt-in blog module (API + dashboard widget). Off by default. */
  blog: z.boolean().default(false),
});

export type SiteFeaturesConfig = z.infer<typeof siteFeaturesConfigSchema>;

export const scheduleConfigSchema = z.object({
  cron: z.string().default("0 6 * * *"),
  enabled: z.boolean().default(false),
});

export type ScheduleConfig = z.infer<typeof scheduleConfigSchema>;

export const rankMySeoConfigSchema = z.object({
  databaseUrl: z.string().min(1),
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  dataSources: z
    .array(dataSourceConfigSchema)
    .default([{ provider: "fixture", default: true }]),
  schedule: scheduleConfigSchema.default({
    cron: "0 6 * * *",
    enabled: false,
  }),
  siteFeatures: siteFeaturesConfigSchema.default({
    sitemap: true,
    llmsTxt: true,
    collector: true,
    markdownNegotiation: true,
    blog: false,
  }),
  dashboard: z
    .object({
      widgets: z.array(dashboardWidgetSchema).optional(),
    })
    .optional(),
  sitemapRoutes: z.array(z.string()).default(["/"]),
  llmsTxt: z
    .object({
      projectName: z.string().optional(),
      summary: z.string().optional(),
      links: z
        .array(
          z.object({
            title: z.string(),
            url: z.string(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export type RankMySeoConfig = z.infer<typeof rankMySeoConfigSchema>;

export function parseRankMySeoConfig(input: unknown): RankMySeoConfig {
  return rankMySeoConfigSchema.parse(input);
}
