import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  comparePageSnapshots,
  loadRankMySeoConfig,
  summarizeRegression,
  type RankMySeoConfig,
  type SeoRegressionFinding,
  type SeoRegressionResult,
} from "@rankmyseo/core";
import {
  joinOriginAndRoute,
  ScanError,
  scanPage,
} from "@rankmyseo/scanner";

const execFileAsync = promisify(execFile);

export interface RegressionCheckOptions {
  configPath?: string;
  candidateUrl: string;
  baseRef?: string;
  headRef?: string;
  allRoutes?: boolean;
  json?: boolean;
  cwd?: string;
}

export type RegressionExitCode = 0 | 1 | 2;

function matchGlob(pattern: string, filePath: string): boolean {
  // Minimal glob: ** / * / exact. Good enough for configured file maps.
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "<<<DS>>>")
    .replace(/\*/g, "[^/]*")
    .replace(/<<<DS>>>/g, ".*");
  return new RegExp(`^${escaped}$`).test(filePath);
}

export function resolveRoutesFromChanges(input: {
  config: RankMySeoConfig;
  changedFiles: string[];
  allRoutes?: boolean;
}): { routes: string[]; skipped: string[] } {
  const regression = input.config.regression;
  if (!regression) {
    return { routes: [], skipped: [] };
  }

  const routes = new Set<string>(regression.alwaysRoutes);
  if (input.allRoutes) {
    for (const entry of regression.routeMap) {
      for (const route of entry.routes) routes.add(route);
    }
    return { routes: [...routes], skipped: [] };
  }

  const matchedFiles = new Set<string>();
  for (const file of input.changedFiles) {
    for (const entry of regression.routeMap) {
      if (entry.files.some((pattern) => matchGlob(pattern, file))) {
        matchedFiles.add(file);
        for (const route of entry.routes) routes.add(route);
      }
    }
  }

  const skipped = input.changedFiles.filter((f) => !matchedFiles.has(f));
  return { routes: [...routes], skipped };
}

async function gitDiffNames(
  cwd: string,
  baseRef: string,
  headRef: string,
): Promise<string[]> {
  const { stdout } = await execFileAsync(
    "git",
    ["diff", "--name-only", `${baseRef}...${headRef}`],
    { cwd },
  );
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function runRegressionCheck(
  options: RegressionCheckOptions,
): Promise<{ result: SeoRegressionResult; exitCode: RegressionExitCode }> {
  const cwd = options.cwd ?? process.cwd();
  const config = await loadRankMySeoConfig(
    options.configPath ?? "rankmyseo.config.ts",
    { cwd },
  );

  if (!config.regression?.enabled) {
    throw Object.assign(
      new Error(
        "Regression is disabled. Set regression.enabled=true in rankmyseo.config.ts",
      ),
      { exitCode: 2 as const },
    );
  }

  const productionUrl = config.regression.productionUrl;
  if (!productionUrl) {
    throw Object.assign(
      new Error("regression.productionUrl is required"),
      { exitCode: 2 as const },
    );
  }

  const baseRef = options.baseRef ?? "origin/main";
  const headRef = options.headRef ?? "HEAD";
  const changedFiles = options.allRoutes
    ? []
    : await gitDiffNames(cwd, baseRef, headRef);
  const { routes, skipped } = resolveRoutesFromChanges({
    config,
    changedFiles,
    allRoutes: options.allRoutes,
  });

  if (routes.length === 0) {
    const result = summarizeRegression({
      findings: [],
      productionOrigin: productionUrl,
      candidateOrigin: options.candidateUrl,
      routesScanned: [],
      routesSkipped: skipped,
      baseRef,
      headRef,
      failOn: config.regression.failOn,
    });
    return { result: { ...result, ok: true }, exitCode: 0 };
  }

  const findings: SeoRegressionFinding[] = [];
  const scanErrors: SeoRegressionResult["scanErrors"] = [];
  const productionOrigin = productionUrl.replace(/\/+$/, "");
  const candidateOrigin = options.candidateUrl.replace(/\/+$/, "");

  for (const route of routes) {
    const productionTarget = joinOriginAndRoute(productionOrigin, route);
    const candidateTarget = joinOriginAndRoute(candidateOrigin, route);

    try {
      const [baseline, current] = await Promise.all([
        scanPage(productionTarget, {
          route,
          originLabel: "production",
          allowedOrigins: [productionOrigin],
          timeoutMs: config.regression.timeoutMs,
          maxBytes: config.regression.maxBytes,
        }),
        scanPage(candidateTarget, {
          route,
          originLabel: "preview",
          allowedOrigins: [candidateOrigin],
          timeoutMs: config.regression.timeoutMs,
          maxBytes: config.regression.maxBytes,
        }),
      ]);
      findings.push(...comparePageSnapshots({ baseline, current }));
    } catch (err) {
      const message =
        err instanceof ScanError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err);
      scanErrors.push({
        route,
        origin: candidateOrigin,
        message,
      });
    }
  }

  const result = summarizeRegression({
    findings,
    productionOrigin,
    candidateOrigin,
    routesScanned: routes,
    routesSkipped: skipped,
    scanErrors,
    baseRef,
    headRef,
    failOn: config.regression.failOn,
  });

  if (scanErrors.length > 0) {
    return { result: { ...result, ok: false }, exitCode: 2 };
  }

  const failOn = config.regression.failOn;
  const gated = findings.filter((f) =>
    failOn === "error" ? f.severity === "error" : true,
  );
  return {
    result: { ...result, ok: gated.length === 0 },
    exitCode: gated.length === 0 ? 0 : 1,
  };
}

export function formatRegressionHuman(result: SeoRegressionResult): string {
  const lines: string[] = [
    `SEO regression: ${result.ok ? "PASS" : "FAIL"}`,
    `Production: ${result.productionOrigin}`,
    `Preview: ${result.candidateOrigin}`,
    `Routes scanned: ${result.routesScanned.length}`,
  ];
  if (result.findings.length === 0 && result.scanErrors.length === 0) {
    lines.push("No gated regressions.");
  }
  for (const finding of result.findings) {
    lines.push(
      `- [${finding.severity}] ${finding.route}: ${finding.message}`,
    );
  }
  for (const err of result.scanErrors) {
    lines.push(`- [scan-error] ${err.route}: ${err.message}`);
  }
  return lines.join("\n");
}
