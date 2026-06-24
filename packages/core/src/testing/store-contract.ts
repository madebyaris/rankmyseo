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
  });
}

export function newId(): string {
  return randomUUID();
}
