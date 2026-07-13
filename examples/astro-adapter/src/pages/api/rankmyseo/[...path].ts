/**
 * Astro API route pattern for RankMySEO.
 *
 * Copy into `src/pages/api/rankmyseo/[...path].ts`.
 * Astro endpoints receive a Web `Request` via `APIContext.request`.
 */
import type { RankStore } from "@rankmyseo/core";
import { createHandler, type HandlerOptions } from "@rankmyseo/server";

export type AstroAPIContext = {
  request: Request;
};

export type AstroAPIRoute = (
  context: AstroAPIContext,
) => Promise<Response> | Response;

/**
 * Build an Astro `ALL` (or per-method) endpoint handler.
 */
export function createAstroRankMySeoHandler(
  store: RankStore,
  options: HandlerOptions = {},
): AstroAPIRoute {
  const handler = createHandler(store, options);
  return ({ request }) => handler(request);
}

/* Example pages/api/rankmyseo/[...path].ts (copy into a real Astro app):

import { defineConfig } from "@rankmyseo/core";
import { createStore } from "@rankmyseo/storage";
import { createAstroRankMySeoHandler } from "./rankmyseo-handler.js";

const store = createStore(import.meta.env.DATABASE_URL);
const config = defineConfig({
  databaseUrl: import.meta.env.DATABASE_URL,
  tenantId: "tenant-a",
  projectId: "project-1",
  dataSources: [{ provider: "fixture", default: true }],
});

export const ALL = createAstroRankMySeoHandler(store, {
  config,
  basePath: "/api/rankmyseo",
});

*/
