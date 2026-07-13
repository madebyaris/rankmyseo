import { describe, it, expect } from "vitest";
import { defineConfig } from "@rankmyseo/core";
import { runServerAdapterContractTests } from "@rankmyseo/core/testing";
import { createStore } from "@rankmyseo/storage";
import { createHandler } from "@rankmyseo/server";
import { createRankMySeoApp } from "./index.js";

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

describe("createRankMySeoApp smoke", () => {
  it("mounts the Hono adapter on the same contract surface", async () => {
    const store = createStore(":memory:");
    await store.projects.create({
      id: "project-1",
      tenantId: "tenant-a",
      name: "Smoke Project",
      domain: "example.com",
    });
    const app = createRankMySeoApp(store, { config });
    const res = await app.request("/keywords", {
      headers: {
        "x-tenant-id": "tenant-a",
        "x-project-id": "project-1",
      },
    });
    expect(res.status).toBe(200);
  });
});
