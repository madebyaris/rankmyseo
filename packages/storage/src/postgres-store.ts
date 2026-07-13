import { randomUUID } from "node:crypto";
import { and, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import type {
  Audit,
  BlogPost,
  CreateKeywordInput,
  CreateRankSnapshotInput,
  DashboardConfig,
  Keyword,
  KeywordIntent,
  Project,
  RankSnapshot,
  RankStore,
  Report,
  SnapshotRangeQuery,
  TenantScope,
} from "@rankmyseo/core";
import {
  parseChecks,
  parseSerpFeatures,
  parseSummary,
  parseTags,
} from "./json-parse.js";
import {
  audits,
  blogPosts,
  dashboardConfigs,
  keywords,
  postgresSchema,
  projects,
  rankSnapshots,
  reports,
} from "./schema/postgres.js";

const { Pool } = pg;

function mapBlogRow(row: {
  id: string;
  tenantId: string;
  projectId: string;
  title: string;
  slug: string;
  content: string;
  targetKeyword: string;
  intent: string;
  metaTitle: string;
  metaDescription: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): BlogPost {
  return {
    id: row.id,
    tenantId: row.tenantId,
    projectId: row.projectId,
    title: row.title,
    slug: row.slug,
    content: row.content,
    targetKeyword: row.targetKeyword,
    intent: row.intent as KeywordIntent,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    status: row.status as BlogPost["status"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapAuditRow(row: {
  id: string;
  tenantId: string;
  projectId: string;
  url: string;
  score: number;
  checks: unknown;
  createdAt: Date;
}): Audit {
  return {
    id: row.id,
    tenantId: row.tenantId,
    projectId: row.projectId,
    url: row.url,
    score: row.score,
    checks: parseChecks(row.checks),
    createdAt: row.createdAt,
  };
}

function mapReportRow(row: {
  id: string;
  tenantId: string;
  projectId: string;
  title: string;
  from: Date;
  to: Date;
  summary: unknown;
  createdAt: Date;
}): Report {
  return {
    id: row.id,
    tenantId: row.tenantId,
    projectId: row.projectId,
    title: row.title,
    from: row.from,
    to: row.to,
    summary: parseSummary(row.summary),
    createdAt: row.createdAt,
  };
}

async function migrate(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rms_projects (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rms_keywords (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      text TEXT NOT NULL,
      country TEXT NOT NULL,
      device TEXT NOT NULL,
      tags JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rms_rank_snapshots (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      keyword_id TEXT NOT NULL,
      position INTEGER,
      url TEXT,
      source TEXT NOT NULL,
      device TEXT NOT NULL,
      country TEXT NOT NULL,
      captured_at TIMESTAMPTZ NOT NULL,
      serp_features JSONB
    );
    CREATE TABLE IF NOT EXISTS rms_audits (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      url TEXT NOT NULL,
      score INTEGER NOT NULL,
      checks JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rms_reports (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      "from" TIMESTAMPTZ NOT NULL,
      "to" TIMESTAMPTZ NOT NULL,
      summary JSONB,
      created_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rms_dashboard_configs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      widgets JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rms_blog_posts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      target_keyword TEXT NOT NULL DEFAULT '',
      intent TEXT NOT NULL DEFAULT 'informational',
      meta_title TEXT NOT NULL DEFAULT '',
      meta_description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `);
}

export function createPostgresStore(databaseUrl: string): RankStore {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema: postgresSchema });
  let ready: Promise<void> | undefined;
  const ensureReady = () => {
    ready ??= migrate(pool);
    return ready;
  };

  const keywordScopeWhere = (scope: TenantScope) =>
    and(
      eq(keywords.tenantId, scope.tenantId),
      eq(keywords.projectId, scope.projectId),
    );

  return {
    projects: {
      async create(input) {
        await ensureReady();
        const now = new Date();
        const row: Project = {
          ...input,
          createdAt: now,
          updatedAt: now,
        };
        await db.insert(projects).values({
          id: row.id,
          tenantId: row.tenantId,
          name: row.name,
          domain: row.domain,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        });
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const rows = await db
          .select()
          .from(projects)
          .where(and(eq(projects.tenantId, scope.tenantId), eq(projects.id, id)));
        const row = rows[0];
        if (!row) return undefined;
        return {
          id: row.id,
          tenantId: row.tenantId,
          name: row.name,
          domain: row.domain,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      },
      async list(scope) {
        await ensureReady();
        const rows = await db
          .select()
          .from(projects)
          .where(eq(projects.tenantId, scope.tenantId));
        return rows.map((row) => ({
          id: row.id,
          tenantId: row.tenantId,
          name: row.name,
          domain: row.domain,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));
      },
    },

    keywords: {
      async create(input: CreateKeywordInput) {
        await ensureReady();
        const row: Keyword = {
          id: randomUUID(),
          ...input,
          createdAt: new Date(),
        };
        await db.insert(keywords).values({
          id: row.id,
          tenantId: row.tenantId,
          projectId: row.projectId,
          text: row.text,
          country: row.country,
          device: row.device,
          tags: row.tags,
          createdAt: row.createdAt,
        });
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const rows = await db
          .select()
          .from(keywords)
          .where(and(keywordScopeWhere(scope), eq(keywords.id, id)));
        const row = rows[0];
        if (!row) return undefined;
        return {
          id: row.id,
          tenantId: row.tenantId,
          projectId: row.projectId,
          text: row.text,
          country: row.country,
          device: row.device as Keyword["device"],
          tags: parseTags(row.tags),
          createdAt: row.createdAt,
        };
      },
      async list(scope) {
        await ensureReady();
        const rows = await db
          .select()
          .from(keywords)
          .where(keywordScopeWhere(scope));
        return rows.map((row) => ({
          id: row.id,
          tenantId: row.tenantId,
          projectId: row.projectId,
          text: row.text,
          country: row.country,
          device: row.device as Keyword["device"],
          tags: parseTags(row.tags),
          createdAt: row.createdAt,
        }));
      },
      async delete(scope, id) {
        await ensureReady();
        const deleted = await db
          .delete(keywords)
          .where(and(keywordScopeWhere(scope), eq(keywords.id, id)))
          .returning({ id: keywords.id });
        return deleted.length > 0;
      },
    },

    snapshots: {
      async append(input: CreateRankSnapshotInput) {
        await ensureReady();
        const row: RankSnapshot = {
          id: randomUUID(),
          ...input,
        };
        await db.insert(rankSnapshots).values({
          id: row.id,
          tenantId: row.tenantId,
          projectId: row.projectId,
          keywordId: row.keywordId,
          position: row.position,
          url: row.url,
          source: row.source,
          device: row.device,
          country: row.country,
          capturedAt: row.capturedAt,
          serpFeatures: row.serpFeatures ?? null,
        });
        return row;
      },
      async listByRange(query: SnapshotRangeQuery) {
        await ensureReady();
        const conditions = [
          eq(rankSnapshots.tenantId, query.tenantId),
          eq(rankSnapshots.projectId, query.projectId),
          gte(rankSnapshots.capturedAt, query.from),
          lte(rankSnapshots.capturedAt, query.to),
        ];
        if (query.keywordId) {
          conditions.push(eq(rankSnapshots.keywordId, query.keywordId));
        }

        const rows = await db
          .select()
          .from(rankSnapshots)
          .where(and(...conditions))
          .orderBy(rankSnapshots.capturedAt);
        return rows.map((row) => ({
          id: row.id,
          tenantId: row.tenantId,
          projectId: row.projectId,
          keywordId: row.keywordId,
          position: row.position,
          url: row.url,
          source: row.source,
          device: row.device as RankSnapshot["device"],
          country: row.country,
          capturedAt: row.capturedAt,
          serpFeatures: parseSerpFeatures(row.serpFeatures),
        }));
      },
    },

    audits: {
      async create(input) {
        await ensureReady();
        const row: Audit = { ...input, checks: input.checks ?? [], createdAt: new Date() };
        await db.insert(audits).values({
          id: row.id,
          tenantId: row.tenantId,
          projectId: row.projectId,
          url: row.url,
          score: row.score,
          checks: row.checks,
          createdAt: row.createdAt,
        });
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const rows = await db
          .select()
          .from(audits)
          .where(
            and(
              eq(audits.tenantId, scope.tenantId),
              eq(audits.projectId, scope.projectId),
              eq(audits.id, id),
            ),
          );
        const row = rows[0];
        if (!row) return undefined;
        return mapAuditRow(row);
      },
      async list(scope) {
        await ensureReady();
        const rows = await db
          .select()
          .from(audits)
          .where(
            and(
              eq(audits.tenantId, scope.tenantId),
              eq(audits.projectId, scope.projectId),
            ),
          );
        return rows.map(mapAuditRow);
      },
    },

    reports: {
      async create(input) {
        await ensureReady();
        const row: Report = { ...input, createdAt: new Date() };
        await db.insert(reports).values({
          id: row.id,
          tenantId: row.tenantId,
          projectId: row.projectId,
          title: row.title,
          from: row.from,
          to: row.to,
          summary: row.summary ?? null,
          createdAt: row.createdAt,
        });
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const rows = await db
          .select()
          .from(reports)
          .where(
            and(
              eq(reports.tenantId, scope.tenantId),
              eq(reports.projectId, scope.projectId),
              eq(reports.id, id),
            ),
          );
        const row = rows[0];
        if (!row) return undefined;
        return mapReportRow(row);
      },
      async list(scope) {
        await ensureReady();
        const rows = await db
          .select()
          .from(reports)
          .where(
            and(
              eq(reports.tenantId, scope.tenantId),
              eq(reports.projectId, scope.projectId),
            ),
          );
        return rows.map(mapReportRow);
      },
    },

    dashboard: {
      async get(scope) {
        await ensureReady();
        const rows = await db
          .select()
          .from(dashboardConfigs)
          .where(
            and(
              eq(dashboardConfigs.tenantId, scope.tenantId),
              eq(dashboardConfigs.projectId, scope.projectId),
            ),
          );
        const row = rows[0];
        if (!row) return undefined;
        const widgets = parseJsonWidgets(row.widgets);
        return {
          id: row.id,
          tenantId: row.tenantId,
          projectId: row.projectId,
          widgets,
          updatedAt: row.updatedAt,
        };
      },
      async upsert(config) {
        await ensureReady();
        await db
          .insert(dashboardConfigs)
          .values({
            id: config.id,
            tenantId: config.tenantId,
            projectId: config.projectId,
            widgets: config.widgets,
            updatedAt: config.updatedAt,
          })
          .onConflictDoUpdate({
            target: dashboardConfigs.id,
            set: {
              widgets: config.widgets,
              updatedAt: config.updatedAt,
            },
          });
        return config;
      },
    },

    blog: {
      async create(input) {
        await ensureReady();
        const now = new Date();
        const row: BlogPost = { ...input, createdAt: now, updatedAt: now };
        await db.insert(blogPosts).values({
          id: row.id,
          tenantId: row.tenantId,
          projectId: row.projectId,
          title: row.title,
          slug: row.slug,
          content: row.content,
          targetKeyword: row.targetKeyword,
          intent: row.intent,
          metaTitle: row.metaTitle,
          metaDescription: row.metaDescription,
          status: row.status,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        });
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const rows = await db
          .select()
          .from(blogPosts)
          .where(
            and(
              eq(blogPosts.tenantId, scope.tenantId),
              eq(blogPosts.projectId, scope.projectId),
              eq(blogPosts.id, id),
            ),
          );
        const row = rows[0];
        return row ? mapBlogRow(row) : undefined;
      },
      async list(scope) {
        await ensureReady();
        const rows = await db
          .select()
          .from(blogPosts)
          .where(
            and(
              eq(blogPosts.tenantId, scope.tenantId),
              eq(blogPosts.projectId, scope.projectId),
            ),
          );
        return rows.map(mapBlogRow);
      },
      async update(scope, id, patch) {
        await ensureReady();
        const rows = await db
          .select()
          .from(blogPosts)
          .where(
            and(
              eq(blogPosts.tenantId, scope.tenantId),
              eq(blogPosts.projectId, scope.projectId),
              eq(blogPosts.id, id),
            ),
          );
        const existing = rows[0];
        if (!existing) return undefined;

        const merged = mapBlogRow(existing);
        const next: BlogPost = {
          ...merged,
          ...patch,
          updatedAt: new Date(),
        };

        await db
          .update(blogPosts)
          .set({
            title: next.title,
            slug: next.slug,
            content: next.content,
            targetKeyword: next.targetKeyword,
            intent: next.intent,
            metaTitle: next.metaTitle,
            metaDescription: next.metaDescription,
            status: next.status,
            updatedAt: next.updatedAt,
          })
          .where(
            and(
              eq(blogPosts.tenantId, scope.tenantId),
              eq(blogPosts.projectId, scope.projectId),
              eq(blogPosts.id, id),
            ),
          );

        return next;
      },
      async delete(scope, id) {
        await ensureReady();
        const deleted = await db
          .delete(blogPosts)
          .where(
            and(
              eq(blogPosts.tenantId, scope.tenantId),
              eq(blogPosts.projectId, scope.projectId),
              eq(blogPosts.id, id),
            ),
          )
          .returning({ id: blogPosts.id });
        return deleted.length > 0;
      },
    },
  };
}

function parseJsonWidgets(raw: unknown): DashboardConfig["widgets"] {
  const parsed = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? (JSON.parse(raw) as unknown)
      : [];
  return (Array.isArray(parsed) ? parsed : []) as DashboardConfig["widgets"];
}
