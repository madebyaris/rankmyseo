import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, it, expect } from "vitest";
import express from "express";
import { defineConfig } from "@rankmyseo/core";
import { runServerAdapterContractTests } from "@rankmyseo/core/testing";
import { createStore } from "@rankmyseo/storage";
import { createHandler } from "@rankmyseo/server";
import { createRankMySeoExpress } from "./index.js";

const config = defineConfig({
  databaseUrl: "sqlite://:memory:",
  tenantId: "tenant-a",
  projectId: "project-1",
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
  llmsTxt: {
    projectName: "Example",
    summary: "Demo site",
    links: [{ title: "About", url: "/about.md" }],
  },
});

runServerAdapterContractTests({
  config,
  makeStore: () => createStore(":memory:"),
  makeHandler: (store) => createHandler(store, { config }),
});

describe("createRankMySeoExpress smoke", () => {
  it("serves /keywords over a live Express server", async () => {
    const store = createStore(":memory:");
    await store.projects.create({
      id: "project-1",
      tenantId: "tenant-a",
      name: "Smoke Project",
      domain: "example.com",
    });

    const app = express();
    app.use(createRankMySeoExpress(store, { config }));

    const server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    try {
      const { port } = server.address() as AddressInfo;
      const res = await fetch(`http://127.0.0.1:${port}/keywords`, {
        headers: {
          "x-tenant-id": "tenant-a",
          "x-project-id": "project-1",
        },
      });
      expect(res.status).toBe(200);
      const json = (await res.json()) as { data: unknown[] };
      expect(Array.isArray(json.data)).toBe(true);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  it("respects basePath when mounted under a subpath", async () => {
    const store = createStore(":memory:");
    await store.projects.create({
      id: "project-1",
      tenantId: "tenant-a",
      name: "Smoke Project",
      domain: "example.com",
    });

    const app = express();
    app.use(
      "/api/rankmyseo",
      createRankMySeoExpress(store, {
        config,
        basePath: "/api/rankmyseo",
      }),
    );

    const server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    try {
      const { port } = server.address() as AddressInfo;
      const res = await fetch(
        `http://127.0.0.1:${port}/api/rankmyseo/keywords`,
        {
          headers: {
            "x-tenant-id": "tenant-a",
            "x-project-id": "project-1",
          },
        },
      );
      expect(res.status).toBe(200);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });
});
