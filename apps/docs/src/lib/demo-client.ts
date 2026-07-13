import { createRankMySeoClient } from "@rankmyseo/client";

/** Deterministic fixture used by the docs client demo (no live API). */
export const DEMO_KEYWORDS = [
  {
    id: "kw-demo-1",
    tenantId: "demo-tenant",
    projectId: "demo-project",
    text: "rankmyseo",
    country: "us",
    device: "desktop" as const,
    tags: ["docs"],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "kw-demo-2",
    tenantId: "demo-tenant",
    projectId: "demo-project",
    text: "seo toolkit",
    country: "us",
    device: "mobile" as const,
    tags: ["docs"],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

/**
 * Builds a RankMySEO client that never hits the network.
 * Used at build time in Astro frontmatter to dogfood `@rankmyseo/client`.
 */
export function createDemoClient() {
  return createRankMySeoClient({
    baseUrl: "https://example.invalid/api/rankmyseo",
    tenantId: "demo-tenant",
    projectId: "demo-project",
    fetchImpl: async (input) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.includes("/keywords") && !url.match(/\/keywords\/[^/]+$/)) {
        return new Response(JSON.stringify({ data: DEMO_KEYWORDS }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "not mocked", code: "NOT_FOUND" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    },
  });
}
