import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach } from "vitest";
import type { RankStore } from "../ports/index.js";
import type { TenantScope } from "../schemas/index.js";

export interface StoreContractOptions {
  makeScope?: () => TenantScope;
}

export function runStoreContractTests(
  makeStore: () => RankStore | Promise<RankStore>,
  options: StoreContractOptions = {},
): void {
  describe("RankStore contract", () => {
    let store: RankStore;
    let scope: TenantScope;

    beforeEach(async () => {
      store = await makeStore();
      scope = options.makeScope?.() ?? {
        tenantId: "tenant-a",
        projectId: "project-1",
      };

      await store.projects.create({
        id: scope.projectId,
        tenantId: scope.tenantId,
        name: "Test Project",
        domain: "example.com",
      });
    });

    it("creates and lists projects", async () => {
      const found = await store.projects.getById(scope, scope.projectId);
      expect(found?.name).toBe("Test Project");
      const listed = await store.projects.list(scope);
      expect(listed.length).toBeGreaterThanOrEqual(1);
    });

    it("creates and lists keywords", async () => {
      const keyword = await store.keywords.create({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        text: "best seo tools",
        country: "us",
        device: "desktop",
        tags: ["core"],
      });

      expect(keyword.id).toBeTruthy();
      expect(keyword.text).toBe("best seo tools");

      const listed = await store.keywords.list(scope);
      expect(listed).toHaveLength(1);
      expect(listed[0]?.id).toBe(keyword.id);
    });

    it("gets keyword by id within scope", async () => {
      const keyword = await store.keywords.create({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        text: "rank tracking",
        country: "us",
        device: "desktop",
        tags: [],
      });

      const found = await store.keywords.getById(scope, keyword.id);
      expect(found?.text).toBe("rank tracking");
    });

    it("deletes keyword within scope", async () => {
      const keyword = await store.keywords.create({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        text: "temporary keyword",
        country: "us",
        device: "desktop",
        tags: [],
      });

      expect(await store.keywords.delete(scope, keyword.id)).toBe(true);
      expect(await store.keywords.getById(scope, keyword.id)).toBeUndefined();
    });

    it("appends snapshots and queries by range (append-only)", async () => {
      const keyword = await store.keywords.create({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        text: "seo audit",
        country: "us",
        device: "desktop",
        tags: [],
      });

      const t1 = new Date("2026-06-01T00:00:00.000Z");
      const t2 = new Date("2026-06-02T00:00:00.000Z");
      const t3 = new Date("2026-06-03T00:00:00.000Z");

      await store.snapshots.append({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        keywordId: keyword.id,
        position: 10,
        url: "https://example.com/page",
        source: "gsc",
        device: "desktop",
        country: "us",
        capturedAt: t1,
      });

      await store.snapshots.append({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        keywordId: keyword.id,
        position: 7,
        url: "https://example.com/page",
        source: "gsc",
        device: "desktop",
        country: "us",
        capturedAt: t2,
      });

      await store.snapshots.append({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        keywordId: keyword.id,
        position: 5,
        url: "https://example.com/page",
        source: "gsc",
        device: "desktop",
        country: "us",
        capturedAt: t3,
      });

      const inRange = await store.snapshots.listByRange({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        keywordId: keyword.id,
        from: t1,
        to: t2,
      });

      expect(inRange).toHaveLength(2);
      expect(inRange.map((s) => s.position)).toEqual([10, 7]);
    });

    it("enforces tenant isolation on keyword reads", async () => {
      const keyword = await store.keywords.create({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        text: "private keyword",
        country: "us",
        device: "desktop",
        tags: [],
      });

      const otherScope: TenantScope = {
        tenantId: "tenant-b",
        projectId: scope.projectId,
      };

      expect(await store.keywords.getById(otherScope, keyword.id)).toBeUndefined();
      expect(await store.keywords.list(otherScope)).toHaveLength(0);
    });

    it("enforces tenant isolation on snapshot reads", async () => {
      const keyword = await store.keywords.create({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        text: "isolated snapshots",
        country: "us",
        device: "desktop",
        tags: [],
      });

      const capturedAt = new Date("2026-06-01T00:00:00.000Z");

      await store.snapshots.append({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        keywordId: keyword.id,
        position: 3,
        url: "https://example.com",
        source: "gsc",
        device: "desktop",
        country: "us",
        capturedAt,
      });

      const otherScope: TenantScope = {
        tenantId: "tenant-b",
        projectId: scope.projectId,
      };

      const snapshots = await store.snapshots.listByRange({
        tenantId: otherScope.tenantId,
        projectId: otherScope.projectId,
        keywordId: keyword.id,
        from: capturedAt,
        to: capturedAt,
      });

      expect(snapshots).toHaveLength(0);
    });

    it("creates and lists audits with checks", async () => {
      const audit = await store.audits.create({
        id: randomUUID(),
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        url: "https://example.com/page",
        score: 85,
        checks: [
          {
            ruleId: "title-length",
            passed: true,
            message: "Title OK",
            severity: "info",
          },
        ],
      });

      expect(audit.checks).toHaveLength(1);
      const found = await store.audits.getById(scope, audit.id);
      expect(found?.score).toBe(85);
      expect(found?.checks[0]?.ruleId).toBe("title-length");

      const listed = await store.audits.list(scope);
      expect(listed.some((a) => a.id === audit.id)).toBe(true);
    });

    it("creates and lists reports with summary", async () => {
      const report = await store.reports.create({
        id: randomUUID(),
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        title: "Weekly report",
        from: new Date("2026-06-01T00:00:00.000Z"),
        to: new Date("2026-06-07T00:00:00.000Z"),
        summary: {
          topMovers: [],
          auditScoreTrend: [],
        },
      });

      expect(report.title).toBe("Weekly report");
      const found = await store.reports.getById(scope, report.id);
      expect(found?.summary).toBeDefined();
    });

    it("upserts and gets dashboard config", async () => {
      const config = {
        id: randomUUID(),
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        widgets: [
          {
            id: "w1",
            type: "KeywordTable",
            title: "Keywords",
            query: {},
            options: {},
          },
        ],
        updatedAt: new Date(),
      };

      await store.dashboard.upsert(config);
      const found = await store.dashboard.get(scope);
      expect(found?.widgets).toHaveLength(1);
      expect(found?.widgets[0]?.type).toBe("KeywordTable");

      const updated = {
        ...config,
        widgets: [
          ...config.widgets,
          {
            id: "w2",
            type: "RankHistoryChart",
            title: "Rank history",
            query: { keywordId: "kw-1" },
            options: {},
          },
        ],
        updatedAt: new Date(),
      };
      await store.dashboard.upsert(updated);
      const refetched = await store.dashboard.get(scope);
      expect(refetched?.widgets).toHaveLength(2);
    });

    it("enforces tenant isolation on audits", async () => {
      const audit = await store.audits.create({
        id: randomUUID(),
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        url: "https://example.com",
        score: 90,
        checks: [],
      });

      const otherScope: TenantScope = {
        tenantId: "tenant-b",
        projectId: scope.projectId,
      };

      expect(await store.audits.getById(otherScope, audit.id)).toBeUndefined();
      expect(await store.audits.list(otherScope)).toHaveLength(0);
    });

    it("creates, updates, lists, and deletes blog posts", async () => {
      const post = await store.blog.create({
        id: randomUUID(),
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        title: "How to track rankings",
        slug: "how-to-track-rankings",
        content: "A guide to rank tracking.",
        targetKeyword: "rank tracking",
        intent: "informational",
        metaTitle: "How to track rankings",
        metaDescription: "A practical guide to rank tracking.",
        status: "draft",
      });

      expect(post.id).toBeTruthy();
      expect(post.intent).toBe("informational");

      const listed = await store.blog.list(scope);
      expect(listed).toHaveLength(1);

      const updated = await store.blog.update(scope, post.id, {
        status: "published",
        intent: "commercial",
      });
      expect(updated?.status).toBe("published");
      expect(updated?.intent).toBe("commercial");
      expect(updated?.title).toBe("How to track rankings");

      expect(await store.blog.delete(scope, post.id)).toBe(true);
      expect(await store.blog.getById(scope, post.id)).toBeUndefined();
    });

    it("enforces tenant isolation on blog posts", async () => {
      const post = await store.blog.create({
        id: randomUUID(),
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        title: "Private post",
        slug: "private-post",
        content: "",
        targetKeyword: "",
        intent: "informational",
        metaTitle: "",
        metaDescription: "",
        status: "draft",
      });

      const otherScope: TenantScope = {
        tenantId: "tenant-b",
        projectId: scope.projectId,
      };

      expect(await store.blog.getById(otherScope, post.id)).toBeUndefined();
      expect(await store.blog.list(otherScope)).toHaveLength(0);
    });
  });
}

export function newId(): string {
  return randomUUID();
}
