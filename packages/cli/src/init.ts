export const CONFIG_TEMPLATE = `import { defineConfig } from "@rankmyseo/core";

export default defineConfig({
  databaseUrl: "sqlite://./data/rankmyseo.sqlite",
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
  sitemapRoutes: ["/", "/about"],
  llmsTxt: {
    projectName: "My Site",
    summary: "SEO tracking powered by RankMySEO.",
    links: [{ title: "About", url: "/about.md" }],
  },
});
`;

export function scaffoldConfig(): string {
  return CONFIG_TEMPLATE;
}
