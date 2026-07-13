import { zodToJsonSchema } from "zod-to-json-schema";
import { schemaGeneratorInputSchema } from "@rankmyseo/core";
import {
  addKeywordInputSchema,
  buildReportInputSchema,
  explainMetricInputSchema,
  getAuditInputSchema,
  queryRankHistoryInputSchema,
  runAuditInputSchema,
  updateDashboardConfigInputSchema,
} from "./tools.js";

function toJsonSchema(schema: unknown, name: string) {
  return zodToJsonSchema(schema as Parameters<typeof zodToJsonSchema>[0], {
    name,
    $refStrategy: "none",
  });
}

export const agentToolInputJsonSchemas = {
  addKeyword: toJsonSchema(addKeywordInputSchema, "AddKeywordInput"),
  buildReport: toJsonSchema(buildReportInputSchema, "BuildReportInput"),
  explainMetric: toJsonSchema(explainMetricInputSchema, "ExplainMetricInput"),
  generateSchema: toJsonSchema(schemaGeneratorInputSchema, "GenerateSchemaInput"),
  getAudit: toJsonSchema(getAuditInputSchema, "GetAuditInput"),
  queryRankHistory: toJsonSchema(queryRankHistoryInputSchema, "QueryRankHistoryInput"),
  runAudit: toJsonSchema(runAuditInputSchema, "RunAuditInput"),
  updateDashboardConfig: toJsonSchema(
    updateDashboardConfigInputSchema,
    "UpdateDashboardConfigInput",
  ),
} as const;
