import { describe, expect, it } from "vitest";
import { resolveRoutesFromChanges } from "./regression.js";
import { defineConfig } from "@rankmyseo/core";

describe("resolveRoutesFromChanges", () => {
  const config = defineConfig({
    databaseUrl: "sqlite://:memory:",
    tenantId: "t",
    projectId: "p",
    dataSources: [{ provider: "fixture", default: true }],
    schedule: { cron: "0 6 * * *", enabled: false },
    siteFeatures: {
      sitemap: true,
      llmsTxt: true,
      collector: true,
      markdownNegotiation: true,
      blog: false,
    },
    regression: {
      enabled: true,
      productionUrl: "https://example.com",
      alwaysRoutes: ["/"],
      routeMap: [
        { files: ["app/about/**"], routes: ["/about"] },
        { files: ["pages/index.tsx"], routes: ["/"] },
      ],
      failOn: "error",
    },
  });

  it("always includes critical routes and maps changed files", () => {
    const result = resolveRoutesFromChanges({
      config,
      changedFiles: ["app/about/page.tsx", "README.md"],
    });
    expect(result.routes).toEqual(expect.arrayContaining(["/", "/about"]));
    expect(result.skipped).toContain("README.md");
  });

  it("returns all mapped routes with --all-routes", () => {
    const result = resolveRoutesFromChanges({
      config,
      changedFiles: [],
      allRoutes: true,
    });
    expect(result.routes).toEqual(expect.arrayContaining(["/", "/about"]));
  });
});
