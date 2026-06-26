import "server-only";

import { randomUUID } from "node:crypto";
import type { LanguageModel } from "ai";
import {
  buildAuditRecommendations,
  buildBlogRecommendations,
  buildReport,
  createAuditInputSchema,
  createBlogPostInputSchema,
  createKeywordInputSchema,
  createRankSnapshotInputSchema,
  dashboardConfigSchema,
  extractPageSignals,
  generateMeta,
  generateSchema,
  normalizeHttpUrl,
  pageSignalsSchema,
  projectSchema,
  runAuditChecks,
  schemaGeneratorInputSchema,
  slugify,
  snapshotRangeQuerySchema,
  updateBlogPostInputSchema,
  type RankMySeoConfig,
  type RankStore,
  type TenantScope,
} from "@rankmyseo/core";
import { streamAgentChat } from "@rankmyseo/agent";
import {
  buildLlmsTxt,
  buildSitemapXml,
  pageToMarkdown,
  readJson,
  withMarkdownNegotiation,
} from "./utils.js";

export interface RouteContext {
  store: RankStore;
  scope: TenantScope;
  config: RankMySeoConfig;
  agentModel?: LanguageModel;
}

type RouteHandler = (
  request: Request,
  ctx: RouteContext,
  params: Record<string, string>,
  url: URL,
) => Promise<Response>;

const routes: Array<{
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
}> = [];

function addRoute(
  method: string,
  pattern: RegExp,
  handler: RouteHandler,
): void {
  routes.push({ method, pattern, handler });
}

addRoute("GET", /^\/projects$/, async (_req, ctx) => {
  const data = await ctx.store.projects.list(ctx.scope);
  return Response.json({ data });
});

addRoute("POST", /^\/projects$/, async (request, ctx) => {
  const body = await readJson<unknown>(request);
  if (body instanceof Response) return body;
  const parsed = projectSchema
    .omit({ createdAt: true, updatedAt: true })
    .safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid project", details: parsed.error.flatten() }, { status: 400 });
  }
  const project = await ctx.store.projects.create({
    ...parsed.data,
    tenantId: ctx.scope.tenantId,
  });
  return Response.json({ data: project }, { status: 201 });
});

addRoute("GET", /^\/projects\/([^/]+)$/, async (_req, ctx, params) => {
  const project = await ctx.store.projects.getById(ctx.scope, params[1]!);
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ data: project });
});

addRoute("GET", /^\/keywords$/, async (_req, ctx) => {
  const data = await ctx.store.keywords.list(ctx.scope);
  return Response.json({ data });
});

addRoute("POST", /^\/keywords$/, async (request, ctx) => {
  const body = await readJson<unknown>(request);
  if (body instanceof Response) return body;
  const parsed = createKeywordInputSchema.safeParse({
    ...(body as Record<string, unknown>),
    tenantId: ctx.scope.tenantId,
    projectId: ctx.scope.projectId,
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid keyword", details: parsed.error.flatten() }, { status: 400 });
  }
  const keyword = await ctx.store.keywords.create(parsed.data);
  return Response.json({ data: keyword }, { status: 201 });
});

addRoute("GET", /^\/keywords\/([^/]+)$/, async (_req, ctx, params) => {
  const keyword = await ctx.store.keywords.getById(ctx.scope, params[1]!);
  if (!keyword) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ data: keyword });
});

addRoute("DELETE", /^\/keywords\/([^/]+)$/, async (_req, ctx, params) => {
  const deleted = await ctx.store.keywords.delete(ctx.scope, params[1]!);
  if (!deleted) return Response.json({ error: "Not found" }, { status: 404 });
  return new Response(null, { status: 204 });
});

