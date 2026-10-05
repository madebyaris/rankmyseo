import type { RankMySeoConfig } from "@rankmyseo/core";

/**
 * Publisher discovery for a self-hosted RankMySEO API.
 *
 * - RFC 9727 API catalog: `GET /.well-known/api-catalog` (`application/linkset+json`)
 *   https://www.rfc-editor.org/rfc/rfc9727
 * - ARD v0.91 manifest: `GET /.well-known/ard.json`
 *   https://agenticresourcediscovery.org/spec/
 * - Predecessor path `GET /.well-known/ai-catalog.json` carries the same document.
 *   ARD says consumers may still read it; serving it keeps older clients working.
 *
 * The catalog describes this process's HTTP API. It does not advertise the hosted
 * rankmyseo.com MCP lobby.
 */

export function apiCatalogEnabled(config: RankMySeoConfig): boolean {
  return config.siteFeatures.apiCatalog !== false;
}

/** Origin plus mount prefix, with no trailing slash. */
export function publicBaseUrl(requestUrl: string, basePath: string): string {
  const origin = new URL(requestUrl).origin;
  return `${origin}${basePath}`;
}

/** Hostname segment safe for `urn:air:<publisher>:…`. */
export function ardPublisher(hostname: string): string {
  const cleaned = hostname.replace(/[^a-zA-Z0-9.-]/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "localhost";
}

function mountSlug(basePath: string): string {
  const slug = basePath.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "root";
}

export function discoveryLinkHeader(publicBase: string): string {
  return `<${publicBase}/.well-known/api-catalog>; rel="api-catalog", <${publicBase}/.well-known/ard.json>; rel="ard"`;
}

export function discoveryHeadLinks(basePath: string): string {
  const prefix = basePath || "";
  return `<link rel="api-catalog" href="${prefix}/.well-known/api-catalog"><link rel="ard" href="${prefix}/.well-known/ard.json">`;
}

export function applyDiscoveryLinks(response: Response, linkHeader: string): Response {
  const headers = new Headers(response.headers);
  const existing = headers.get("Link");
  headers.set("Link", existing ? `${existing}, ${linkHeader}` : linkHeader);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const API_ITEMS: Array<[title: string, path: string]> = [
  ["Keywords", "/keywords"],
  ["Rank snapshots", "/snapshots"],
  ["Audits", "/audits"],
  ["Live scan", "/scan"],
  ["Reports", "/reports"],
  ["Dashboard", "/dashboard"],
];

export function buildApiCatalog(publicBase: string, config: RankMySeoConfig) {
  const item = API_ITEMS.map(([title, path]) => ({
    href: `${publicBase}${path}`,
    title,
  }));
  if (config.siteFeatures.collector) {
    item.push({ href: `${publicBase}/collect`, title: "On-page collector" });
  }
  if (config.siteFeatures.blog) {
    item.push({ href: `${publicBase}/blog`, title: "Blog" });
  }

  const context: Record<string, unknown> = {
    anchor: `${publicBase}/`,
    item,
    "service-doc": [
      {
        href: `${publicBase}/api`,
        type: "text/markdown",
        title: "API guide",
      },
    ],
  };
  if (config.siteFeatures.llmsTxt) {
    context["service-desc"] = [
      {
        href: `${publicBase}/llms.txt`,
        type: "text/markdown",
        title: "LLM instructions",
      },
    ];
  }
  return { linkset: [context] };
}

export interface ArdEntry {
  identifier: string;
  displayName: string;
  type: string;
  description: string;
  representativeQueries: string[];
  capabilities: string[];
  url: string;
}

export function buildArdEntry(publicBase: string, basePath: string): ArdEntry {
  const publisher = ardPublisher(new URL(publicBase).hostname);
  return {
    identifier: `urn:air:${publisher}:rankmyseo:${mountSlug(basePath)}`,
    displayName: "RankMySEO API",
    type: "application/linkset+json",
    description:
      "Self-hosted RankMySEO HTTP API for keywords, rank snapshots, on-page audits, live scans, and reports.",
    representativeQueries: [
      "List the keywords tracked for this site.",
      "How have keyword positions changed over time?",
      "Audit this page and list the on-page issues.",
      "Build a rank report for this project.",
    ],
    capabilities: ["keywords", "rank-history", "on-page-audit", "live-scan", "reports"],
    url: `${publicBase}/.well-known/api-catalog`,
  };
}

export function buildArdManifest(
  publicBase: string,
  basePath: string,
  config: RankMySeoConfig,
) {
  const origin = new URL(publicBase).origin;
  return {
    specVersion: "1.0" as const,
    host: {
      displayName: config.llmsTxt?.projectName ?? "RankMySEO",
      identifier: origin,
      documentationUrl: `${publicBase}/api`,
    },
    entries: [buildArdEntry(publicBase, basePath)],
  };
}

export function ardEntryJsonLd(entry: ArdEntry): string {
  return JSON.stringify({
    "@context": "https://agenticresourcediscovery.org/context/v1",
    ...entry,
  }).replace(/</g, "\\u003c");
}

export function buildApiGuide(basePath: string): string {
  const prefix = basePath || "";
  return `# RankMySEO API

Self-hosted RankMySEO HTTP API. This document is the agent entry for the process that served it.

Discovery:

- API catalog (RFC 9727): ${prefix}/.well-known/api-catalog
- ARD manifest: ${prefix}/.well-known/ard.json
- Previous catalog path (same document): ${prefix}/.well-known/ai-catalog.json
- LLM instructions: ${prefix}/llms.txt

Scope headers \`x-tenant-id\` and \`x-project-id\` select the tenant and project. They do not authenticate the caller. Wire \`authorize\` on the handler for that. Both headers together replace the config default on pages that do not require them. One header alone leaves the default in place.

Data routes use those headers. These do not: \`GET /\`, \`GET /api\`, \`GET /llms.txt\`, \`GET /sitemap.xml\`, and the well-known documents above.

The catalog lists keywords, rank snapshots, audits, live scan (\`POST /scan\`), reports, and dashboard config. Blog and the on-page collector appear when those features are on. Rank numbers come from the configured datasource (fixture by default, or Google Search Console). This API does not include the hosted rankmyseo.com account, guest token, or paid SERP tools.

MCP for this toolkit is the stdio binary \`rankmyseo-mcp\`. It is not an HTTP route on this origin. Mutating MCP tools stay unregistered unless \`RANKMYSEO_MCP_ALLOW_MUTATIONS=1\`.

When this handler is mounted with \`basePath\`, these paths live under that prefix. Origin-root \`/.well-known/*\` applies when the handler is mounted at \`/\`, or when the host proxies that prefix to this handler.
`;
}
