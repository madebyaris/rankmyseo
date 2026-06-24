import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { defineConfig, generateMeta } from "@rankmyseo/core";
import { createHandler } from "@rankmyseo/server";
import { createStore } from "@rankmyseo/storage";
import type { LanguageModel } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import { Hono } from "hono";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "../public");
const dataDir = path.join(__dirname, "../data");
const dbPath = path.join(dataDir, "playground.sqlite");

const TENANT_ID = "tenant-a";
const PROJECT_ID = "project-1";
const PORT = Number(process.env.PORT ?? 3456);

const config = defineConfig({
  databaseUrl: `sqlite://${dbPath}`,
  tenantId: TENANT_ID,
  projectId: PROJECT_ID,
  dataSources: [{ provider: "fixture", default: true }],
  schedule: { cron: "0 6 * * *", enabled: false },
  siteFeatures: {
    sitemap: true,
    llmsTxt: true,
    collector: true,
    markdownNegotiation: true,
  },
  sitemapRoutes: ["/", "/playground"],
  llmsTxt: {
    projectName: "RankMySEO Playground",
    summary: "Manual test UI for keyword tracking and SEO audits.",
    links: [
      { title: "Playground", url: "/" },
      { title: "Dashboard demo", url: "http://localhost:5173" },
    ],
  },
});

const store = createStore(`sqlite://${dbPath}`);
// AI SDK v3 mock shapes drift quickly; cast for playground-only dev server.
const mockModel = new MockLanguageModelV3({
  doGenerate: async () =>
    ({
      finishReason: "stop",
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
      content: [{ type: "text", text: "I can help customize your RankMySEO dashboard." }],
      warnings: [],
    }) as never,
  doStream: async () =>
    ({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({ type: "text-delta", textDelta: "Hello from RankMySEO agent." });
          controller.enqueue({
            type: "finish",
            finishReason: "stop",
            usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
          });
          controller.close();
        },
      }),
    }) as never,
}) as unknown as LanguageModel;

const apiHandler = createHandler(store, {
  config,
  agentModel: mockModel,
});

async function seedProject() {
  const existing = await store.projects.getById(
    { tenantId: TENANT_ID, projectId: PROJECT_ID },
    PROJECT_ID,
  );
  if (existing) return;

  await store.projects.create({
    id: PROJECT_ID,
    tenantId: TENANT_ID,
    name: "Playground Project",
    domain: "localhost",
  });

  const dashboard = await store.dashboard.get({
    tenantId: TENANT_ID,
    projectId: PROJECT_ID,
  });
  if (!dashboard) {
    await store.dashboard.upsert({
      id: "default-dashboard",
      tenantId: TENANT_ID,
      projectId: PROJECT_ID,
      widgets: [
        {
          id: "kw-table",
          type: "KeywordTable",
          title: "Tracked keywords",
          query: {},
          options: {},
        },
        {
          id: "audit-card",
          type: "AuditScoreCard",
          title: "Latest audit score",
          query: {},
          options: {},
        },
      ],
      updatedAt: new Date(),
    });
  }
}

async function seedBlog() {
  const scope = { tenantId: TENANT_ID, projectId: PROJECT_ID };
  const existing = await store.blog.list(scope);
  if (existing.length > 0) return;

  const samples = [
    {
      title: "The best rank tracking tools for small teams in 2026",
      content:
        "Rank tracking is the backbone of any SEO program. This guide compares the best rank tracking tools for small teams, weighing accuracy, owned-data freshness, and price.",
      targetKeyword: "rank tracking tools",
      intent: "commercial" as const,
    },
    {
      title: "What is search intent and why it matters for SEO",
      content:
        "Search intent is the reason behind a query. Understanding informational, navigational, commercial, and transactional intent helps you match content to what users actually want.",
      targetKeyword: "search intent",
      intent: "informational" as const,
    },
  ];

  for (const sample of samples) {
    const meta = generateMeta({
      title: sample.title,
      content: sample.content,
      targetKeyword: sample.targetKeyword,
    });
    await store.blog.create({
      id: randomUUID(),
      tenantId: TENANT_ID,
      projectId: PROJECT_ID,
      title: sample.title,
      slug: meta.slug,
      content: sample.content,
      targetKeyword: sample.targetKeyword,
      intent: sample.intent,
      metaTitle: meta.metaTitle,
      metaDescription: meta.metaDescription,
      status: "draft",
    });
  }
}

async function readPublicFile(filename: string, contentType: string) {
  const body = await readFile(path.join(publicDir, filename));
  return new Response(body, {
    headers: { "content-type": contentType },
  });
}

const app = new Hono();

app.use("*", async (c, next) => {
  await next();
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Headers", "content-type, x-tenant-id, x-project-id, authorization");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
});

app.options("*", (c) => c.body(null, 204));

app.get("/health", (c) =>
  c.json({
    ok: true,
    package: "@rankmyseo/playground",
    tenantId: TENANT_ID,
    projectId: PROJECT_ID,
  }),
);

app.get("/playground", () => readPublicFile("index.html", "text/html; charset=utf-8"));
app.get("/playground/app.js", () => readPublicFile("app.js", "text/javascript; charset=utf-8"));

const apiPaths = [
  "/projects",
  "/keywords",
  "/snapshots",
  "/audits",
  "/collect",
  "/scan",
  "/meta",
  "/blog",
  "/reports",
  "/dashboard",
  "/agent",
  "/sitemap.xml",
  "/llms.txt",
];

for (const prefix of apiPaths) {
  app.all(prefix, (c) => apiHandler(c.req.raw));
  app.all(`${prefix}/*`, (c) => apiHandler(c.req.raw));
}

app.get("/", (c) => apiHandler(c.req.raw));

await seedProject();
await seedBlog();

console.log(`RankMySEO playground → http://localhost:${PORT}`);
console.log(`Manual test UI       → http://localhost:${PORT}/playground`);
console.log(`SQLite database      → ${dbPath}`);

serve({ fetch: app.fetch, port: PORT });
