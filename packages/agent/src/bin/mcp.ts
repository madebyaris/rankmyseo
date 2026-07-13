#!/usr/bin/env node
import { createStore } from "@rankmyseo/storage";
import { startMcpStdioServer } from "../mcp.js";

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL ?? process.env.RANKMYSEO_DATABASE_URL ?? "sqlite://./data/rankmyseo.sqlite";
  const tenantId = process.env.TENANT_ID ?? process.env.RANKMYSEO_TENANT_ID ?? "tenant-a";
  const projectId = process.env.PROJECT_ID ?? process.env.RANKMYSEO_PROJECT_ID ?? "project-1";

  const store = createStore(databaseUrl);
  await startMcpStdioServer({
    store,
    scope: { tenantId, projectId },
    allowMutations: process.env.RANKMYSEO_MCP_ALLOW_MUTATIONS === "1",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
