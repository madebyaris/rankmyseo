import "server-only";

import type { RankStore } from "@rankmyseo/core";
import { createHandler, type HandlerOptions } from "@rankmyseo/server";
import { Hono } from "hono";

export function createRankMySeoApp(
  store: RankStore,
  options: HandlerOptions = {},
): Hono {
  const handler = createHandler(store, options);
  const app = new Hono();

  app.all("*", async (c) => handler(c.req.raw));

  return app;
}
