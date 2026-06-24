import "server-only";

import type { RankStore } from "@rankmyseo/core";
import { createHandler } from "@rankmyseo/server";
import { Hono } from "hono";

export function createRankMySeoApp(store: RankStore): Hono {
  const handler = createHandler(store);
  const app = new Hono();

  app.all("*", async (c) => handler(c.req.raw));

  return app;
}
