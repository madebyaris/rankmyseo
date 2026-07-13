import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadRankMySeoConfig } from "@rankmyseo/core";
import { createStore } from "@rankmyseo/storage";

export interface DoctorResult {
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; message: string }>;
}

export async function runDoctor(
  configPath = "rankmyseo.config.ts",
): Promise<DoctorResult> {
  const checks: DoctorResult["checks"] = [];
  const absolute = resolve(process.cwd(), configPath);

  if (!existsSync(absolute)) {
    checks.push({
      name: "config",
      ok: false,
      message: `Missing config file: ${absolute}`,
    });
    return { ok: false, checks };
  }

  checks.push({
    name: "config",
    ok: true,
    message: `Found ${absolute}`,
  });

  try {
    const config = await loadRankMySeoConfig(configPath);
    checks.push({
      name: "config-valid",
      ok: true,
      message: `Validated tenant ${config.tenantId} / project ${config.projectId}`,
    });

    try {
      const store = createStore(config.databaseUrl);
      void store;
      checks.push({
        name: "database",
        ok: true,
        message: `Storage adapter initialized for ${config.databaseUrl}`,
      });
    } catch (err) {
      checks.push({
        name: "database",
        ok: false,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  } catch (err) {
    checks.push({
      name: "config-valid",
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return { ok: checks.every((check) => check.ok), checks };
}
