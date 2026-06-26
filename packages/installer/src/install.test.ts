import { describe, it, expect } from "vitest";
import {
  PACKAGE_CATALOG,
  PRESET_RECOMMENDED,
  peersForPackages,
  resolvePackageNames,
} from "./catalog.js";
import { detectPackageManager, installCommand } from "./detect-pm.js";

describe("catalog", () => {
  it("recommended preset includes core backend + hono + react", () => {
    expect(PRESET_RECOMMENDED).toContain("@rankmyseo/core");
    expect(PRESET_RECOMMENDED).toContain("@rankmyseo/server-hono");
    expect(PRESET_RECOMMENDED).toContain("@rankmyseo/react");
  });

  it("full preset lists every catalog package", () => {
    expect(resolvePackageNames("full")).toHaveLength(PACKAGE_CATALOG.length);
  });

  it("collects peer deps for server-hono and ui", () => {
    const peers = peersForPackages(["@rankmyseo/server-hono", "@rankmyseo/ui"]);
    expect(peers.some((p) => p.startsWith("hono@"))).toBe(true);
    expect(peers.some((p) => p.startsWith("react@"))).toBe(true);
  });
});

describe("detectPackageManager", () => {
  it("defaults to npm without lockfiles when not invoked via another PM", () => {
    const prev = process.env.npm_config_user_agent;
    delete process.env.npm_config_user_agent;
    try {
      expect(detectPackageManager("/tmp/nonexistent-rankmyseo-path")).toBe("npm");
    } finally {
      if (prev === undefined) delete process.env.npm_config_user_agent;
      else process.env.npm_config_user_agent = prev;
    }
  });
});

describe("installCommand", () => {
  it("builds npm install with prod and dev packages", () => {
    const { command, args } = installCommand(
      "npm",
      ["@rankmyseo/core@^0.2.0"],
      ["@rankmyseo/cli@^0.2.0"],
    );
    expect(command).toBe("npm");
    expect(args).toEqual([
      "install",
      "@rankmyseo/core@^0.2.0",
      "--save-dev",
      "@rankmyseo/cli@^0.2.0",
    ]);
  });

  it("builds pnpm add with -D for dev packages", () => {
    const { command, args } = installCommand("pnpm", ["@rankmyseo/core"], ["@rankmyseo/cli"]);
    expect(command).toBe("pnpm");
    expect(args).toEqual(["add", "@rankmyseo/core", "-D", "@rankmyseo/cli"]);
  });
});
