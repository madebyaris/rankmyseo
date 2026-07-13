#!/usr/bin/env node
import { runInstallWizard } from "@rankmyseo/installer";

const [, , command, ...args] = process.argv;

function parseFlag(name: string): boolean {
  return args.includes(name);
}

function parseOption(name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

async function forwardToCli(forwardArgs: string[]) {
  try {
    const cli = await import("@rankmyseo/cli");
    if (typeof cli.runCli === "function") {
      await cli.runCli(forwardArgs);
      return;
    }
  } catch {
    // fall through
  }
  console.error(
    "This command requires @rankmyseo/cli.\n" +
      "Install it with: npm i -D @rankmyseo/cli\n" +
      "Or run: npx rankmyseo install --preset recommended\n",
  );
  process.exit(1);
}

async function main() {
  const cmd = command ?? "install";

  if (cmd === "install" || cmd === "i") {
    const presetRaw = parseOption("--preset");
    const preset =
      presetRaw === "recommended" || presetRaw === "full" || presetRaw === "custom"
        ? presetRaw
        : undefined;
    const packagesRaw = parseOption("--packages");
    const packages = packagesRaw
      ? packagesRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    await runInstallWizard({
      preset,
      packages,
      yes: parseFlag("--yes") || parseFlag("-y"),
    });
    return;
  }

  if (cmd === "init" || cmd === "migrate" || cmd === "schedule" || cmd === "doctor" || cmd === "version") {
    await forwardToCli([cmd, ...args]);
    return;
  }

  if (cmd === "help" || cmd === "--help" || cmd === "-h") {
    printHelp();
    return;
  }

  console.log(`Unknown command: ${cmd}\n`);
  printHelp();
  process.exit(1);
}

function printHelp() {
  console.log(`RankMySEO

Install (pick recommended, full, or custom packages):
  npx rankmyseo                    Interactive install
  npx rankmyseo install --preset recommended
  npx rankmyseo install --preset full
  npx rankmyseo install --packages @rankmyseo/core,@rankmyseo/react

Project setup (requires @rankmyseo/cli — included in recommended preset):
  npx rankmyseo init [path]
  npx rankmyseo migrate [dbUrl]
  npx rankmyseo schedule [dbUrl]
  npx rankmyseo doctor [--config path]
  npx rankmyseo version

Docs: https://github.com/madebyaris/rankmyseo/wiki/Getting-Started
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
