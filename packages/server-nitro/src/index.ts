import type { RankStore } from "@rankmyseo/core";
import { createHandler, type HandlerOptions } from "@rankmyseo/server";
import {
  defineEventHandler,
  sendWebResponse,
  toWebRequest,
  type EventHandler,
  type H3Event,
} from "h3";

/**
 * Nitro / Nuxt server route handler powered by h3.
 *
 * Uses `toWebRequest` + `sendWebResponse` so streaming bodies (agent chat)
 * pass through when the runtime supports them.
 *
 * ```ts
 * // server/api/rankmyseo/[...].ts
 * export default createRankMySeoNitroHandler(store, {
 *   config,
 *   basePath: "/api/rankmyseo",
 * });
 * ```
 */
export function createRankMySeoNitroHandler(
  store: RankStore,
  options: HandlerOptions = {},
): EventHandler {
  const handler = createHandler(store, options);

  return defineEventHandler(async (event: H3Event) => {
    const request = toWebRequest(event);
    const response = await handler(request);
    return sendWebResponse(event, response);
  });
}
