#!/usr/bin/env node
import { existsSync } from "node:fs";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInstallWizard, type InstallOptions } from "@rankmyseo/installer";
import { runMigrateCommand, runScheduleCommand } from "./config-commands.js";
import { runDoctor } from "./doctor.js";
import { scaffoldConfig } from "./init.js";
import {
  formatRegressionHuman,
  runRegressionCheck,
} from "./regression.js";
import { readCliVersion } from "./version.js";

export interface CliGlobalOptions {
  json?: boolean;
}

export async function runCli(argv: string[] = process.argv.slice(2)) {
  const globalOptions = parseGlobalOptions(argv);
  const args = stripGlobalOptions(argv);
  const [command, ...rest] = args;

  const emit = (payload: unknown) => {
    if (globalOptions.json) {
      console.log(JSON.stringify(payload, null, 2));
      return;
    }
    if (typeof payload === "string") {
      console.log(payload);
    }
  };

  switch (command) {
    case "init": {
      const target = resolve(process.cwd(), rest[0] ?? "rankmyseo.config.ts");
      if (existsSync(target)) {
        const message = `Refusing to overwrite existing file: ${target}`;
        if (globalOptions.json) {
          emit({ ok: false, error: message });
        } else {
          console.error(message);
        }
        process.exitCode = 1;
        break;
      }
      writeFileSync(target, scaffoldConfig(), "utf8");
      emit(globalOptions.json ? { ok: true, path: target } : `Created ${target}`);
      break;
    }
    case "migrate": {
      const result = await runMigrateCommand({
        databaseUrl: rest[0],
        configPath: readOption(rest, "--config"),
      });
      emit(
        globalOptions.json
          ? { ok: true, ...result }
          : `Migrated ${result.path}`,
      );
      break;
    }
    case "schedule": {
      const result = await runScheduleCommand({
        databaseUrl: rest[0],
        configPath: readOption(rest, "--config"),
      });
      emit(
        globalOptions.json
          ? { ok: true, ...result }
          : result.skipped
            ? "Schedule disabled in config (schedule.enabled=false); no ingestion run"
            : `Ingested ${result.appended} snapshots${result.projectCreated ? " (seed project created)" : ""}`,
      );
      break;
    }
    case "doctor": {
      const result = await runDoctor(readOption(rest, "--config") ?? rest[0]);
      if (globalOptions.json) {
        emit(result);
      } else {
        for (const check of result.checks) {
          console.log(`${check.ok ? "✓" : "✗"} ${check.name}: ${check.message}`);
        }
      }
      if (!result.ok) process.exitCode = 1;
      break;
    }
    case "regression": {
      const sub = rest[0] === "check" ? "check" : rest[0];
      const args = rest[0] === "check" ? rest.slice(1) : rest;
      if (sub && sub !== "check" && !sub.startsWith("--")) {
        console.error(`Unknown regression subcommand: ${sub}`);
        process.exitCode = 2;
        break;
      }
      const candidateUrl = readOption(args, "--candidate-url");
      if (!candidateUrl) {
        console.error("Missing required --candidate-url <url>");
        process.exitCode = 2;
        break;
      }
      try {
        const { result, exitCode } = await runRegressionCheck({
          candidateUrl,
          baseRef: readOption(args, "--base-ref"),
          headRef: readOption(args, "--head-ref"),
          configPath: readOption(args, "--config"),
          allRoutes: args.includes("--all-routes"),
          json: globalOptions.json,
        });
        if (globalOptions.json) {
          emit(result);
        } else {
          console.log(formatRegressionHuman(result));
        }
        process.exitCode = exitCode;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (globalOptions.json) {
          emit({ ok: false, error: message });
        } else {
          console.error(message);
        }
        process.exitCode =
          typeof err === "object" &&
          err &&
          "exitCode" in err &&
          typeof (err as { exitCode: unknown }).exitCode === "number"
            ? ((err as { exitCode: number }).exitCode as 0 | 1 | 2)
            : 2;
      }
      break;
    }
    case "version":
    case "--version":
    case "-v": {
      const version = readCliVersion();
      emit(globalOptions.json ? { version } : version);
      break;
    }
    case "install":
    case "i": {
      const options = parseInstallArgs(rest);
      await runInstallWizard(options);
      break;
    }
    default:
      console.log(`RankMySEO CLI v${readCliVersion()}

Usage:
  rankmyseo-cli install [--preset recommended|full|custom] [--packages a,b] [--yes]
  rankmyseo-cli init [path]                 Scaffold rankmyseo.config.ts
  rankmyseo-cli migrate [dbUrl]             Run storage migrations
  rankmyseo-cli schedule [dbUrl]            Run one ingestion pass
  rankmyseo-cli doctor [--config path]      Validate config + storage
  rankmyseo-cli regression check --candidate-url <url> [--base-ref sha] [--head-ref HEAD] [--all-routes] [--config path]
  rankmyseo-cli version                     Print CLI version

Global flags:
  --json                                    Machine-readable output

Tip: npm i rankmyseo && npx rankmyseo install  — interactive package picker
`);
  }
}

function parseGlobalOptions(args: string[]): CliGlobalOptions {
  return { json: args.includes("--json") };
}

function stripGlobalOptions(args: string[]): string[] {
  return args.filter((arg) => arg !== "--json");
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
