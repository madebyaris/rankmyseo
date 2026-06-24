import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
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
