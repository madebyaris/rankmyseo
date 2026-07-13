import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
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

function mapBlog(row: {
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

const DDL = `
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
`;

async function ensureSchema(prisma: PrismaClient): Promise<void> {
  // Split on semicolons — Prisma $executeRawUnsafe runs one statement at a time.
  const statements = DDL.split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

export function createPrismaStore(datasourceUrl: string): RankStore {
  if (!datasourceUrl) {
    throw new Error(
      "createPrismaStore requires a postgres datasource URL (RANKMYSEO_POSTGRES_URL or DATABASE_URL)",
    );
  }
  const prisma = new PrismaClient({
    datasources: { db: { url: datasourceUrl } },
  });

  let ready: Promise<void> | undefined;
  const ensureReady = () => {
    ready ??= ensureSchema(prisma);
    return ready;
  };

  return {
    projects: {
      async create(input) {
        await ensureReady();
        const now = new Date();
        const row: Project = { ...input, createdAt: now, updatedAt: now };
        await prisma.project.create({
          data: {
            id: row.id,
            tenantId: row.tenantId,
            name: row.name,
            domain: row.domain,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          },
        });
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const row = await prisma.project.findFirst({
          where: { id, tenantId: scope.tenantId },
        });
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
        const rows = await prisma.project.findMany({
          where: { tenantId: scope.tenantId },
        });
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
        await prisma.keyword.create({
          data: {
            id: row.id,
            tenantId: row.tenantId,
            projectId: row.projectId,
            text: row.text,
            country: row.country,
            device: row.device,
            tags: row.tags,
            createdAt: row.createdAt,
          },
        });
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const row = await prisma.keyword.findFirst({
          where: {
            id,
            tenantId: scope.tenantId,
            projectId: scope.projectId,
          },
        });
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
        const rows = await prisma.keyword.findMany({
          where: {
            tenantId: scope.tenantId,
            projectId: scope.projectId,
          },
        });
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
        const result = await prisma.keyword.deleteMany({
          where: {
            id,
            tenantId: scope.tenantId,
            projectId: scope.projectId,
          },
        });
        return result.count > 0;
      },
    },

    snapshots: {
      async append(input: CreateRankSnapshotInput) {
        await ensureReady();
        const row: RankSnapshot = { id: randomUUID(), ...input };
        await prisma.rankSnapshot.create({
          data: {
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
            serpFeatures: (row.serpFeatures ??
              undefined) as Prisma.InputJsonValue | undefined,
          },
        });
        return row;
      },
      async listByRange(query: SnapshotRangeQuery) {
        await ensureReady();
        const rows = await prisma.rankSnapshot.findMany({
          where: {
            tenantId: query.tenantId,
            projectId: query.projectId,
            ...(query.keywordId ? { keywordId: query.keywordId } : {}),
            capturedAt: { gte: query.from, lte: query.to },
          },
          orderBy: { capturedAt: "asc" },
        });
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
        const row: Audit = {
          ...input,
          checks: input.checks ?? [],
          createdAt: new Date(),
        };
        await prisma.audit.create({
          data: {
            id: row.id,
            tenantId: row.tenantId,
            projectId: row.projectId,
            url: row.url,
            score: row.score,
            checks: row.checks as Prisma.InputJsonValue,
            createdAt: row.createdAt,
          },
        });
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const row = await prisma.audit.findFirst({
          where: {
            id,
            tenantId: scope.tenantId,
            projectId: scope.projectId,
          },
        });
        if (!row) return undefined;
        return {
          id: row.id,
          tenantId: row.tenantId,
          projectId: row.projectId,
          url: row.url,
          score: row.score,
          checks: parseChecks(row.checks),
          createdAt: row.createdAt,
        };
      },
      async list(scope) {
        await ensureReady();
        const rows = await prisma.audit.findMany({
          where: {
            tenantId: scope.tenantId,
            projectId: scope.projectId,
          },
        });
        return rows.map((row) => ({
          id: row.id,
          tenantId: row.tenantId,
          projectId: row.projectId,
          url: row.url,
          score: row.score,
          checks: parseChecks(row.checks),
          createdAt: row.createdAt,
        }));
      },
    },

    reports: {
      async create(input) {
        await ensureReady();
        const row: Report = { ...input, createdAt: new Date() };
        await prisma.report.create({
          data: {
            id: row.id,
            tenantId: row.tenantId,
            projectId: row.projectId,
            title: row.title,
            rangeFrom: row.from,
            rangeTo: row.to,
            summary: (row.summary ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
            createdAt: row.createdAt,
          },
        });
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const row = await prisma.report.findFirst({
          where: {
            id,
            tenantId: scope.tenantId,
            projectId: scope.projectId,
          },
        });
        if (!row) return undefined;
        return {
          id: row.id,
          tenantId: row.tenantId,
          projectId: row.projectId,
          title: row.title,
          from: row.rangeFrom,
          to: row.rangeTo,
          summary: parseSummary(row.summary),
          createdAt: row.createdAt,
        };
      },
      async list(scope) {
        await ensureReady();
        const rows = await prisma.report.findMany({
          where: {
            tenantId: scope.tenantId,
            projectId: scope.projectId,
          },
        });
        return rows.map((row) => ({
          id: row.id,
          tenantId: row.tenantId,
          projectId: row.projectId,
          title: row.title,
          from: row.rangeFrom,
          to: row.rangeTo,
          summary: parseSummary(row.summary),
          createdAt: row.createdAt,
        }));
      },
    },

    dashboard: {
      async get(scope) {
        await ensureReady();
        const row = await prisma.dashboardConfig.findFirst({
          where: {
            tenantId: scope.tenantId,
            projectId: scope.projectId,
          },
        });
        if (!row) return undefined;
        const widgets = (
          Array.isArray(row.widgets) ? row.widgets : []
        ) as DashboardConfig["widgets"];
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
        await prisma.dashboardConfig.upsert({
          where: { id: config.id },
          create: {
            id: config.id,
            tenantId: config.tenantId,
            projectId: config.projectId,
            widgets: config.widgets as Prisma.InputJsonValue,
            updatedAt: config.updatedAt,
          },
          update: {
            widgets: config.widgets as Prisma.InputJsonValue,
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
        await prisma.blogPost.create({
          data: {
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
          },
        });
        return row;
      },
      async getById(scope, id) {
        await ensureReady();
        const row = await prisma.blogPost.findFirst({
          where: {
            id,
            tenantId: scope.tenantId,
            projectId: scope.projectId,
          },
        });
        return row ? mapBlog(row) : undefined;
      },
      async list(scope) {
        await ensureReady();
        const rows = await prisma.blogPost.findMany({
          where: {
            tenantId: scope.tenantId,
            projectId: scope.projectId,
          },
        });
        return rows.map(mapBlog);
      },
      async update(scope, id, patch) {
        await ensureReady();
        const existing = await prisma.blogPost.findFirst({
          where: {
            id,
            tenantId: scope.tenantId,
            projectId: scope.projectId,
          },
        });
        if (!existing) return undefined;

        const merged = mapBlog(existing);
        const next: BlogPost = {
          ...merged,
          ...patch,
          updatedAt: new Date(),
        };

        await prisma.blogPost.update({
          where: { id },
          data: {
            title: next.title,
            slug: next.slug,
            content: next.content,
            targetKeyword: next.targetKeyword,
            intent: next.intent,
            metaTitle: next.metaTitle,
            metaDescription: next.metaDescription,
            status: next.status,
            updatedAt: next.updatedAt,
          },
        });

        return next;
      },
      async delete(scope, id) {
        await ensureReady();
        const result = await prisma.blogPost.deleteMany({
          where: {
            id,
            tenantId: scope.tenantId,
            projectId: scope.projectId,
          },
        });
        return result.count > 0;
      },
    },
  };
}
