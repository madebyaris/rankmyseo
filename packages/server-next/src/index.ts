import type { RankStore } from "@rankmyseo/core";
import { createHandler, type HandlerOptions } from "@rankmyseo/server";

/** App Router route handler signature (Web `Request` → `Response`). */
export type NextRouteHandler = (
  request: Request,
) => Promise<Response>;

/** Catch-all HTTP method map for `app/api/.../route.ts`. */
export type RankMySeoRouteHandlers = {
  GET: NextRouteHandler;
  POST: NextRouteHandler;
  PUT: NextRouteHandler;
  PATCH: NextRouteHandler;
  DELETE: NextRouteHandler;
  OPTIONS: NextRouteHandler;
  HEAD: NextRouteHandler;
};

/**
 * Single Next.js App Router handler. Prefer this when you re-export one method,
 * or use {@link createRankMySeoRouteHandlers} for a full catch-all route module.
 *
 * Requires the Node.js runtime (`export const runtime = "nodejs"`).
 */
export function createRankMySeoNextHandler(
  store: RankStore,
  options: HandlerOptions = {},
): NextRouteHandler {
  return createHandler(store, options);
}

/**
 * Returns `{ GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD }` for App Router
 * catch-all routes such as `app/api/rankmyseo/[[...path]]/route.ts`.
 *
 * ```ts
 * import { createStore } from "@rankmyseo/storage";
 * import {
 *   createRankMySeoRouteHandlers,
 *   runtime,
 * } from "@rankmyseo/server-next";
 *
 * const store = createStore(process.env.DATABASE_URL!);
 * export { runtime };
 * export const { GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD } =
 *   createRankMySeoRouteHandlers(store, {
 *     config,
 *     basePath: "/api/rankmyseo",
 *   });
 * ```
 */
export function createRankMySeoRouteHandlers(
  store: RankStore,
  options: HandlerOptions = {},
): RankMySeoRouteHandlers {
  const handler = createHandler(store, options);
  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    PATCH: handler,
    DELETE: handler,
    OPTIONS: handler,
    HEAD: handler,
  };
}

/**
 * Re-export this from your route module. RankMySEO is not Edge/Workers compatible
 * (SQLite, full Node APIs) — App Router must use the Node.js runtime.
 */
export const runtime = "nodejs" as const;
