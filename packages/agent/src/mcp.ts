import "server-only";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { generateSchema, schemaGeneratorInputSchema } from "@rankmyseo/core";
import type { RankStore, TenantScope } from "@rankmyseo/core";
import { z } from "zod";

export interface McpServerOptions {
  store: RankStore;
  scope: TenantScope;
}

export function createRankMySeoMcpServer(options: McpServerOptions): McpServer {
  const { store, scope } = options;
  const server = new McpServer({
    name: "rankmyseo",
    version: "0.0.0",
  });

  server.tool(
    "list_keywords",
    "List tracked keywords",
    {},
    async () => {
      const keywords = await store.keywords.list(scope);
      return {
        content: [{ type: "text", text: JSON.stringify({ keywords }) }],
      };
    },
  );

  server.tool(
    "query_rank_history",
    "Query rank snapshots",
    {
      keywordId: z.string().optional(),
      from: z.string(),
      to: z.string(),
    },
    async ({ keywordId, from, to }) => {
      const snapshots = await store.snapshots.listByRange({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        keywordId,
        from: new Date(from),
        to: new Date(to),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ snapshots }) }],
      };
    },
  );

  server.tool(
    "get_dashboard_config",
    "Get dashboard config",
    {},
    async () => {
      const config = await store.dashboard.get(scope);
      return {
        content: [{ type: "text", text: JSON.stringify({ config }) }],
      };
    },
  );

  server.tool(
    "generate_schema",
    "Generate Schema.org JSON-LD structured data",
    {
      type: z.enum(["Article", "Product", "FAQPage", "BreadcrumbList", "Organization"]),
      headline: z.string().optional(),
      description: z.string().optional(),
      url: z.string().optional(),
      image: z.string().optional(),
      authorName: z.string().optional(),
      datePublished: z.string().optional(),
      dateModified: z.string().optional(),
      publisherName: z.string().optional(),
      name: z.string().optional(),
      brand: z.string().optional(),
      sku: z.string().optional(),
      price: z.string().optional(),
      priceCurrency: z.string().optional(),
      availability: z.string().optional(),
      ratingValue: z.number().optional(),
      reviewCount: z.number().int().optional(),
      questions: z
        .array(z.object({ question: z.string(), answer: z.string() }))
        .optional(),
      items: z
        .array(z.object({ name: z.string(), url: z.string() }))
        .optional(),
      logo: z.string().optional(),
      sameAs: z.array(z.string()).optional(),
    },
    async (input) => {
      const parsed = schemaGeneratorInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: parsed.error.flatten() }),
            },
          ],
        };
      }
      const schema = generateSchema(parsed.data);
      return {
        content: [{ type: "text", text: JSON.stringify({ schema }) }],
      };
    },
  );

  return server;
}

export async function startMcpStdioServer(options: McpServerOptions): Promise<void> {
  const server = createRankMySeoMcpServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
