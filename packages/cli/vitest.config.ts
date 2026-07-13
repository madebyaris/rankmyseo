import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.integration.test.ts"],
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "test/server-only.mock.ts"),
    },
  },
});
