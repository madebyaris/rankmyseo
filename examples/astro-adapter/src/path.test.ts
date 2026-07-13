import { describe, it, expect } from "vitest";
import { defineConfig } from "@rankmyseo/core";
import { createStore } from "@rankmyseo/storage";
import { createAstroRankMySeoHandler } from "./pages/api/rankmyseo/[...path].js";

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
});

describe("Astro API route adapter fixture", () => {
  it("bridges Request/Response via createHandler", async () => {
    const store = createStore(":memory:");
    await store.projects.create({
      id: "project-1",
      tenantId: "tenant-a",
      name: "Astro Fixture",
      domain: "example.com",
    });

    const ALL = createAstroRankMySeoHandler(store, {
      config,
      basePath: "/api/rankmyseo",
    });

    const res = await ALL({
      request: new Request("http://localhost/api/rankmyseo/keywords", {
        headers: {
          "x-tenant-id": "tenant-a",
          "x-project-id": "project-1",
        },
      }),
    });

    expect(res.status).toBe(200);
  });
});
