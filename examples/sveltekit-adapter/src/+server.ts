/**
 * SvelteKit `+server.ts` pattern for RankMySEO.
 *
 * Copy into `src/routes/api/rankmyseo/[...path]/+server.ts` (or similar).
 * SvelteKit already uses Web `Request` / `Response`, so this is a thin
 * `createHandler` bridge — no framework adapter package required.
 */
import type { RankStore } from "@rankmyseo/core";
import { createHandler, type HandlerOptions } from "@rankmyseo/server";

export type SvelteKitRequestEvent = {
  request: Request;
};

export type SvelteKitRequestHandler = (
  event: SvelteKitRequestEvent,
) => Promise<Response> | Response;

/**
 * Build `{ GET, POST, PUT, PATCH, DELETE }` exports for a SvelteKit `+server.ts`.
 */
export function createSvelteKitRankMySeoHandlers(
  store: RankStore,
  options: HandlerOptions = {},
): Record<"GET" | "POST" | "PUT" | "PATCH" | "DELETE", SvelteKitRequestHandler> {
  const handler = createHandler(store, options);
  const adapt: SvelteKitRequestHandler = ({ request }) => handler(request);
  return {
    GET: adapt,
    POST: adapt,
    PUT: adapt,
    PATCH: adapt,
    DELETE: adapt,
  };
}

/* Example +server.ts body (for copy-paste into a real SvelteKit app):

import { defineConfig } from "@rankmyseo/core";
import { createStore } from "@rankmyseo/storage";
import { createSvelteKitRankMySeoHandlers } from "./rankmyseo-handlers.js";

const store = createStore(process.env.DATABASE_URL!);
const config = defineConfig({
  databaseUrl: process.env.DATABASE_URL!,
  tenantId: "tenant-a",
  projectId: "project-1",
  dataSources: [{ provider: "fixture", default: true }],
});

export const { GET, POST, PUT, PATCH, DELETE } = createSvelteKitRankMySeoHandlers(
  store,
  { config, basePath: "/api/rankmyseo" },
);

*/
