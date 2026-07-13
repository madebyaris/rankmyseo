import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import {
  buildReport,
  dashboardConfigSchema,
  generateSchema,
  runAuditChecks,
  schemaGeneratorInputSchema,
  type RankStore,
  type TenantScope,
} from "@rankmyseo/core";
import { z } from "zod";
import {
  addKeywordInputSchema,
  buildReportInputSchema,
  explainMetricInputSchema,
  getAuditInputSchema,
  queryRankHistoryInputSchema,
  runAuditInputSchema,
  updateDashboardConfigInputSchema,
} from "./tools.js";

export interface McpServerOptions {
  store: RankStore;
  scope: TenantScope;
  /**
   * When false (default), only read-only tools are registered.
   * Set true or RANKMYSEO_MCP_ALLOW_MUTATIONS=1 to enable mutating tools.
   */
  allowMutations?: boolean;
}

const READ_ONLY: ToolAnnotations = { readOnlyHint: true };
const MUTATING: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
};
const IDEMPOTENT_WRITE: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
};

function readPackageVersion(): string {
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    const pkgPath = join(dir, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function jsonResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
  };
}

function zodShape<T extends z.ZodRawShape>(schema: z.ZodObject<T>): T {
  return schema.shape;
}

export function createRankMySeoMcpServer(options: McpServerOptions): McpServer {
  const { store, scope } = options;
  const allowMutations =
    options.allowMutations === true ||
    process.env.RANKMYSEO_MCP_ALLOW_MUTATIONS === "1";
  const server = new McpServer({
    name: "rankmyseo",
    version: readPackageVersion(),
  });

  server.registerTool(
    "list_keywords",
    {
      description: "List tracked keywords for the current project",
      annotations: READ_ONLY,
    },
    async () => jsonResult({ keywords: await store.keywords.list(scope) }),
  );

  server.registerTool(
    "query_rank_history",
    {
      description: "Query rank snapshots for keywords over an ISO-8601 date range",
      inputSchema: zodShape(queryRankHistoryInputSchema),
      annotations: READ_ONLY,
    },
    async ({ keywordId, from, to }) => {
      const snapshots = await store.snapshots.listByRange({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        keywordId,
        from: new Date(from),
        to: new Date(to),
      });
      return jsonResult({ count: snapshots.length, snapshots });
    },
  );

  if (allowMutations) {
    server.registerTool(
      "add_keyword",
      {
        description: "Add a keyword to track (mutations enabled)",
        inputSchema: zodShape(addKeywordInputSchema),
        annotations: MUTATING,
      },
      async ({ text, country, device }) => {
        const keyword = await store.keywords.create({
          tenantId: scope.tenantId,
          projectId: scope.projectId,
          text,
          country: country ?? "us",
          device: device ?? "desktop",
          tags: [],
        });
        return jsonResult({ keyword });
      },
    );

    server.registerTool(
      "run_audit",
      {
        description:
          "Run an SEO audit on provided page signals (does not fetch the URL live)",
        inputSchema: zodShape(runAuditInputSchema),
        annotations: MUTATING,
      },
      async (input) => {
        const { checks, score } = runAuditChecks(input);
        const audit = await store.audits.create({
          id: randomUUID(),
          tenantId: scope.tenantId,
          projectId: scope.projectId,
          url: input.url,
          score,
          checks,
        });
        return jsonResult({ audit });
      },
    );
  }

  server.registerTool(
    "get_audit",
    {
      description: "Get an audit by id",
      inputSchema: zodShape(getAuditInputSchema),
      annotations: READ_ONLY,
    },
    async ({ auditId }) => jsonResult({ audit: (await store.audits.getById(scope, auditId)) ?? null }),
  );

  server.registerTool(
    "get_dashboard_config",
    {
      description: "Read the current dashboard widget layout",
      annotations: READ_ONLY,
    },
    async () => jsonResult({ config: (await store.dashboard.get(scope)) ?? null }),
  );

  if (allowMutations) {
    server.registerTool(
      "update_dashboard_config",
      {
        description: "Update dashboard widgets (mutations enabled)",
        inputSchema: zodShape(updateDashboardConfigInputSchema),
        annotations: IDEMPOTENT_WRITE,
      },
      async ({ widgets }) => {
        const existing = await store.dashboard.get(scope);
        const config = dashboardConfigSchema.parse({
          id: existing?.id ?? randomUUID(),
          tenantId: scope.tenantId,
          projectId: scope.projectId,
          widgets,
          updatedAt: new Date(),
        });
        const saved = await store.dashboard.upsert(config);
        return jsonResult({ config: saved });
      },
    );
  }

  server.registerTool(
    "explain_metric",
    {
      description: "Return a template summary of project tracking stats for a metric name",
      inputSchema: zodShape(explainMetricInputSchema),
      annotations: READ_ONLY,
    },
    async ({ metric }) => {
      const keywords = await store.keywords.list(scope);
      const snapshots = await store.snapshots.listByRange({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        from: new Date(Date.now() - 30 * 86400000),
        to: new Date(),
      });
      return jsonResult({
        metric,
        keywordCount: keywords.length,
        snapshotCount: snapshots.length,
        explanation: `Template summary: tracking ${keywords.length} keywords with ${snapshots.length} rank snapshots in the last 30 days for metric "${metric}".`,
      });
    },
  );

  if (allowMutations) {
    server.registerTool(
      "build_report",
      {
        description:
          "Generate a rank and audit report for an ISO-8601 date window (mutations enabled)",
        inputSchema: zodShape(buildReportInputSchema),
        annotations: MUTATING,
      },
      async ({ title, from, to }) => {
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
        return jsonResult({ report });
      },
    );
  }

  server.registerTool(
    "generate_schema",
    {
      description: "Generate Schema.org JSON-LD structured data",
      inputSchema: schemaGeneratorInputSchema as z.ZodTypeAny,
      annotations: READ_ONLY,
    },
    async (input) => {
      const parsed = schemaGeneratorInputSchema.safeParse(input);
      if (!parsed.success) {
        return jsonResult({ error: parsed.error.flatten() });
      }
      return jsonResult({ schema: generateSchema(parsed.data) });
    },
  );

  return server;
}

export async function startMcpStdioServer(options: McpServerOptions): Promise<void> {
  const server = createRankMySeoMcpServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
