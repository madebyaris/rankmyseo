import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { and, eq, gte, lte } from "drizzle-orm";
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
import {
  audits,
  blogPosts,
  dashboardConfigs,
  keywords,
  projects,
  rankSnapshots,
  reports,
  sqliteSchema,
} from "./schema/sqlite.js";

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

function parseChecks(raw: string | null | undefined): AuditCheckResult[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AuditCheckResult[]) : [];
  } catch {
    return [];
  }
}

function parseSummary(raw: string | null | undefined): ReportSummary | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as ReportSummary;
  } catch {
    return undefined;
  }
}

function mapAuditRow(row: {
  id: string;
  tenantId: string;
  projectId: string;
  url: string;
  score: number;
  checks: string | null;
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
  summary: string | null;
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

function parseTags(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

function migrate(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS rms_projects (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rms_keywords (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      text TEXT NOT NULL,
      country TEXT NOT NULL,
      device TEXT NOT NULL,
      tags TEXT NOT NULL,
      created_at INTEGER NOT NULL
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
      captured_at INTEGER NOT NULL,
      serp_features TEXT
    );
    CREATE TABLE IF NOT EXISTS rms_audits (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      url TEXT NOT NULL,
      score INTEGER NOT NULL,
      checks TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rms_reports (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      "from" INTEGER NOT NULL,
      "to" INTEGER NOT NULL,
      summary TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rms_dashboard_configs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      widgets TEXT NOT NULL,
      updated_at INTEGER NOT NULL
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
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  try {
    sqlite.exec(`ALTER TABLE rms_audits ADD COLUMN checks TEXT NOT NULL DEFAULT '[]'`);
  } catch {
    /* column exists */
  }
  try {
    sqlite.exec(`ALTER TABLE rms_reports ADD COLUMN summary TEXT`);
  } catch {
    /* column exists */
  }
}

export function createSqliteStore(databasePath: string): RankStore {
  const sqlite = new Database(databasePath);
  migrate(sqlite);
  const db = drizzle(sqlite, { schema: sqliteSchema });

  const keywordScopeWhere = (scope: TenantScope) =>
    and(
      eq(keywords.tenantId, scope.tenantId),
      eq(keywords.projectId, scope.projectId),
    );

  return {
    projects: {
      async create(input) {
        const now = new Date();
        const row: Project = {
          ...input,
          createdAt: now,
          updatedAt: now,
        };
        db.insert(projects)
          .values({
            id: row.id,
            tenantId: row.tenantId,
            name: row.name,
            domain: row.domain,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          })
          .run();
        return row;
      },
      async getById(scope, id) {
        const rows = db
          .select()
          .from(projects)
          .where(and(eq(projects.tenantId, scope.tenantId), eq(projects.id, id)))
          .all();
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
        return db
          .select()
          .from(projects)
          .where(eq(projects.tenantId, scope.tenantId))
          .all()
          .map((row) => ({
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
        const row: Keyword = {
          id: randomUUID(),
          ...input,
          createdAt: new Date(),
        };
        db.insert(keywords)
          .values({
            id: row.id,
            tenantId: row.tenantId,
            projectId: row.projectId,
            text: row.text,
            country: row.country,
            device: row.device,
            tags: JSON.stringify(row.tags),
            createdAt: row.createdAt,
          })
          .run();
        return row;
      },
      async getById(scope, id) {
        const rows = db
          .select()
          .from(keywords)
          .where(and(keywordScopeWhere(scope), eq(keywords.id, id)))
          .all();
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
        return db
          .select()
          .from(keywords)
          .where(keywordScopeWhere(scope))
          .all()
          .map((row) => ({
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
        const result = db
          .delete(keywords)
          .where(and(keywordScopeWhere(scope), eq(keywords.id, id)))
          .run();
        return result.changes > 0;
      },
    },

    snapshots: {
      async append(input: CreateRankSnapshotInput) {
        const row: RankSnapshot = {
          id: randomUUID(),
          ...input,
        };
        db.insert(rankSnapshots)
          .values({
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
            serpFeatures: row.serpFeatures
              ? JSON.stringify(row.serpFeatures)
              : null,
          })
          .run();
        return row;
      },
      async listByRange(query: SnapshotRangeQuery) {
        const conditions = [
          eq(rankSnapshots.tenantId, query.tenantId),
          eq(rankSnapshots.projectId, query.projectId),
          gte(rankSnapshots.capturedAt, query.from),
          lte(rankSnapshots.capturedAt, query.to),
        ];
        if (query.keywordId) {
          conditions.push(eq(rankSnapshots.keywordId, query.keywordId));
        }

        return db
          .select()
          .from(rankSnapshots)
          .where(and(...conditions))
          .all()
          .map((row) => ({
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
            serpFeatures: row.serpFeatures
              ? (JSON.parse(row.serpFeatures) as Record<string, unknown>)
              : undefined,
          }));
      },
    },

    audits: {
      async create(input) {
        const row: Audit = { ...input, checks: input.checks ?? [], createdAt: new Date() };
        db.insert(audits)
          .values({
            id: row.id,
            tenantId: row.tenantId,
            projectId: row.projectId,
            url: row.url,
            score: row.score,
            checks: JSON.stringify(row.checks),
            createdAt: row.createdAt,
          })
          .run();
        return row;
      },
      async getById(scope, id) {
        const rows = db
          .select()
          .from(audits)
          .where(
            and(
              eq(audits.tenantId, scope.tenantId),
              eq(audits.projectId, scope.projectId),
              eq(audits.id, id),
            ),
          )
          .all();
        const row = rows[0];
        if (!row) return undefined;
        return mapAuditRow(row);
      },
      async list(scope) {
        return db
          .select()
          .from(audits)
          .where(
            and(
              eq(audits.tenantId, scope.tenantId),
              eq(audits.projectId, scope.projectId),
            ),
          )
          .all()
          .map(mapAuditRow);
      },
    },

    reports: {
      async create(input) {
        const row: Report = { ...input, createdAt: new Date() };
        db.insert(reports)
          .values({
            id: row.id,
            tenantId: row.tenantId,
            projectId: row.projectId,
            title: row.title,
            from: row.from,
            to: row.to,
            summary: row.summary ? JSON.stringify(row.summary) : null,
            createdAt: row.createdAt,
          })
          .run();
        return row;
      },
      async getById(scope, id) {
        const rows = db
          .select()
          .from(reports)
          .where(
            and(
              eq(reports.tenantId, scope.tenantId),
              eq(reports.projectId, scope.projectId),
              eq(reports.id, id),
            ),
          )
          .all();
        const row = rows[0];
        if (!row) return undefined;
        return mapReportRow(row);
      },
      async list(scope) {
        return db
          .select()
          .from(reports)
          .where(
            and(
              eq(reports.tenantId, scope.tenantId),
              eq(reports.projectId, scope.projectId),
            ),
          )
          .all()
          .map(mapReportRow);
      },
    },

    dashboard: {
      async get(scope) {
        const rows = db
          .select()
          .from(dashboardConfigs)
          .where(
            and(
              eq(dashboardConfigs.tenantId, scope.tenantId),
              eq(dashboardConfigs.projectId, scope.projectId),
            ),
          )
          .all();
        const row = rows[0];
        if (!row) return undefined;
        return {
          id: row.id,
          tenantId: row.tenantId,
          projectId: row.projectId,
          widgets: JSON.parse(row.widgets) as DashboardConfig["widgets"],
          updatedAt: row.updatedAt,
        };
      },
      async upsert(config) {
        db.insert(dashboardConfigs)
          .values({
            id: config.id,
            tenantId: config.tenantId,
            projectId: config.projectId,
            widgets: JSON.stringify(config.widgets),
            updatedAt: config.updatedAt,
          })
          .onConflictDoUpdate({
            target: dashboardConfigs.id,
            set: {
              widgets: JSON.stringify(config.widgets),
              updatedAt: config.updatedAt,
            },
          })
          .run();
        return config;
      },
    },

    blog: {
      async create(input) {
        const now = new Date();
        const row: BlogPost = { ...input, createdAt: now, updatedAt: now };
        db.insert(blogPosts)
          .values({
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
          })
          .run();
        return row;
      },
      async getById(scope, id) {
        const rows = db
          .select()
          .from(blogPosts)
          .where(
            and(
              eq(blogPosts.tenantId, scope.tenantId),
              eq(blogPosts.projectId, scope.projectId),
              eq(blogPosts.id, id),
            ),
          )
          .all();
        const row = rows[0];
        return row ? mapBlogRow(row) : undefined;
      },
      async list(scope) {
        return db
          .select()
          .from(blogPosts)
          .where(
            and(
              eq(blogPosts.tenantId, scope.tenantId),
              eq(blogPosts.projectId, scope.projectId),
            ),
          )
          .all()
          .map(mapBlogRow);
      },
      async update(scope, id, patch) {
        const rows = db
          .select()
          .from(blogPosts)
          .where(
            and(
              eq(blogPosts.tenantId, scope.tenantId),
              eq(blogPosts.projectId, scope.projectId),
              eq(blogPosts.id, id),
            ),
          )
          .all();
        const existing = rows[0];
        if (!existing) return undefined;

        const merged = mapBlogRow(existing);
        const next: BlogPost = {
          ...merged,
          ...patch,
          updatedAt: new Date(),
        };

        db.update(blogPosts)
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
          )
          .run();

        return next;
      },
      async delete(scope, id) {
        const result = db
          .delete(blogPosts)
          .where(
            and(
              eq(blogPosts.tenantId, scope.tenantId),
              eq(blogPosts.projectId, scope.projectId),
              eq(blogPosts.id, id),
            ),
          )
          .run();
        return result.changes > 0;
      },
    },
  };
}
