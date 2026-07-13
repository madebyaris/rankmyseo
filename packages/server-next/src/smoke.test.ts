import { describe, it, expect } from "vitest";
import { defineConfig } from "@rankmyseo/core";
import { runServerAdapterContractTests } from "@rankmyseo/core/testing";
import { createStore } from "@rankmyseo/storage";
import { createHandler } from "@rankmyseo/server";
import {
  createRankMySeoNextHandler,
  createRankMySeoRouteHandlers,
  runtime,
} from "./index.js";

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

describe("createRankMySeoRouteHandlers smoke", () => {
  it("exports nodejs runtime constant", () => {
    expect(runtime).toBe("nodejs");
  });

  it("route handler methods call through to createHandler", async () => {
    const store = createStore(":memory:");
    await store.projects.create({
      id: "project-1",
      tenantId: "tenant-a",
      name: "Smoke Project",
      domain: "example.com",
    });

    const handlers = createRankMySeoRouteHandlers(store, { config });
    for (const method of [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
      "HEAD",
    ] as const) {
      expect(typeof handlers[method]).toBe("function");
    }

    const res = await handlers.GET(
      new Request("http://localhost/keywords", {
        headers: {
          "x-tenant-id": "tenant-a",
          "x-project-id": "project-1",
        },
      }),
    );
    expect(res.status).toBe(200);
  });

  it("createRankMySeoNextHandler matches createHandler", async () => {
    const store = createStore(":memory:");
    await store.projects.create({
      id: "project-1",
      tenantId: "tenant-a",
      name: "Smoke Project",
      domain: "example.com",
    });

    const handler = createRankMySeoNextHandler(store, {
      config,
      basePath: "/api/rankmyseo",
    });
    const res = await handler(
      new Request("http://localhost/api/rankmyseo/keywords", {
        headers: {
          "x-tenant-id": "tenant-a",
          "x-project-id": "project-1",
        },
      }),
    );
    expect(res.status).toBe(200);
  });
});
