import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { defineConfig } from "@rankmyseo/core";
import { createSqliteStore } from "@rankmyseo/storage";
import { createHandler } from "./handler.js";

const scopeHeaders = {
  "x-tenant-id": "tenant-a",
  "x-project-id": "project-1",
  "content-type": "application/json",
};

describe("createHandler routes", () => {
  let handler: ReturnType<typeof createHandler>;

  beforeEach(async () => {
    const store = createSqliteStore(":memory:");
    await store.projects.create({
      id: "project-1",
      tenantId: "tenant-a",
      name: "Demo",
      domain: "example.com",
    });
    handler = createHandler(store, {
      config: defineConfig({
        databaseUrl: "sqlite://:memory:",
        tenantId: "tenant-a",
        projectId: "project-1",
        dataSources: [{ provider: "fixture", default: true }],
        schedule: { cron: "0 6 * * *", enabled: false },
        siteFeatures: {
          sitemap: true,
          llmsTxt: true,
          collector: true,
          markdownNegotiation: true,
          blog: true,
        },
        sitemapRoutes: ["/", "/about"],
        llmsTxt: {
          projectName: "Example",
          summary: "Demo site",
          links: [{ title: "About", url: "/about.md" }],
        },
      }),
    });
  });

  it("creates audit via POST /audits", async () => {
    const res = await handler(
      new Request("http://localhost/audits", {
        method: "POST",
        headers: scopeHeaders,
        body: JSON.stringify({
          url: "https://example.com",
          score: 80,
          checks: [],
        }),
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { score: number } };
    expect(body.data.score).toBe(80);
  });

  it("scores page via POST /collect", async () => {
    const res = await handler(
      new Request("http://localhost/collect", {
        method: "POST",
        headers: scopeHeaders,
        body: JSON.stringify({
          url: "https://example.com",
          title: "Best SEO Tools for Developers in 2026 Guide",
          metaDescription:
            "A comprehensive guide to the best SEO tools for developers covering rank tracking audits reports and more for teams.",
          h1Count: 1,
          hasOgTags: true,
          hasJsonLd: true,
        }),
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { score: number; checks: unknown[] } };
    expect(body.data.checks.length).toBeGreaterThan(0);
    expect(body.data.score).toBeGreaterThan(0);
  });

  it("serves sitemap.xml", async () => {
    const res = await handler(new Request("http://localhost/sitemap.xml"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("xml");
    const text = await res.text();
    expect(text).toContain("<urlset");
    expect(text).toContain("example.com");
  });

  it("serves llms.txt", async () => {
    const res = await handler(new Request("http://localhost/llms.txt"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("# Example");
    expect(text).toContain("About");
  });

  it("negotiates markdown on GET /", async () => {
    const mdRes = await handler(
      new Request("http://localhost/", {
        headers: { accept: "text/markdown" },
      }),
    );
    expect(mdRes.status).toBe(200);
    expect(mdRes.headers.get("content-type")).toContain("markdown");
    expect(await mdRes.text()).toContain("# RankMySEO");

    const htmlRes = await handler(
      new Request("http://localhost/", {
        headers: { accept: "text/html" },
      }),
    );
    expect(htmlRes.status).toBe(200);
    expect(await htmlRes.text()).toContain("<html");
  });

  it("creates report via POST /reports", async () => {
    const res = await handler(
      new Request("http://localhost/reports", {
        method: "POST",
        headers: scopeHeaders,
        body: JSON.stringify({
          title: "Weekly",
          from: "2026-06-01T00:00:00.000Z",
          to: "2026-06-07T00:00:00.000Z",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { title: string } };
    expect(body.data.title).toBe("Weekly");
  });

  it("generates meta via POST /meta/generate", async () => {
    const res = await handler(
      new Request("http://localhost/meta/generate", {
        method: "POST",
        headers: scopeHeaders,
        body: JSON.stringify({
          title: "How to choose the best SEO tools for small teams",
          content:
            "This guide compares the best SEO tools for small teams covering rank tracking, audits, and reporting.",
          targetKeyword: "best seo tools",
          url: "https://example.com/best-seo-tools",
          siteName: "RankMySEO",
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { meta: { metaTitle: string; slug: string; html: string }; score: number };
    };
    expect(body.data.meta.metaTitle.length).toBeLessThanOrEqual(60);
    expect(body.data.meta.slug).toBe("best-seo-tools");
    expect(body.data.meta.html).toContain("<title>");
    expect(body.data.score).toBeGreaterThan(0);
  });

  it("generates schema via POST /schema/generate", async () => {
    const res = await handler(
      new Request("http://localhost/schema/generate", {
        method: "POST",
        headers: scopeHeaders,
        body: JSON.stringify({
          type: "FAQPage",
          questions: [
            { question: "What is RankMySEO?", answer: "An SEO toolkit." },
          ],
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { schema: { type: string; jsonLd: Record<string, unknown>; html: string } };
    };
    expect(body.data.schema.type).toBe("FAQPage");
    expect(body.data.schema.jsonLd["@type"]).toBe("FAQPage");
    expect(body.data.schema.html).toContain("application/ld+json");
  });

  it("returns 400 for invalid POST /schema/generate body", async () => {
    const res = await handler(
      new Request("http://localhost/schema/generate", {
        method: "POST",
        headers: scopeHeaders,
        body: JSON.stringify({ type: "Recipe", name: "Bad" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects POST /scan with an empty url", async () => {
    const res = await handler(
      new Request("http://localhost/scan", {
        method: "POST",
        headers: scopeHeaders,
        body: JSON.stringify({ url: "   " }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("accepts POST /scan without a scheme and normalizes to https", async () => {
    const res = await handler(
      new Request("http://localhost/scan", {
        method: "POST",
        headers: scopeHeaders,
        body: JSON.stringify({ url: "example.com" }),
      }),
    );
    expect(res.status).not.toBe(400);
  });

  it("runs blog CRUD with auto meta + recommendations", async () => {
    const createRes = await handler(
      new Request("http://localhost/blog", {
        method: "POST",
        headers: scopeHeaders,
        body: JSON.stringify({
          title: "Best rank tracking tools",
          content: "A look at rank tracking options for teams.",
          targetKeyword: "rank tracking tools",
          intent: "commercial",
        }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as {
      data: { id: string; slug: string; metaTitle: string; intent: string };
    };
    expect(created.data.slug).toBe("best-rank-tracking-tools");
    expect(created.data.metaTitle.length).toBeGreaterThan(0);
    expect(created.data.intent).toBe("commercial");

    const getRes = await handler(
      new Request(`http://localhost/blog/${created.data.id}`, { headers: scopeHeaders }),
    );
    expect(getRes.status).toBe(200);
    const got = (await getRes.json()) as {
      data: { id: string };
      recommendations: Array<{ id: string }>;
    };
    expect(got.recommendations.some((r) => r.id === "blog:intent-commercial")).toBe(true);

    const putRes = await handler(
      new Request(`http://localhost/blog/${created.data.id}`, {
        method: "PUT",
        headers: scopeHeaders,
        body: JSON.stringify({ status: "published" }),
      }),
    );
    expect(putRes.status).toBe(200);
    const updated = (await putRes.json()) as { data: { status: string } };
    expect(updated.data.status).toBe("published");

    const listRes = await handler(
      new Request("http://localhost/blog", { headers: scopeHeaders }),
    );
    const list = (await listRes.json()) as { data: unknown[] };
    expect(list.data).toHaveLength(1);

    const delRes = await handler(
      new Request(`http://localhost/blog/${created.data.id}`, {
        method: "DELETE",
        headers: scopeHeaders,
      }),
    );
    expect(delRes.status).toBe(204);
  });

  it("upserts dashboard via PUT /dashboard", async () => {
    const res = await handler(
      new Request("http://localhost/dashboard", {
        method: "PUT",
        headers: scopeHeaders,
        body: JSON.stringify({
          widgets: [
            {
              id: randomUUID(),
              type: "KeywordTable",
              title: "Keywords",
              query: {},
              options: {},
            },
          ],
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { widgets: unknown[] } };
    expect(body.data.widgets).toHaveLength(1);
  });

  it("returns 400 when scoped route lacks headers", async () => {
    const res = await handler(new Request("http://localhost/keywords"));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; code?: string };
    expect(body.error).toMatch(/x-tenant-id/i);
    expect(body.code).toBe("MISSING_SCOPE");
  });

  it("returns 403 when collector is disabled", async () => {
    const store = createSqliteStore(":memory:");
    await store.projects.create({
      id: "project-1",
      tenantId: "tenant-a",
      name: "Demo",
      domain: "example.com",
    });
    const disabledHandler = createHandler(store, {
      config: defineConfig({
        databaseUrl: "sqlite://:memory:",
        tenantId: "tenant-a",
        projectId: "project-1",
        dataSources: [{ provider: "fixture", default: true }],
        schedule: { cron: "0 6 * * *", enabled: false },
        siteFeatures: {
          sitemap: true,
          llmsTxt: true,
          collector: false,
          markdownNegotiation: true,
          blog: false,
        },
      }),
    });

    const res = await disabledHandler(
      new Request("http://localhost/collect", {
        method: "POST",
        headers: scopeHeaders,
        body: JSON.stringify({ url: "https://example.com", h1Count: 1 }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 when sitemap feature is disabled", async () => {
    const store = createSqliteStore(":memory:");
    await store.projects.create({
      id: "project-1",
      tenantId: "tenant-a",
      name: "Demo",
      domain: "example.com",
    });
    const disabledHandler = createHandler(store, {
      config: defineConfig({
        databaseUrl: "sqlite://:memory:",
        tenantId: "tenant-a",
        projectId: "project-1",
        dataSources: [{ provider: "fixture", default: true }],
        schedule: { cron: "0 6 * * *", enabled: false },
        siteFeatures: {
          sitemap: false,
          llmsTxt: true,
          collector: true,
          markdownNegotiation: true,
          blog: false,
        },
      }),
    });

    const res = await disabledHandler(new Request("http://localhost/sitemap.xml"));
    expect(res.status).toBe(404);
  });

  it("returns 406 when Accept rejects html and markdown on GET /", async () => {
    const res = await handler(
      new Request("http://localhost/", {
        headers: { accept: "application/json" },
      }),
    );
    expect(res.status).toBe(406);
  });

  it("returns 400 for invalid POST /reports body", async () => {
    const res = await handler(
      new Request("http://localhost/reports", {
        method: "POST",
        headers: scopeHeaders,
        body: JSON.stringify({ title: "Weekly" }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("mounts under basePath and rewrites route matching", async () => {
    const store = createSqliteStore(":memory:");
    await store.projects.create({
      id: "project-1",
      tenantId: "tenant-a",
      name: "Demo",
      domain: "example.com",
    });
    const mounted = createHandler(store, {
      basePath: "/api/rankmyseo",
      config: defineConfig({
        databaseUrl: "sqlite://:memory:",
        tenantId: "tenant-a",
        projectId: "project-1",
        dataSources: [{ provider: "fixture", default: true }],
        schedule: { cron: "0 6 * * *", enabled: false },
        siteFeatures: {
          sitemap: true,
          llmsTxt: true,
          collector: true,
          markdownNegotiation: true,
          blog: false,
        },
      }),
    });

    const ok = await mounted(
      new Request("http://localhost/api/rankmyseo/projects", {
        headers: scopeHeaders,
      }),
    );
    expect(ok.status).toBe(200);

    const miss = await mounted(
      new Request("http://localhost/projects", {
        headers: scopeHeaders,
      }),
    );
    expect(miss.status).toBe(404);
  });
});
