import "server-only";

import {
  createKeywordInputSchema,
  createRankSnapshotInputSchema,
  snapshotRangeQuerySchema,
  tenantScopeSchema,
  type RankStore,
  type TenantScope,
} from "@rankmyseo/core";

export interface RequestScope extends TenantScope {}

export function readScope(request: Request): RequestScope | Response {
  const tenantId = request.headers.get("x-tenant-id");
  const projectId = request.headers.get("x-project-id");

  const parsed = tenantScopeSchema.safeParse({ tenantId, projectId });
  if (!parsed.success) {
    return Response.json(
      { error: "Missing or invalid x-tenant-id / x-project-id headers" },
      { status: 400 },
    );
  }

  return parsed.data;
}

async function readJson<T>(request: Request): Promise<T | Response> {
  try {
    return (await request.json()) as T;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export function createHandler(store: RankStore) {
  return async (request: Request): Promise<Response> => {
    const scope = readScope(request);
    if (scope instanceof Response) return scope;

    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    if (method === "GET" && pathname === "/keywords") {
      const keywords = await store.keywords.list(scope);
      return Response.json({ data: keywords });
    }

    if (method === "POST" && pathname === "/keywords") {
      const body = await readJson<unknown>(request);
      if (body instanceof Response) return body;

      const parsed = createKeywordInputSchema.safeParse({
        ...(body as Record<string, unknown>),
        tenantId: scope.tenantId,
        projectId: scope.projectId,
      });

      if (!parsed.success) {
        return Response.json(
          { error: "Invalid keyword payload", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const keyword = await store.keywords.create(parsed.data);
      return Response.json({ data: keyword }, { status: 201 });
    }

    const keywordMatch = pathname.match(/^\/keywords\/([^/]+)$/);
    if (keywordMatch) {
      const keywordId = keywordMatch[1]!;

      if (method === "GET") {
        const keyword = await store.keywords.getById(scope, keywordId);
        if (!keyword) {
          return Response.json({ error: "Keyword not found" }, { status: 404 });
        }
        return Response.json({ data: keyword });
      }

      if (method === "DELETE") {
        const deleted = await store.keywords.delete(scope, keywordId);
        if (!deleted) {
          return Response.json({ error: "Keyword not found" }, { status: 404 });
        }
        return new Response(null, { status: 204 });
      }
    }

    if (method === "POST" && pathname === "/snapshots") {
      const body = await readJson<unknown>(request);
      if (body instanceof Response) return body;

      const parsed = createRankSnapshotInputSchema.safeParse({
        ...(body as Record<string, unknown>),
        tenantId: scope.tenantId,
        projectId: scope.projectId,
      });

      if (!parsed.success) {
        return Response.json(
          { error: "Invalid snapshot payload", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const snapshot = await store.snapshots.append(parsed.data);
      return Response.json({ data: snapshot }, { status: 201 });
    }

    if (method === "GET" && pathname === "/snapshots") {
      const parsed = snapshotRangeQuerySchema.safeParse({
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        keywordId: url.searchParams.get("keywordId") ?? undefined,
        from: url.searchParams.get("from"),
        to: url.searchParams.get("to"),
      });

      if (!parsed.success) {
        return Response.json(
          { error: "Invalid snapshot query", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const snapshots = await store.snapshots.listByRange(parsed.data);
      return Response.json({ data: snapshots });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  };
}
