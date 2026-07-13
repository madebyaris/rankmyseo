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
      "packages/server-express",
      "packages/server-next",
      "packages/server-nitro",
      "packages/storage",
      "examples/sveltekit-adapter",
      "examples/astro-adapter",
      "packages/agent",
      "packages/datasource",
      "packages/scheduler",
      "packages/scanner",
      "packages/client",
      "packages/collector",
      "packages/react",
      "packages/vue",
      "packages/svelte",
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