addRoute("POST", /^\/snapshots$/, async (request, ctx) => {
  const body = await readJson<unknown>(request);
  if (body instanceof Response) return body;
  const parsed = createRankSnapshotInputSchema.safeParse({
    ...(body as Record<string, unknown>),
    tenantId: ctx.scope.tenantId,
    projectId: ctx.scope.projectId,
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid snapshot", details: parsed.error.flatten() }, { status: 400 });
  }
  const snapshot = await ctx.store.snapshots.append(parsed.data);
  return Response.json({ data: snapshot }, { status: 201 });
});

addRoute("GET", /^\/snapshots$/, async (_req, ctx, _params, url) => {
  const parsed = snapshotRangeQuerySchema.safeParse({
    tenantId: ctx.scope.tenantId,
    projectId: ctx.scope.projectId,
    keywordId: url.searchParams.get("keywordId") ?? undefined,
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = await ctx.store.snapshots.listByRange(parsed.data);
  return Response.json({ data });
});

addRoute("GET", /^\/audits$/, async (_req, ctx) => {
  const data = await ctx.store.audits.list(ctx.scope);
  return Response.json({ data });
});

addRoute("POST", /^\/audits$/, async (request, ctx) => {
  const body = await readJson<unknown>(request);
  if (body instanceof Response) return body;
  const parsed = createAuditInputSchema.safeParse({
    ...(body as Record<string, unknown>),
    tenantId: ctx.scope.tenantId,
    projectId: ctx.scope.projectId,
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid audit", details: parsed.error.flatten() }, { status: 400 });
  }
  const audit = await ctx.store.audits.create({
    ...parsed.data,
    id: randomUUID(),
  });
  return Response.json({ data: audit }, { status: 201 });
});

addRoute("GET", /^\/audits\/([^/]+)$/, async (_req, ctx, params) => {
  const audit = await ctx.store.audits.getById(ctx.scope, params[1]!);
  if (!audit) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ data: audit });
});

addRoute("POST", /^\/collect$/, async (request, ctx) => {
  if (!ctx.config.siteFeatures.collector) {
    return Response.json({ error: "Collector disabled" }, { status: 403 });
  }
  const body = await readJson<unknown>(request);
  if (body instanceof Response) return body;
  const parsed = pageSignalsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid signals", details: parsed.error.flatten() }, { status: 400 });
  }
  const { checks, score } = runAuditChecks(parsed.data);
  const audit = await ctx.store.audits.create({
    id: randomUUID(),
    tenantId: ctx.scope.tenantId,
    projectId: ctx.scope.projectId,
    url: parsed.data.url,
    score,
    checks,
  });
  return Response.json({ data: audit }, { status: 201 });
});

addRoute("POST", /^\/scan$/, async (request, ctx) => {
  const body = await readJson<{ url?: string }>(request);
  if (body instanceof Response) return body;

  let target: URL;
  try {
    target = normalizeHttpUrl(String(body.url ?? ""));
  } catch {
    return Response.json({ error: "A valid url is required" }, { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return Response.json({ error: "Only http(s) URLs can be scanned" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(target.toString(), {
      headers: { "user-agent": "RankMySEO-Scanner/1.0" },
      redirect: "follow",
    });
    if (!res.ok) {
      return Response.json(
        { error: `Fetch failed with status ${res.status}` },
        { status: 502 },
      );
    }
    html = await res.text();
  } catch {
    return Response.json({ error: "Could not fetch the target URL" }, { status: 502 });
  }

  const signals = extractPageSignals(html, target.toString());
  const { checks, score } = runAuditChecks(signals);
  const audit = await ctx.store.audits.create({
    id: randomUUID(),
    tenantId: ctx.scope.tenantId,
    projectId: ctx.scope.projectId,
    url: target.toString(),
    score,
    checks,
  });
  const recommendations = buildAuditRecommendations(checks);

  return Response.json(
    { data: { audit, signals, recommendations } },
    { status: 201 },
  );
});

addRoute("POST", /^\/meta\/generate$/, async (request, _ctx) => {
  const body = await readJson<{
    title?: string;
    content?: string;
    targetKeyword?: string;
    url?: string;
    siteName?: string;
  }>(request);
  if (body instanceof Response) return body;
  if (!body.title || !body.title.trim()) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const meta = generateMeta({
    title: body.title,
    content: body.content,
    targetKeyword: body.targetKeyword,
    url: body.url,
    siteName: body.siteName,
  });

  const { checks, score } = runAuditChecks({
    url: body.url && /^https?:\/\//.test(body.url) ? body.url : "https://example.com",
    title: meta.metaTitle,
    metaDescription: meta.metaDescription,
    canonical: meta.canonical && /^https?:\/\//.test(meta.canonical) ? meta.canonical : null,
    h1Count: 1,
    hasOgTags: true,
    hasJsonLd: true,
  });

  return Response.json({ data: { meta, checks, score } });
});

addRoute("POST", /^\/schema\/generate$/, async (request, _ctx) => {
  const body = await readJson<unknown>(request);
  if (body instanceof Response) return body;

  const parsed = schemaGeneratorInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid schema input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const schema = generateSchema(parsed.data);
  return Response.json({ data: { schema } });
});

function blogDisabled(ctx: RouteContext): Response | null {
  if (!ctx.config.siteFeatures.blog) {
    return Response.json({ error: "Blog module disabled" }, { status: 403 });
  }
  return null;
}

addRoute("GET", /^\/blog$/, async (_req, ctx) => {
  const denied = blogDisabled(ctx);
  if (denied) return denied;
  const data = await ctx.store.blog.list(ctx.scope);
  return Response.json({ data });
});

addRoute("POST", /^\/blog$/, async (request, ctx) => {
  const denied = blogDisabled(ctx);
  if (denied) return denied;
  const body = await readJson<Record<string, unknown>>(request);
  if (body instanceof Response) return body;
  const parsed = createBlogPostInputSchema.safeParse({
    ...body,
    tenantId: ctx.scope.tenantId,
    projectId: ctx.scope.projectId,
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid blog post", details: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const slug = input.slug?.trim() || slugify(input.title);
  let { metaTitle, metaDescription } = input;
  if (!metaTitle.trim() || !metaDescription.trim()) {
    const meta = generateMeta({
      title: input.title,
      content: input.content,
      targetKeyword: input.targetKeyword,
    });
    metaTitle = metaTitle.trim() || meta.metaTitle;
    metaDescription = metaDescription.trim() || meta.metaDescription;
  }

  const post = await ctx.store.blog.create({
    id: randomUUID(),
    tenantId: ctx.scope.tenantId,
    projectId: ctx.scope.projectId,
    title: input.title,
    slug,
    content: input.content,
    targetKeyword: input.targetKeyword,
    intent: input.intent,
    metaTitle,
    metaDescription,
    status: input.status,
  });
  return Response.json({ data: post }, { status: 201 });
});

addRoute("GET", /^\/blog\/([^/]+)$/, async (_req, ctx, params) => {
  const denied = blogDisabled(ctx);
  if (denied) return denied;
  const post = await ctx.store.blog.getById(ctx.scope, params[1]!);
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  const recommendations = buildBlogRecommendations({
    intent: post.intent,
    targetKeyword: post.targetKeyword,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    content: post.content,
  });
  return Response.json({ data: post, recommendations });
});

addRoute("PUT", /^\/blog\/([^/]+)$/, async (request, ctx, params) => {
  const denied = blogDisabled(ctx);
  if (denied) return denied;
  const body = await readJson<Record<string, unknown>>(request);
  if (body instanceof Response) return body;
  const parsed = updateBlogPostInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid blog post", details: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await ctx.store.blog.update(ctx.scope, params[1]!, parsed.data);
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ data: updated });
});

addRoute("DELETE", /^\/blog\/([^/]+)$/, async (_req, ctx, params) => {
  const denied = blogDisabled(ctx);
  if (denied) return denied;
  const deleted = await ctx.store.blog.delete(ctx.scope, params[1]!);
  if (!deleted) return Response.json({ error: "Not found" }, { status: 404 });
  return new Response(null, { status: 204 });
});

addRoute("GET", /^\/reports$/, async (_req, ctx) => {
  const data = await ctx.store.reports.list(ctx.scope);
  return Response.json({ data });
});

addRoute("POST", /^\/reports$/, async (request, ctx) => {
  const body = await readJson<Record<string, unknown>>(request);
  if (body instanceof Response) return body;
  const from = new Date(String(body.from));
  const to = new Date(String(body.to));
  const title = String(body.title ?? "Report");
  const keywords = await ctx.store.keywords.list(ctx.scope);
  const snapshots = await ctx.store.snapshots.listByRange({
    tenantId: ctx.scope.tenantId,
    projectId: ctx.scope.projectId,
    from,
    to,
  });
  const audits = await ctx.store.audits.list(ctx.scope);
  const reportData = buildReport({
    tenantId: ctx.scope.tenantId,
    projectId: ctx.scope.projectId,
    title,
    from,
    to,
    keywords,
    snapshots,
    audits,
  });
  const report = await ctx.store.reports.create(reportData);
  return Response.json({ data: report }, { status: 201 });
});

addRoute("GET", /^\/reports\/([^/]+)$/, async (_req, ctx, params) => {
  const report = await ctx.store.reports.getById(ctx.scope, params[1]!);
  if (!report) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ data: report });
});

addRoute("GET", /^\/dashboard$/, async (_req, ctx) => {
  const config = await ctx.store.dashboard.get(ctx.scope);
  return Response.json({ data: config ?? null });
});

addRoute("PUT", /^\/dashboard$/, async (request, ctx) => {
  const body = await readJson<unknown>(request);
  if (body instanceof Response) return body;
  const existing = await ctx.store.dashboard.get(ctx.scope);
  const parsed = dashboardConfigSchema.safeParse({
    ...(body as Record<string, unknown>),
    id: existing?.id ?? randomUUID(),
    tenantId: ctx.scope.tenantId,
    projectId: ctx.scope.projectId,
    updatedAt: new Date(),
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid dashboard", details: parsed.error.flatten() }, { status: 400 });
  }
  const saved = await ctx.store.dashboard.upsert(parsed.data);
  return Response.json({ data: saved });
});

addRoute("POST", /^\/agent\/chat$/, async (request, ctx) => {
  if (!ctx.agentModel) {
    return Response.json({ error: "Agent model not configured" }, { status: 503 });
  }
  const body = await readJson<{ messages?: Array<{ role: "user" | "assistant" | "system"; content: string }> }>(request);
  if (body instanceof Response) return body;
  const result = await streamAgentChat({
    store: ctx.store,
    scope: ctx.scope,
    model: ctx.agentModel,
    messages: body.messages ?? [],
  });
  return result.toTextStreamResponse();
});

addRoute("GET", /^\/sitemap\.xml$/, async (_req, ctx) => {
  if (!ctx.config.siteFeatures.sitemap) {
    return Response.json({ error: "Sitemap disabled" }, { status: 404 });
  }
  const projects = await ctx.store.projects.list(ctx.scope);
  const domain = projects[0]?.domain ?? "example.com";
  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
  const xml = buildSitemapXml(ctx.config.sitemapRoutes, baseUrl);
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
});

addRoute("GET", /^\/llms\.txt$/, async (_req, ctx) => {
  if (!ctx.config.siteFeatures.llmsTxt) {
    return Response.json({ error: "llms.txt disabled" }, { status: 404 });
  }
  const text = buildLlmsTxt(ctx.config);
  return new Response(text, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
});

addRoute("GET", /^\/$/, async (request, ctx, _params, url) => {
  if (!ctx.config.siteFeatures.markdownNegotiation) {
    return Response.json({ ok: true, service: "rankmyseo" });
  }
  const html = `<!DOCTYPE html><html><head><title>RankMySEO</title></head><body><h1>RankMySEO</h1><p>SEO toolkit API</p></body></html>`;
  const md = pageToMarkdown(url.pathname, "RankMySEO");
  return withMarkdownNegotiation(request, html, md, url.pathname);
});

export async function dispatchRoute(
  request: Request,
  ctx: RouteContext,
): Promise<Response | null> {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  for (const route of routes) {
    if (route.method !== method) continue;
    const match = pathname.match(route.pattern);
    if (!match) continue;
    const params: Record<string, string> = {};
    match.slice(1).forEach((value, index) => {
      params[String(index + 1)] = value;
    });
    return route.handler(request, ctx, params, url);
  }

  return null;
}
