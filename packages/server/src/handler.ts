import "server-only";

import type { LanguageModel } from "ai";
import {
  defineConfig,
  type RankMySeoConfig,
  type RankStore,
} from "@rankmyseo/core";
import { dispatchRoute } from "./routes.js";
import { readScope } from "./utils.js";

export type { RequestScope } from "./utils.js";
export { readScope } from "./utils.js";
export {
  buildLlmsTxt,
  buildSitemapXml,
  pageToMarkdown,
  withMarkdownNegotiation,
} from "./utils.js";

export interface HandlerOptions {
  config?: RankMySeoConfig;
  agentModel?: LanguageModel;
}

const defaultConfig = defineConfig({
  databaseUrl: "sqlite://:memory:",
  tenantId: "default",
  projectId: "default",
  dataSources: [{ provider: "fixture", default: true }],
  schedule: { cron: "0 6 * * *", enabled: false },
  siteFeatures: {
    sitemap: true,
    llmsTxt: true,
    collector: true,
    markdownNegotiation: true,
    blog: false,
  },
  sitemapRoutes: ["/"],
});

export function createHandler(store: RankStore, options: HandlerOptions = {}) {
  const config = options.config ?? defaultConfig;

  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    const sitePaths = ["/sitemap.xml", "/llms.txt", "/"];
    const needsScope =
      !sitePaths.includes(pathname) || pathname === "/";

    let scope = { tenantId: config.tenantId, projectId: config.projectId };
    if (needsScope && pathname !== "/") {
      const parsed = readScope(request);
      if (parsed instanceof Response) return parsed;
      scope = parsed;
    } else if (request.headers.get("x-tenant-id")) {
      const parsed = readScope(request);
      if (!(parsed instanceof Response)) scope = parsed;
    }

    const response = await dispatchRoute(request, {
      store,
      scope,
      config,
      agentModel: options.agentModel,
    });

    if (response) return response;
    return Response.json({ error: "Not found" }, { status: 404 });
  };
}
