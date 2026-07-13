import "server-only";

import type { LanguageModel } from "ai";
import {
  defineConfig,
  type RankMySeoConfig,
  type RankStore,
  type TenantScope,
} from "@rankmyseo/core";
import { dispatchRoute } from "./routes.js";
import { apiError } from "./errors.js";
import { readScope } from "./utils.js";

export type { RequestScope } from "./utils.js";
export { readScope } from "./utils.js";
export {
  buildLlmsTxt,
  buildSitemapXml,
  pageToMarkdown,
  withMarkdownNegotiation,
} from "./utils.js";
export type { ApiErrorResponse, ApiSuccessResponse } from "./errors.js";
export { apiError, isApiErrorResponse } from "./errors.js";

export interface HandlerOptions {
  config?: RankMySeoConfig;
  agentModel?: LanguageModel;
  /**
   * Optional authorization hook. Scope headers select tenant/project — they do
   * not authenticate. Integrators should validate the caller against `scope`.
   * Return a Response to deny, or void/undefined to allow.
   */
  authorize?: (
    request: Request,
    scope: TenantScope,
  ) => Promise<Response | void> | Response | void;
  /** Optional PageSpeed Insights enrichment for POST /scan. */
  includeWebVitals?: boolean;
  psiApiKey?: string;
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

    const sitePathsWithoutScope = ["/sitemap.xml", "/llms.txt", "/"];
    const needsScope = !sitePathsWithoutScope.includes(pathname);

    let scope = { tenantId: config.tenantId, projectId: config.projectId };
    if (needsScope) {
      const parsed = readScope(request);
      if (parsed instanceof Response) return parsed;
      scope = parsed;
    } else if (request.headers.get("x-tenant-id")) {
      const parsed = readScope(request);
      if (!(parsed instanceof Response)) scope = parsed;
    }

    if (options.authorize) {
      const denied = await options.authorize(request, scope);
      if (denied instanceof Response) return denied;
    }

    try {
      const response = await dispatchRoute(request, {
        store,
        scope,
        config,
        agentModel: options.agentModel,
        includeWebVitals: options.includeWebVitals,
        psiApiKey: options.psiApiKey,
      });

      if (response) return response;
      return apiError("Not found", 404, { code: "NOT_FOUND" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      return apiError(message, 500, { code: "INTERNAL_ERROR" });
    }
  };
}
