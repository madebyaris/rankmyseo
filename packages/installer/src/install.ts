import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import {
  PACKAGE_CATALOG,
  peersForPackages,
  resolvePackageNames,
  type InstallPreset,
} from "./catalog.js";
import { detectPackageManager, installCommand, type PackageManager } from "./detect-pm.js";

export interface InstallOptions {
  preset?: InstallPreset;
  packages?: string[];
  yes?: boolean;
  cwd?: string;
  packageManager?: PackageManager;
  version?: string;
}

export interface InstallResult {
  packageManager: PackageManager;
  installed: string[];
  devInstalled: string[];
  peers: string[];
}

function getDefaultVersion(): string {
  // Prefer "latest" so mismatched local installer versions never pin
  // consumers to unpublished @rankmyseo/* ranges. Callers can still pass
  // an explicit --version / options.version for reproducible installs.
  return "latest";
}

function withVersion(name: string, versionRange: string): string {
  if (versionRange === "latest") return name;
  return `${name}@${versionRange}`;
}

function splitProdAndDev(packageNames: string[]): {
  prod: string[];
  dev: string[];
} {
  const prod: string[] = [];
  const dev: string[] = [];
  for (const name of packageNames) {
    const entry = PACKAGE_CATALOG.find((p) => p.name === name);
    if (entry?.tier === "tooling") dev.push(name);
    else prod.push(name);
  }
  return { prod, dev };
}

export async function promptPreset(): Promise<InstallPreset> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log(`
RankMySEO installer — pick a setup:

  1) Recommended  — core + storage + server-hono + react + cli (most apps)
  2) Full         — all @rankmyseo/* packages
  3) Custom       — choose packages yourself
`);

  try {
    const answer = (await rl.question("Enter 1, 2, or 3 [1]: ")).trim() || "1";
    if (answer === "2") return "full";
    if (answer === "3") return "custom";
    return "recommended";
  } finally {
    rl.close();
  }
}

export async function promptCustomSelection(): Promise<string[]> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log("\nAvailable packages:\n");
  PACKAGE_CATALOG.forEach((pkg, index) => {
    console.log(`  ${index + 1}) ${pkg.name}`);
    console.log(`     ${pkg.description}`);
  });
  console.log(
    "\nEnter numbers separated by commas (e.g. 1,2,6,8) or 'all' for everything:\n",
  );

  try {
    const answer = (await rl.question("Selection: ")).trim().toLowerCase();
    if (answer === "all") return PACKAGE_CATALOG.map((p) => p.name);

    const indices = answer
      .split(/[,\s]+/)
      .map((s) => Number.parseInt(s, 10))
      .filter((n) => !Number.isNaN(n) && n >= 1 && n <= PACKAGE_CATALOG.length);

    const selected = [...new Set(indices.map((i) => PACKAGE_CATALOG[i - 1]!.name))];
    if (selected.length === 0) {
      console.log("No valid selection — defaulting to @rankmyseo/core only.");
      return ["@rankmyseo/core"];
    }
    return selected;
  } finally {
    rl.close();
  }
}

export function runInstall(options: InstallOptions = {}): InstallResult {
  const cwd = options.cwd ?? process.cwd();
  const pm = options.packageManager ?? detectPackageManager(cwd);
  const versionRange = options.version ?? getDefaultVersion();

  let names: string[];
  if (options.packages?.length) {
    names = options.packages;
  } else if (options.preset === "custom") {
    throw new Error("Custom preset requires packages array or interactive prompt");
  } else {
    names = resolvePackageNames(options.preset ?? "recommended");
  }

  const { prod, dev } = splitProdAndDev(names);
  const peers = peersForPackages(names);

  const prodSpecs = prod.map((n) => withVersion(n, versionRange));
  const devSpecs = dev.map((n) => withVersion(n, versionRange));
  const peerSpecs = peers.map((p) => (p.includes("@") ? p : p));

  const { command, args } = installCommand(pm, [...prodSpecs, ...peerSpecs], devSpecs);

  console.log(`\nInstalling with ${pm}:\n`);
  for (const p of prodSpecs) console.log(`  + ${p}`);
  for (const p of peerSpecs) console.log(`  + ${p} (peer)`);
  for (const p of devSpecs) console.log(`  + ${p} (dev)`);
  console.log("");

  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: false });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with code ${result.status}`);
  }

  console.log("\nDone. Next steps:");
  console.log("  npx rankmyseo init          # scaffold rankmyseo.config.ts");
  console.log("  npx rankmyseo migrate       # run database migrations");
  console.log("  See https://github.com/madebyaris/rankmyseo/wiki/Getting-Started\n");

  return {
    packageManager: pm,
    installed: prodSpecs,
    devInstalled: devSpecs,
    peers: peerSpecs,
  };
}

export async function runInstallWizard(options: InstallOptions = {}): Promise<InstallResult> {
  let preset = options.preset;
  let packages = options.packages;

  if (!preset && !packages?.length && !options.yes) {
    preset = await promptPreset();
  } else if (!preset && !packages?.length) {
    preset = "recommended";
  }

  if (preset === "custom" && !packages?.length) {
    packages = await promptCustomSelection();
  }

  return runInstall({ ...options, preset, packages });
}
