import { defineConfig } from "astro/config";

/** Static docs site — client demo runs at build time with a mocked fetch. */
export default defineConfig({
  site: "https://github.com/madebyaris/rankmyseo",
  output: "static",
});
