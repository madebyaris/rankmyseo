/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "backend-not-in-client-tier",
      comment:
        "Backend packages must not be imported from client-tier packages (react/vue/svelte/ui/client/collector).",
      severity: "error",
      from: {
        path: "^packages/(react|vue|svelte|ui|client|collector)(/|$)",
      },
      to: {
        path: "^packages/(storage|server|server-hono|server-express|server-next|server-nitro|agent|datasource|scheduler|scanner|cli)(/|$)",
      },
    },
    {
      name: "ui-only-via-react",
      comment: "@rankmyseo/ui must not import backend packages directly.",
      severity: "error",
      from: {
        path: "^packages/ui(/|$)",
      },
      to: {
        path: "^packages/(storage|server|server-hono|server-express|server-next|server-nitro|agent|datasource|scheduler|scanner|cli)(/|$)",
      },
    },
    {
      name: "client-no-backend",
      comment:
        "@rankmyseo/client must not import backend or framework UI packages.",
      severity: "error",
      from: {
        path: "^packages/client(/|$)",
      },
      to: {
        path: "^packages/(storage|server|server-hono|server-express|server-next|server-nitro|agent|datasource|scheduler|scanner|cli|react|vue|svelte|ui|collector)(/|$)",
      },
    },
    {
      name: "core-stays-framework-free",
      comment: "@rankmyseo/core must not depend on storage, server, or frameworks.",
      severity: "error",
      from: {
        path: "^packages/core(/|$)",
      },
      to: {
        path: "^packages/(storage|server|server-hono|server-express|server-next|server-nitro|agent|datasource|scheduler|scanner|cli|client|collector|react|vue|svelte|ui)(/|$)|^hono$|^express$|^drizzle-orm",
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};
