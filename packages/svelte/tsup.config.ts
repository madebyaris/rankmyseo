import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    "svelte",
    "svelte/store",
    "@rankmyseo/client",
    "@rankmyseo/collector",
    "@rankmyseo/core",
    "@rankmyseo/core/schemas",
  ],
});
