import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts", "src/tool-schemas.ts", "src/json-schema.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
  },
  {
    entry: { "bin/mcp": "src/bin/mcp.ts" },
    format: ["esm"],
    dts: false,
    clean: false,
    sourcemap: true,
    banner: { js: "#!/usr/bin/env node" },
  },
]);
