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
   * Optional mount prefix (e.g. `/api/rankmyseo`). When set, matching requests
   * are rewritten so route matching sees paths like `/keywords`.
   */
  basePath?: string;
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

/** Normalize a mount prefix to `/path` or empty string for root. */
export function normalizeBasePath(basePath?: string): string {
  if (!basePath || basePath === "/") return "";
  const withLeading = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return withLeading.replace(/\/+$/, "");
}

/**
 * Strip a mount prefix from a pathname. Returns `null` when the path is
 * outside the mount (caller should 404).
 */
export function stripBasePath(
  pathname: string,
  basePath?: string,
): string | null {
  const normalized = normalizeBasePath(basePath);
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (!normalized) return clean;
  if (clean === normalized) return "/";
  if (clean.startsWith(`${normalized}/`)) {
    return clean.slice(normalized.length) || "/";
  }
  return null;
}

/** Rewrite `request.url` so pathname is relative to `basePath`. */
export function rewriteRequestBasePath(
  request: Request,
  basePath?: string,
): Request | null {
  const normalized = normalizeBasePath(basePath);
  if (!normalized) return request;

  const url = new URL(request.url);
  const stripped = stripBasePath(url.pathname, normalized);
  if (stripped === null) return null;

  url.pathname = stripped;
  return new Request(url, request);
}

export function createHandler(store: RankStore, options: HandlerOptions = {}) {
  const config = options.config ?? defaultConfig;
  const basePath = normalizeBasePath(options.basePath);

  return async (request: Request): Promise<Response> => {
    const rewritten = rewriteRequestBasePath(request, basePath);
    if (rewritten === null) {
      return apiError("Not found", 404, { code: "NOT_FOUND" });
    }

    const url = new URL(rewritten.url);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    const sitePathsWithoutScope = ["/sitemap.xml", "/llms.txt", "/"];
    const needsScope = !sitePathsWithoutScope.includes(pathname);

    let scope = { tenantId: config.tenantId, projectId: config.projectId };
    if (needsScope) {
      const parsed = readScope(rewritten);
      if (parsed instanceof Response) return parsed;
      scope = parsed;
    } else if (rewritten.headers.get("x-tenant-id")) {
      const parsed = readScope(rewritten);
      if (!(parsed instanceof Response)) scope = parsed;
    }

    if (options.authorize) {
      const denied = await options.authorize(rewritten, scope);
      if (denied instanceof Response) return denied;
    }

    try {
      const response = await dispatchRoute(rewritten, {
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
