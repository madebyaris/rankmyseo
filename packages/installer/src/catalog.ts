export interface RankPackage {
  name: string;
  description: string;
  tier: "backend" | "frontend" | "tooling";
  peers?: string[];
}

/** All publishable @rankmyseo/* packages (excluding the meta `rankmyseo` installer). */
export const PACKAGE_CATALOG: RankPackage[] = [
  {
    name: "@rankmyseo/core",
    description: "Domain models, audit engine, ports (required for most setups)",
    tier: "backend",
  },
  {
    name: "@rankmyseo/storage",
    description: "SQLite/Drizzle storage adapter",
    tier: "backend",
  },
  {
    name: "@rankmyseo/datasource",
    description: "GSC, PageSpeed Insights, fixture data sources",
    tier: "backend",
  },
  {
    name: "@rankmyseo/scheduler",
    description: "Cron-based rank ingestion scheduler",
    tier: "backend",
  },
  {
    name: "@rankmyseo/server",
    description: "Framework-agnostic HTTP handler",
    tier: "backend",
  },
  {
    name: "@rankmyseo/server-hono",
    description: "Hono adapter (recommended server entry)",
    tier: "backend",
    peers: ["hono@^4.0.0"],
  },
  {
    name: "@rankmyseo/agent",
    description: "AI agent tools + MCP server",
    tier: "backend",
  },
  {
    name: "@rankmyseo/react",
    description: "Headless React hooks + on-page collector",
    tier: "frontend",
    peers: ["react@^18.0.0 || ^19.0.0"],
  },
  {
    name: "@rankmyseo/ui",
    description: "Prebuilt dashboard widgets",
    tier: "frontend",
    peers: ["react@^18.0.0 || ^19.0.0", "react-dom@^18.0.0 || ^19.0.0"],
  },
  {
    name: "@rankmyseo/cli",
    description: "CLI — init config, migrate, schedule",
    tier: "tooling",
  },
];

export const PRESET_RECOMMENDED = [
  "@rankmyseo/core",
  "@rankmyseo/storage",
  "@rankmyseo/server-hono",
  "@rankmyseo/react",
  "@rankmyseo/cli",
] as const;

export const PRESET_FULL = PACKAGE_CATALOG.map((p) => p.name);

export type InstallPreset = "recommended" | "full" | "custom";

export function resolvePackageNames(
  preset: InstallPreset,
  customSelection?: string[],
): string[] {
  if (preset === "recommended") return [...PRESET_RECOMMENDED];
  if (preset === "full") return [...PRESET_FULL];
  return customSelection ?? [];
}

export function peersForPackages(packageNames: string[]): string[] {
  const peers = new Set<string>();
  for (const name of packageNames) {
    const entry = PACKAGE_CATALOG.find((p) => p.name === name);
    for (const peer of entry?.peers ?? []) peers.add(peer);
  }
  return [...peers];
}
