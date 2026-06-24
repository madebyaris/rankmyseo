/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "backend-not-in-client-tier",
      comment:
        "Backend packages (@rankmyseo/storage, @rankmyseo/server) must not be imported from future client-tier packages.",
      severity: "error",
      from: {
        path: "^packages/(react|vue|svelte|ui)",
      },
      to: {
        path: "^packages/(storage|server|agent|datasource|scheduler|cli)",
      },
    },
    {
      name: "ui-only-via-react",
      comment: "@rankmyseo/ui must not import backend packages directly.",
      severity: "error",
      from: {
        path: "^packages/ui",
      },
      to: {
        path: "^packages/(storage|server|agent|datasource|scheduler|cli)",
      },
    },
    {
      name: "core-stays-framework-free",
      comment: "@rankmyseo/core must not depend on storage, server, or frameworks.",
      severity: "error",
      from: {
        path: "^packages/core",
      },
      to: {
        path: "^packages/(storage|server|server-hono|agent|datasource|scheduler|cli)|^hono$|^drizzle-orm",
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
