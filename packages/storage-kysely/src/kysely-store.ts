import { randomUUID } from "node:crypto";
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import type {
  Audit,
  AuditCheckResult,
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
  ReportSummary,
  SnapshotRangeQuery,
  TenantScope,
} from "@rankmyseo/core";
import type { Database } from "./database.js";

const { Pool } = pg;

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((t): t is string => typeof t === "string");
  }
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((t): t is string => typeof t === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseChecks(raw: unknown): AuditCheckResult[] {
  if (Array.isArray(raw)) return raw as AuditCheckResult[];
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as AuditCheckResult[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseSummary(raw: unknown): ReportSummary | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as ReportSummary;
    } catch {
      return undefined;
    }
  }
  if (typeof raw === "object") return raw as ReportSummary;
  return undefined;
}

function parseSerpFeatures(
  raw: unknown,
): Record<string, unknown> | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return undefined;
}

function mapBlog(row: Database["rms_blog_posts"]): BlogPost {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    projectId: row.project_id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    targetKeyword: row.target_keyword,
    intent: row.intent as KeywordIntent,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    status: row.status as BlogPost["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function migrate(db: Kysely<Database>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS rms_projects (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS rms_keywords (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      text TEXT NOT NULL,
      country TEXT NOT NULL,
      device TEXT NOT NULL,
      tags JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `.execute(db);

  await sql`
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
    )
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS rms_audits (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      url TEXT NOT NULL,
      score INTEGER NOT NULL,
      checks JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL
    )
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS rms_reports (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      "from" TIMESTAMPTZ NOT NULL,
      "to" TIMESTAMPTZ NOT NULL,
      summary JSONB,
      created_at TIMESTAMPTZ NOT NULL
    )
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS rms_dashboard_configs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      widgets JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `.execute(db);

  await sql`
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
    )
  `.execute(db);
}

function isPgDuplicateObject(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "23505"
  );
}

async function migrateWithRetry(db: Kysely<Database>): Promise<void> {
  let last: unknown;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      await migrate(db);
      return;
    } catch (err) {
      last = err;
      if (!isPgDuplicateObject(err)) throw err;
      await new Promise((r) => setTimeout(r, 25 * (attempt + 1)));
    }
  }
  throw last;
}

export function createKyselyStore(databaseUrl: string): RankStore {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  });

  let ready: Promise<void> | undefined;
  const ensureReady = () => {
    ready ??= migrateWithRetry(db);
    return ready;
  };

  return {
    projects: {
      async create(input) {
        await ensureReady();
        const now = new Date();
        const row: Project = { ...input, createdAt: now, updatedAt: now };
        await db
          .insertInto("rms_projects")
          .values({
            id: row.id,
            tenant_id: row.tenantId,
            name: row.name,
            domain: row.domain,
            created_at: row.createdAt,
            updated_at: row.updatedAt,
          })
          .execute();
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const row = await db
          .selectFrom("rms_projects")
          .selectAll()
          .where("tenant_id", "=", scope.tenantId)
          .where("id", "=", id)
          .executeTakeFirst();
        if (!row) return undefined;
        return {
          id: row.id,
          tenantId: row.tenant_id,
          name: row.name,
          domain: row.domain,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      },
      async list(scope) {
        await ensureReady();
        const rows = await db
          .selectFrom("rms_projects")
          .selectAll()
          .where("tenant_id", "=", scope.tenantId)
          .execute();
        return rows.map((row) => ({
          id: row.id,
          tenantId: row.tenant_id,
          name: row.name,
          domain: row.domain,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
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
        await db
          .insertInto("rms_keywords")
          .values({
            id: row.id,
            tenant_id: row.tenantId,
            project_id: row.projectId,
            text: row.text,
            country: row.country,
            device: row.device,
            tags: sql`${JSON.stringify(row.tags)}::jsonb`,
            created_at: row.createdAt,
          })
          .execute();
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const row = await db
          .selectFrom("rms_keywords")
          .selectAll()
          .where("tenant_id", "=", scope.tenantId)
          .where("project_id", "=", scope.projectId)
          .where("id", "=", id)
          .executeTakeFirst();
        if (!row) return undefined;
        return {
          id: row.id,
          tenantId: row.tenant_id,
          projectId: row.project_id,
          text: row.text,
          country: row.country,
          device: row.device as Keyword["device"],
          tags: parseTags(row.tags),
          createdAt: row.created_at,
        };
      },
      async list(scope) {
        await ensureReady();
        const rows = await db
          .selectFrom("rms_keywords")
          .selectAll()
          .where("tenant_id", "=", scope.tenantId)
          .where("project_id", "=", scope.projectId)
          .execute();
        return rows.map((row) => ({
          id: row.id,
          tenantId: row.tenant_id,
          projectId: row.project_id,
          text: row.text,
          country: row.country,
          device: row.device as Keyword["device"],
          tags: parseTags(row.tags),
          createdAt: row.created_at,
        }));
      },
      async delete(scope, id) {
        await ensureReady();
        const result = await db
          .deleteFrom("rms_keywords")
          .where("tenant_id", "=", scope.tenantId)
          .where("project_id", "=", scope.projectId)
          .where("id", "=", id)
          .executeTakeFirst();
        return Number(result.numDeletedRows) > 0;
      },
    },

    snapshots: {
      async append(input: CreateRankSnapshotInput) {
        await ensureReady();
        const row: RankSnapshot = { id: randomUUID(), ...input };
        await db
          .insertInto("rms_rank_snapshots")
          .values({
            id: row.id,
            tenant_id: row.tenantId,
            project_id: row.projectId,
            keyword_id: row.keywordId,
            position: row.position,
            url: row.url,
            source: row.source,
            device: row.device,
            country: row.country,
            captured_at: row.capturedAt,
            serp_features: row.serpFeatures
              ? sql`${JSON.stringify(row.serpFeatures)}::jsonb`
              : null,
          })
          .execute();
        return row;
      },
      async listByRange(query: SnapshotRangeQuery) {
        await ensureReady();
        let q = db
          .selectFrom("rms_rank_snapshots")
          .selectAll()
          .where("tenant_id", "=", query.tenantId)
          .where("project_id", "=", query.projectId)
          .where("captured_at", ">=", query.from)
          .where("captured_at", "<=", query.to);

        if (query.keywordId) {
          q = q.where("keyword_id", "=", query.keywordId);
        }

        const rows = await q.orderBy("captured_at", "asc").execute();
        return rows.map((row) => ({
          id: row.id,
          tenantId: row.tenant_id,
          projectId: row.project_id,
          keywordId: row.keyword_id,
          position: row.position,
          url: row.url,
          source: row.source,
          device: row.device as RankSnapshot["device"],
          country: row.country,
          capturedAt: row.captured_at,
          serpFeatures: parseSerpFeatures(row.serp_features),
        }));
      },
    },

    audits: {
      async create(input) {
        await ensureReady();
        const row: Audit = {
          ...input,
          checks: input.checks ?? [],
          createdAt: new Date(),
        };
        await db
          .insertInto("rms_audits")
          .values({
            id: row.id,
            tenant_id: row.tenantId,
            project_id: row.projectId,
            url: row.url,
            score: row.score,
            checks: sql`${JSON.stringify(row.checks)}::jsonb`,
            created_at: row.createdAt,
          })
          .execute();
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const row = await db
          .selectFrom("rms_audits")
          .selectAll()
          .where("tenant_id", "=", scope.tenantId)
          .where("project_id", "=", scope.projectId)
          .where("id", "=", id)
          .executeTakeFirst();
        if (!row) return undefined;
        return {
          id: row.id,
          tenantId: row.tenant_id,
          projectId: row.project_id,
          url: row.url,
          score: row.score,
          checks: parseChecks(row.checks),
          createdAt: row.created_at,
        };
      },
      async list(scope) {
        await ensureReady();
        const rows = await db
          .selectFrom("rms_audits")
          .selectAll()
          .where("tenant_id", "=", scope.tenantId)
          .where("project_id", "=", scope.projectId)
          .execute();
        return rows.map((row) => ({
          id: row.id,
          tenantId: row.tenant_id,
          projectId: row.project_id,
          url: row.url,
          score: row.score,
          checks: parseChecks(row.checks),
          createdAt: row.created_at,
        }));
      },
    },

    reports: {
      async create(input) {
        await ensureReady();
        const row: Report = { ...input, createdAt: new Date() };
        await db
          .insertInto("rms_reports")
          .values({
            id: row.id,
            tenant_id: row.tenantId,
            project_id: row.projectId,
            title: row.title,
            from: row.from,
            to: row.to,
            summary: row.summary
              ? sql`${JSON.stringify(row.summary)}::jsonb`
              : null,
            created_at: row.createdAt,
          })
          .execute();
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const row = await db
          .selectFrom("rms_reports")
          .selectAll()
          .where("tenant_id", "=", scope.tenantId)
          .where("project_id", "=", scope.projectId)
          .where("id", "=", id)
          .executeTakeFirst();
        if (!row) return undefined;
        return {
          id: row.id,
          tenantId: row.tenant_id,
          projectId: row.project_id,
          title: row.title,
          from: row.from,
          to: row.to,
          summary: parseSummary(row.summary),
          createdAt: row.created_at,
        };
      },
      async list(scope) {
        await ensureReady();
        const rows = await db
          .selectFrom("rms_reports")
          .selectAll()
          .where("tenant_id", "=", scope.tenantId)
          .where("project_id", "=", scope.projectId)
          .execute();
        return rows.map((row) => ({
          id: row.id,
          tenantId: row.tenant_id,
          projectId: row.project_id,
          title: row.title,
          from: row.from,
          to: row.to,
          summary: parseSummary(row.summary),
          createdAt: row.created_at,
        }));
      },
    },

    dashboard: {
      async get(scope) {
        await ensureReady();
        const row = await db
          .selectFrom("rms_dashboard_configs")
          .selectAll()
          .where("tenant_id", "=", scope.tenantId)
          .where("project_id", "=", scope.projectId)
          .executeTakeFirst();
        if (!row) return undefined;
        const widgetsRaw =
          typeof row.widgets === "string"
            ? JSON.parse(row.widgets)
            : row.widgets;
        return {
          id: row.id,
          tenantId: row.tenant_id,
          projectId: row.project_id,
          widgets: (Array.isArray(widgetsRaw)
            ? widgetsRaw
            : []) as DashboardConfig["widgets"],
          updatedAt: row.updated_at,
        };
      },
      async upsert(config) {
        await ensureReady();
        const widgetsJson = sql`${JSON.stringify(config.widgets)}::jsonb`;
        await db
          .insertInto("rms_dashboard_configs")
          .values({
            id: config.id,
            tenant_id: config.tenantId,
            project_id: config.projectId,
            widgets: widgetsJson,
            updated_at: config.updatedAt,
          })
          .onConflict((oc) =>
            oc.column("id").doUpdateSet({
              widgets: widgetsJson,
              updated_at: config.updatedAt,
            }),
          )
          .execute();
        return config;
      },
    },

    blog: {
      async create(input) {
        await ensureReady();
        const now = new Date();
        const row: BlogPost = { ...input, createdAt: now, updatedAt: now };
        await db
          .insertInto("rms_blog_posts")
          .values({
            id: row.id,
            tenant_id: row.tenantId,
            project_id: row.projectId,
            title: row.title,
            slug: row.slug,
            content: row.content,
            target_keyword: row.targetKeyword,
            intent: row.intent,
            meta_title: row.metaTitle,
            meta_description: row.metaDescription,
            status: row.status,
            created_at: row.createdAt,
            updated_at: row.updatedAt,
          })
          .execute();
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const row = await db
          .selectFrom("rms_blog_posts")
          .selectAll()
          .where("tenant_id", "=", scope.tenantId)
          .where("project_id", "=", scope.projectId)
          .where("id", "=", id)
          .executeTakeFirst();
        return row ? mapBlog(row) : undefined;
      },
      async list(scope) {
        await ensureReady();
        const rows = await db
          .selectFrom("rms_blog_posts")
          .selectAll()
          .where("tenant_id", "=", scope.tenantId)
          .where("project_id", "=", scope.projectId)
          .execute();
        return rows.map(mapBlog);
      },
      async update(scope, id, patch) {
        await ensureReady();
        const existing = await db
          .selectFrom("rms_blog_posts")
          .selectAll()
          .where("tenant_id", "=", scope.tenantId)
          .where("project_id", "=", scope.projectId)
          .where("id", "=", id)
          .executeTakeFirst();
        if (!existing) return undefined;

        const merged = mapBlog(existing);
        const next: BlogPost = {
          ...merged,
          ...patch,
          updatedAt: new Date(),
        };

        await db
          .updateTable("rms_blog_posts")
          .set({
            title: next.title,
            slug: next.slug,
            content: next.content,
            target_keyword: next.targetKeyword,
            intent: next.intent,
            meta_title: next.metaTitle,
            meta_description: next.metaDescription,
            status: next.status,
            updated_at: next.updatedAt,
          })
          .where("tenant_id", "=", scope.tenantId)
          .where("project_id", "=", scope.projectId)
          .where("id", "=", id)
          .execute();

        return next;
      },
      async delete(scope, id) {
        await ensureReady();
        const result = await db
          .deleteFrom("rms_blog_posts")
          .where("tenant_id", "=", scope.tenantId)
          .where("project_id", "=", scope.projectId)
          .where("id", "=", id)
          .executeTakeFirst();
        return Number(result.numDeletedRows) > 0;
      },
    },
  };
}
