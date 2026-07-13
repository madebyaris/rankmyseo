import { describe, it, expect, vi } from "vitest";
import { createRankMySeoClient } from "./client.js";
import { RankMySeoApiError } from "./errors.js";

function jsonResponse(body: unknown, init: { status?: number; ok?: boolean } = {}) {
  const status = init.status ?? 200;
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

describe("createRankMySeoClient", () => {
  it("sends scope headers and optional bearer token", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ data: [] }),
    );

    const client = createRankMySeoClient({
      baseUrl: "http://localhost:3456",
      tenantId: "tenant-a",
      projectId: "project-1",
      token: "secret",
      fetchImpl,
    });

    await client.keywords.list();

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("http://localhost:3456/keywords");
    const headers = new Headers(init.headers);
    expect(headers.get("x-tenant-id")).toBe("tenant-a");
    expect(headers.get("x-project-id")).toBe("project-1");
    expect(headers.get("authorization")).toBe("Bearer secret");
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("request unwraps { data }", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [{ id: "kw-1", text: "seo" }],
      }),
    );

    const client = createRankMySeoClient({
      baseUrl: "http://localhost",
      tenantId: "t",
      projectId: "p",
      fetchImpl,
    });

    const keywords = await client.request<{ id: string; text: string }[]>(
      "/keywords",
    );
    expect(keywords).toEqual([{ id: "kw-1", text: "seo" }]);
  });

  it("api returns raw JSON envelope", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ data: [{ id: "kw-1" }] }),
    );

    const client = createRankMySeoClient({
      baseUrl: "http://localhost",
      tenantId: "t",
      projectId: "p",
      fetchImpl,
    });

    const res = await client.api<{ data: { id: string }[] }>("/keywords");
    expect(res).toEqual({ data: [{ id: "kw-1" }] });
  });

  it("request throws RankMySeoApiError with status/code/details", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          error: "Missing scope headers",
          code: "MISSING_SCOPE",
          details: { headers: ["x-tenant-id"] },
        },
        { status: 400, ok: false },
      ),
    );

    const client = createRankMySeoClient({
      baseUrl: "http://localhost",
      tenantId: "t",
      projectId: "p",
      fetchImpl,
    });

    await expect(client.request("/keywords")).rejects.toMatchObject({
      name: "RankMySeoApiError",
      status: 400,
      code: "MISSING_SCOPE",
      message: "Missing scope headers",
      details: { headers: ["x-tenant-id"] },
    } satisfies Partial<RankMySeoApiError>);
  });

  it("keywords.list and keywords.create", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: [
            {
              id: "kw-1",
              tenantId: "t",
              projectId: "p",
              text: "seo tools",
              country: "us",
              device: "desktop",
              tags: [],
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            data: {
              id: "kw-2",
              tenantId: "t",
              projectId: "p",
              text: "rank tracker",
              country: "us",
              device: "desktop",
              tags: [],
              createdAt: new Date().toISOString(),
            },
          },
          { status: 201 },
        ),
      );

    const client = createRankMySeoClient({
      baseUrl: "http://localhost",
      tenantId: "t",
      projectId: "p",
      fetchImpl,
    });

    const listed = await client.keywords.list();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.text).toBe("seo tools");

    const created = await client.keywords.create({ text: "rank tracker" });
    expect(created.text).toBe("rank tracker");

    const createCall = fetchImpl.mock.calls[1]!;
    expect(createCall[0]).toBe("http://localhost/keywords");
    expect(createCall[1].method).toBe("POST");
    expect(JSON.parse(createCall[1].body as string)).toEqual({
      tags: [],
      text: "rank tracker",
    });
  });

  it("scan.run posts normalized url", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          audit: { id: "a1", score: 90 },
          signals: { url: "https://example.com/" },
          recommendations: [],
        },
      }),
    );

    const client = createRankMySeoClient({
      baseUrl: "http://localhost",
      tenantId: "t",
      projectId: "p",
      fetchImpl,
    });

    const result = await client.scan.run("example.com");
    expect(result.audit.id).toBe("a1");

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("http://localhost/scan");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      url: "https://example.com/",
    });
  });

  it("agent.chat returns text from stream body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "hello from agent",
      json: async () => {
        throw new Error("not json");
      },
    });

    const client = createRankMySeoClient({
      baseUrl: "http://localhost",
      tenantId: "t",
      projectId: "p",
      fetchImpl,
    });

    const text = await client.agent.chat([
      { role: "user", content: "hi" },
    ]);
    expect(text).toBe("hello from agent");

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("http://localhost/agent/chat");
    expect(init.method).toBe("POST");
  });
});
