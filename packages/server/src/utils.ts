import type { RankMySeoConfig, TenantScope } from "@rankmyseo/core";
import { apiError } from "./errors.js";

export interface RequestScope extends TenantScope {}

export function readScope(request: Request): RequestScope | Response {
  const tenantId = request.headers.get("x-tenant-id");
  const projectId = request.headers.get("x-project-id");

  if (!tenantId || !projectId) {
    return apiError("Missing or invalid x-tenant-id / x-project-id headers", 400, {
      code: "MISSING_SCOPE",
    });
  }

  return { tenantId, projectId };
}

export async function readJson<T>(request: Request): Promise<T | Response> {
  try {
    return (await request.json()) as T;
  } catch {
    return apiError("Invalid JSON body", 400, { code: "INVALID_JSON" });
  }
}

export function acceptsMarkdown(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/markdown");
}

export interface SiteFeatureContext {
  config: RankMySeoConfig;
  scope: TenantScope;
  pathname: string;
}

export function buildSitemapXml(routes: string[], baseUrl: string): string {
  const urls = routes
    .map(
      (route) =>
        `  <url><loc>${baseUrl}${route === "/" ? "" : route}</loc></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export function buildLlmsTxt(config: RankMySeoConfig, basePath = ""): string {
  const name = config.llmsTxt?.projectName ?? "RankMySEO Project";
  const summary =
    config.llmsTxt?.summary ??
    "SEO tracking, audits, and rank history for this site.";
  const links = config.llmsTxt?.links ?? [
    { title: "Documentation", url: "/docs.md" },
  ];

  const linkBlock = links.map((l) => `- [${l.title}](${l.url})`).join("\n");
  const discovery =
    config.siteFeatures.apiCatalog === false
      ? ""
      : `\n## Discovery\n\n- [API guide](${basePath}/api)\n- [API catalog](${basePath}/.well-known/api-catalog)\n- [ARD manifest](${basePath}/.well-known/ard.json)\n`;
  return `# ${name}\n\n> ${summary}\n\n## Resources\n\n${linkBlock}\n${discovery}`;
}

export function pageToMarkdown(pathname: string, title: string): string {
  return `# ${title}\n\nPath: \`${pathname}\`\n\nThis page is available as Markdown for AI agents.\n`;
}

export function withMarkdownNegotiation(
  request: Request,
  html: string,
  markdown: string,
  pathname: string,
): Response {
  const wantsMarkdown = acceptsMarkdown(request);
  const accept = request.headers.get("accept") ?? "";

  if (wantsMarkdown) {
    return new Response(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
        Link: `<${pathname}?format=html>; rel="alternate"; type="text/html"`,
      },
    });
  }

  if (accept && !accept.includes("*/*") && !accept.includes("text/html")) {
    const response = apiError("Not acceptable", 406, {
      code: "NOT_ACCEPTABLE",
      details: { supported: ["text/html", "text/markdown"] },
    });
    response.headers.set("Vary", "Accept");
    return response;
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      Vary: "Accept",
      Link: `<${pathname}>; rel="alternate"; type="text/markdown"`,
    },
  });
}
