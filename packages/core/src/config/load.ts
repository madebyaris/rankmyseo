import { createJiti } from "jiti";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseRankMySeoConfig, type RankMySeoConfig } from "./schema.js";

export interface LoadConfigOptions {
  cwd?: string;
}

function jitiParentUrl(): string {
  if (typeof import.meta !== "undefined" && import.meta.url) {
    return import.meta.url;
  }
  return pathToFileURL(`${process.cwd()}/`).href;
}

export async function loadRankMySeoConfig(
  configPath = "rankmyseo.config.ts",
  options: LoadConfigOptions = {},
): Promise<RankMySeoConfig> {
  const cwd = options.cwd ?? process.cwd();
  const absolute = resolve(cwd, configPath);

  if (!existsSync(absolute)) {
    throw new Error(`Config file not found: ${absolute}`);
  }

  const jiti = createJiti(jitiParentUrl(), { interopDefault: true });
  const mod = (await jiti.import(absolute)) as { default?: unknown };
  const raw = mod.default ?? mod;
  return parseRankMySeoConfig(raw);
}
