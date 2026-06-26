import { existsSync } from "node:fs";
import { join } from "node:path";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export function detectPackageManager(cwd = process.cwd()): PackageManager {
  const ua = process.env.npm_config_user_agent ?? "";
  if (ua.startsWith("pnpm/")) return "pnpm";
  if (ua.startsWith("yarn/")) return "yarn";
  if (ua.startsWith("bun/")) return "bun";

  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(join(cwd, "bun.lock")) || existsSync(join(cwd, "bun.lockb"))) {
    return "bun";
  }
  if (existsSync(join(cwd, "package-lock.json"))) return "npm";

  return "npm";
}

export function installCommand(
  pm: PackageManager,
  packages: string[],
  devPackages: string[],
): { command: string; args: string[] } {
  const prodArgs = packages.flatMap((p) => (pm === "yarn" ? ["add", p] : ["install", p]));
  const devArgs =
    devPackages.length === 0
      ? []
      : pm === "npm"
        ? ["install", "--save-dev", ...devPackages]
        : pm === "yarn"
          ? ["add", "--dev", ...devPackages]
          : pm === "pnpm"
            ? ["add", "-D", ...devPackages]
            : ["add", "--dev", ...devPackages];

  if (pm === "npm") {
    const args = ["install", ...packages];
    if (devPackages.length) args.push("--save-dev", ...devPackages);
    return { command: "npm", args };
  }
  if (pm === "pnpm") {
    const args = ["add", ...packages];
    if (devPackages.length) args.push("-D", ...devPackages);
    return { command: "pnpm", args };
  }
  if (pm === "yarn") {
    const args = ["add", ...packages];
    if (devPackages.length) args.push("-D", ...devPackages);
    return { command: "yarn", args };
  }
  // bun
  const args = ["add", ...packages];
  if (devPackages.length) args.push("--dev", ...devPackages);
  return { command: "bun", args };
}
