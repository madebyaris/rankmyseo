import { zodToJsonSchema } from "zod-to-json-schema";
import { rankMySeoConfigSchema } from "./config/schema.js";
import {
  dashboardConfigSchema,
  dashboardWidgetSchema,
} from "./schemas/index.js";

function toJsonSchema(schema: unknown, name: string) {
  return zodToJsonSchema(schema as Parameters<typeof zodToJsonSchema>[0], {
    name,
    $refStrategy: "none",
  });
}

export const rankMySeoConfigJsonSchema = toJsonSchema(
  rankMySeoConfigSchema,
  "RankMySeoConfig",
);

export const dashboardConfigJsonSchema = toJsonSchema(
  dashboardConfigSchema,
  "DashboardConfig",
);

export const dashboardWidgetJsonSchema = toJsonSchema(
  dashboardWidgetSchema,
  "DashboardWidget",
);
