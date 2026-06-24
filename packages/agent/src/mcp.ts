import "server-only";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

  return server;
}

export async function startMcpStdioServer(options: McpServerOptions): Promise<void> {
  const server = createRankMySeoMcpServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
