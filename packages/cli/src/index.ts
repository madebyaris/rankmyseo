#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "@rankmyseo/core";
import { runInstallWizard, type InstallOptions } from "@rankmyseo/installer";
import { createStore } from "@rankmyseo/storage";
import { scaffoldConfig } from "./init.js";
import { migrateDatabase } from "./migrate.js";
import { runScheduledIngestion } from "./schedule.js";

export async function runCli(argv: string[] = process.argv.slice(2)) {
  const [command, ...args] = argv;

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
          blog: false,
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
    case "install":
    case "i": {
      const options = parseInstallArgs(args);
      await runInstallWizard(options);
      break;
    }
    default:
      console.log(`RankMySEO CLI

Usage:
  rankmyseo install [--preset recommended|full|custom] [--packages a,b] [--yes]
  rankmyseo init [path]       Scaffold rankmyseo.config.ts
  rankmyseo migrate [dbUrl]   Run storage migrations
  rankmyseo schedule [dbUrl]  Run one ingestion pass

Tip: npm i rankmyseo && npx rankmyseo install  — interactive package picker
`);
  }
}

function parseInstallArgs(args: string[]): InstallOptions {
  const presetRaw = readOption(args, "--preset");
  const preset =
    presetRaw === "recommended" || presetRaw === "full" || presetRaw === "custom"
      ? presetRaw
      : undefined;
  const packagesRaw = readOption(args, "--packages");
  return {
    preset,
    packages: packagesRaw
      ? packagesRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    yes: args.includes("--yes") || args.includes("-y"),
  };
}

function readOption(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

async function main() {
  await runCli();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
