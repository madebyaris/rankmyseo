import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Delegate to per-package configs so happy-dom / server-only aliases are preserved.
    projects: [
      "packages/core",
      "packages/cli",
      "packages/installer",
      "packages/server",
      "packages/server-hono",
      "packages/storage",
      "packages/agent",
      "packages/datasource",
      "packages/scheduler",
      "packages/scanner",
      "packages/react",
      "packages/ui",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["packages/*/src/**/*.ts", "packages/*/src/**/*.tsx"],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/dist/**"],
    },
  },
});
