import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/schemas/index.ts", "src/testing/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: ["vitest"],
});
