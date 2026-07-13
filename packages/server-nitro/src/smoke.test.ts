import { describe, it, expect } from "vitest";
import { createApp, toWebHandler } from "h3";
import { defineConfig } from "@rankmyseo/core";
import { runServerAdapterContractTests } from "@rankmyseo/core/testing";
import { createStore } from "@rankmyseo/storage";
import { createHandler } from "@rankmyseo/server";
import { createRankMySeoNitroHandler } from "./index.js";

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

describe("createRankMySeoNitroHandler smoke", () => {
  it("serves /keywords through an h3 app via toWebHandler", async () => {
    const store = createStore(":memory:");
    await store.projects.create({
      id: "project-1",
      tenantId: "tenant-a",
      name: "Smoke Project",
      domain: "example.com",
    });

    const app = createApp();
    app.use(createRankMySeoNitroHandler(store, { config }));
    const webHandler = toWebHandler(app);

    const res = await webHandler(
      new Request("http://localhost/keywords", {
        headers: {
          "x-tenant-id": "tenant-a",
          "x-project-id": "project-1",
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: unknown[] };
    expect(Array.isArray(json.data)).toBe(true);
  });

  it("respects basePath", async () => {
    const store = createStore(":memory:");
    await store.projects.create({
      id: "project-1",
      tenantId: "tenant-a",
      name: "Smoke Project",
      domain: "example.com",
    });

    const app = createApp();
    app.use(
      "/api/rankmyseo",
      createRankMySeoNitroHandler(store, {
        config,
        basePath: "/api/rankmyseo",
      }),
    );
    const webHandler = toWebHandler(app);

    const res = await webHandler(
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
