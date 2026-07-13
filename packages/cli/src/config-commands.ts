import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadRankMySeoConfig } from "@rankmyseo/core";
import { createStore } from "@rankmyseo/storage";
import { runScheduledIngestion } from "./schedule.js";
import { migrateDatabase } from "./migrate.js";

export interface ScheduleOptions {
  configPath?: string;
  databaseUrl?: string;
}

export async function runScheduleCommand(
  options: ScheduleOptions = {},
): Promise<{ appended: number; projectCreated: boolean; skipped?: boolean }> {
  const configPath = options.configPath ?? "rankmyseo.config.ts";
  const absolute = resolve(process.cwd(), configPath);

  let config;
  if (existsSync(absolute)) {
    config = await loadRankMySeoConfig(configPath);
  } else if (options.databaseUrl) {
    const { defineConfig } = await import("@rankmyseo/core");
    config = defineConfig({
      databaseUrl: options.databaseUrl,
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
    });
  } else {
    throw new Error(`Config file not found: ${absolute}`);
  }

  const store = createStore(config.databaseUrl);
  let projectCreated = false;

  const existing = await store.projects.getById(
    { tenantId: config.tenantId, projectId: config.projectId },
    config.projectId,
  );
  if (!existing) {
    await store.projects.create({
      id: config.projectId,
      tenantId: config.tenantId,
      name: "CLI Project",
      domain: "example.com",
    });
    projectCreated = true;
  }

  const result = await runScheduledIngestion(config, store);
  return {
    appended: result.appended,
    projectCreated,
    skipped: result.skipped === true,
  };
}

export async function runMigrateCommand(
  options: ScheduleOptions = {},
): Promise<{ path: string }> {
  const configPath = options.configPath ?? "rankmyseo.config.ts";
  const absolute = resolve(process.cwd(), configPath);

  let databaseUrl = options.databaseUrl;
  if (!databaseUrl && existsSync(absolute)) {
    const config = await loadRankMySeoConfig(configPath);
    databaseUrl = config.databaseUrl;
  }
  databaseUrl ??= "sqlite://./data/rankmyseo.sqlite";

  const result = migrateDatabase(databaseUrl);
  return { path: result.path };
}
