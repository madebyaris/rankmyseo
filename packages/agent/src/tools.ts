import "server-only";

import { randomUUID } from "node:crypto";
import { tool } from "ai";
import { z } from "zod";
import {
  buildReport,
  dashboardConfigSchema,
  dashboardWidgetSchema,
  DASHBOARD_WIDGET_TYPES,
  generateSchema,
  runAuditChecks,
  schemaGeneratorInputSchema,
  type RankStore,
  type TenantScope,
} from "@rankmyseo/core";

export interface AgentToolsContext {
  store: RankStore;
  scope: TenantScope;
}

const widgetExample = JSON.stringify(
  {
    widgets: [
      {
        id: "w1",
        type: "KeywordTable",
        title: "Keywords",
        query: {},
        options: {},
      },
    ],
  },
  null,
  2,
);

export const addKeywordInputSchema = z.object({
  text: z.string().min(1),
  country: z.string().default("us"),
  device: z.enum(["desktop", "mobile"]).default("desktop"),
});

export const queryRankHistoryInputSchema = z.object({
  keywordId: z.string().optional(),
  from: z.string().describe("ISO-8601 date/time"),
  to: z.string().describe("ISO-8601 date/time"),
});

export const runAuditInputSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  metaDescription: z.string().optional(),
  h1Count: z.number().int().nonnegative().default(1),
  hasOgTags: z.boolean().default(false),
  hasJsonLd: z.boolean().default(false),
});

export const updateDashboardConfigInputSchema = z.object({
  widgets: z.array(
    dashboardWidgetSchema.omit({ layout: true }).extend({
      layout: dashboardWidgetSchema.shape.layout.optional(),
    }),
  ),
});

export const buildReportInputSchema = z.object({
  title: z.string(),
  from: z.string().describe("ISO-8601 date/time"),
  to: z.string().describe("ISO-8601 date/time"),
});

export const explainMetricInputSchema = z.object({
  metric: z.string(),
});

export const getAuditInputSchema = z.object({
  auditId: z.string(),
});

export function createAgentTools(ctx: AgentToolsContext) {
  const { store, scope } = ctx;

  return {
    queryRankHistory: tool({
      description:
        "Read rank snapshots for keywords over a date range. Dates must be ISO-8601 strings.",
      inputSchema: queryRankHistoryInputSchema,
      execute: async ({ keywordId, from, to }) => {
        const snapshots = await store.snapshots.listByRange({
          tenantId: scope.tenantId,
          projectId: scope.projectId,
          keywordId,
          from: new Date(from),
          to: new Date(to),
        });
        return { count: snapshots.length, snapshots };
      },
    }),

    listKeywords: tool({
      description: "List tracked keywords for the current project",
      inputSchema: z.object({}),
      execute: async () => {
        const keywords = await store.keywords.list(scope);
        return { keywords };
      },
    }),

    addKeyword: tool({
      description: "Add a keyword to track (requires user approval)",
      inputSchema: addKeywordInputSchema,
      needsApproval: true,
      execute: async ({ text, country, device }) => {
        const keyword = await store.keywords.create({
          tenantId: scope.tenantId,
          projectId: scope.projectId,
          text,
          country,
          device,
          tags: [],
        });
        return { keyword };
      },
    }),

    runAudit: tool({
      description:
        "Run an SEO audit on provided page signals (does not fetch the URL — use POST /scan for live fetches)",
      inputSchema: runAuditInputSchema,
      needsApproval: true,
      execute: async (input) => {
        const { checks, score } = runAuditChecks(input);
        const audit = await store.audits.create({
          id: randomUUID(),
          tenantId: scope.tenantId,
          projectId: scope.projectId,
          url: input.url,
          score,
          checks,
        });
        return { audit };
      },
    }),

    getAudit: tool({
      description: "Get an audit by id",
      inputSchema: getAuditInputSchema,
      execute: async ({ auditId }) => {
        const audit = await store.audits.getById(scope, auditId);
        return { audit: audit ?? null };
      },
    }),

    getDashboardConfig: tool({
      description: "Read the current dashboard widget layout",
      inputSchema: z.object({}),
      execute: async () => {
        const config = await store.dashboard.get(scope);
        return { config: config ?? null };
      },
    }),

    updateDashboardConfig: tool({
      description: `Update dashboard widgets (requires user approval). Widget types: ${DASHBOARD_WIDGET_TYPES.join(", ")}. Example:\n${widgetExample}`,
      inputSchema: updateDashboardConfigInputSchema,
      needsApproval: true,
      execute: async ({ widgets }) => {
        const existing = await store.dashboard.get(scope);
        const config = dashboardConfigSchema.parse({
          id: existing?.id ?? randomUUID(),
          tenantId: scope.tenantId,
          projectId: scope.projectId,
          widgets,
          updatedAt: new Date(),
        });
        const saved = await store.dashboard.upsert(config);
        return { config: saved };
      },
    }),

    explainMetric: tool({
      description:
        "Return a template summary of project tracking stats for a metric name (not LLM-grounded)",
      inputSchema: explainMetricInputSchema,
      execute: async ({ metric }) => {
        const keywords = await store.keywords.list(scope);
        const snapshots = await store.snapshots.listByRange({
          tenantId: scope.tenantId,
          projectId: scope.projectId,
          from: new Date(Date.now() - 30 * 86400000),
          to: new Date(),
        });
        return {
          metric,
          keywordCount: keywords.length,
          snapshotCount: snapshots.length,
          explanation: `Template summary: tracking ${keywords.length} keywords with ${snapshots.length} rank snapshots in the last 30 days for metric "${metric}".`,
        };
      },
    }),

    buildReport: tool({
      description:
        "Generate a rank and audit report for a date window (requires user approval). Dates must be ISO-8601 strings.",
      inputSchema: buildReportInputSchema,
      needsApproval: true,
      execute: async ({ title, from, to }) => {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        const keywords = await store.keywords.list(scope);
        const snapshots = await store.snapshots.listByRange({
          tenantId: scope.tenantId,
          projectId: scope.projectId,
          from: fromDate,
          to: toDate,
        });
        const audits = await store.audits.list(scope);
        const reportData = buildReport({
          tenantId: scope.tenantId,
          projectId: scope.projectId,
          title,
          from: fromDate,
          to: toDate,
          keywords,
          snapshots,
          audits,
        });
        const report = await store.reports.create(reportData);
        return { report };
      },
    }),

    generateSchema: tool({
      description:
        "Generate Schema.org JSON-LD (Article, Product, FAQPage, BreadcrumbList, Organization)",
      inputSchema: schemaGeneratorInputSchema,
      execute: async (input) => generateSchema(input),
    }),
  };
}

export type AgentTools = ReturnType<typeof createAgentTools>;
