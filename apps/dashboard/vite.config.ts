import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const repoRoot = path.resolve(__dirname, "../..");
const appNodeModules = path.resolve(__dirname, "node_modules");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "@rankmyseo/core/schemas$", replacement: path.join(repoRoot, "packages/core/src/schemas/index.ts") },
      { find: "@rankmyseo/react$", replacement: path.join(repoRoot, "packages/react/src/index.ts") },
      { find: "@rankmyseo/ui$", replacement: path.join(repoRoot, "packages/ui/src/index.ts") },
      { find: "react", replacement: path.join(appNodeModules, "react") },
      { find: "react-dom", replacement: path.join(appNodeModules, "react-dom") },
    ],
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 5173,
    proxy: {
      "/keywords": "http://localhost:3456",
      "/snapshots": "http://localhost:3456",
      "/audits": "http://localhost:3456",
      "/reports": "http://localhost:3456",
      "/dashboard": "http://localhost:3456",
      "/collect": "http://localhost:3456",
      "/agent": "http://localhost:3456",
      "/scan": "http://localhost:3456",
      "/meta": "http://localhost:3456",
      "/blog": "http://localhost:3456",
    },
  },
});
