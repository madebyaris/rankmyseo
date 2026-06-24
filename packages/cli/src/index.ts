#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "@rankmyseo/core";
import { createStore } from "@rankmyseo/storage";
import { scaffoldConfig } from "./init.js";
import { migrateDatabase } from "./migrate.js";
import { runScheduledIngestion } from "./schedule.js";

const [, , command, ...args] = process.argv;

async function main() {
  switch (command) {
    case "init": {
      const target = resolve(process.cwd(), args[0] ?? "rankmyseo.config.ts");
      writeFileSync(target, scaffoldConfig(), "utf8");
      console.log(`Created ${target}`);
      break;
    }
    case "migrate": {
      const url = args[0] ?? "sqlite://./data/rankmyseo.sqlite";
      const result = migrateDatabase(url);
      console.log(`Migrated ${result.path}`);
      break;
    }
    case "schedule": {
      const url = args[0] ?? "sqlite://./data/rankmyseo.sqlite";
      const config = defineConfig({
        databaseUrl: url,
        tenantId: "tenant-a",
        projectId: "project-1",
        dataSources: [{ provider: "fixture", default: true }],
        schedule: { cron: "0 6 * * *", enabled: false },
        siteFeatures: {
          sitemap: true,
          llmsTxt: true,
          collector: true,
          markdownNegotiation: true,
        },
        sitemapRoutes: ["/"],
      });
      const store = createStore(url);
      await store.projects.create({
        id: config.projectId,
        tenantId: config.tenantId,
        name: "CLI Project",
        domain: "example.com",
      });
      const result = await runScheduledIngestion(config, store);
      console.log(`Ingested ${result.appended} snapshots`);
      break;
    }
    default:
      console.log(`RankMySEO CLI

Usage:
  rankmyseo init [path]       Scaffold rankmyseo.config.ts
  rankmyseo migrate [dbUrl]   Run storage migrations
  rankmyseo schedule [dbUrl] Run one ingestion pass
`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
