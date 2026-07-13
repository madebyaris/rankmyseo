import type { SchemaGeneratorInput } from "@rankmyseo/core";
import type {
  Audit,
  AuditCheckResult,
  BlogPost,
  BlogPostStatus,
  BlogWidgetOptions,
  CreateKeywordInput,
  DashboardConfig,
  DashboardWidget,
  GeneratedMeta,
  GeneratedSchema,
  Keyword,
  KeywordIntent,
  PageSignals,
  RankSnapshot,
  Recommendation,
  Report,
  UpdateBlogPostInput,
} from "@rankmyseo/core/schemas";
import {
  BLOG_WIDGET_TYPE,
  dashboardHasBlogWidget,
  normalizeHttpUrl,
  parseBlogWidgetOptions,
} from "@rankmyseo/core/schemas";
import { RankMySeoApiError, parseApiErrorBody } from "./errors.js";

export interface RankMySeoClientConfig {
  baseUrl: string;
  tenantId: string;
  projectId: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

export interface ScanResult {
  audit: Audit;
  signals: PageSignals;
  recommendations: Recommendation[];
}

export interface MetaGenerationResult {
  meta: GeneratedMeta;
  checks: AuditCheckResult[];
  score: number;
}

export interface SchemaGenerationResult {
  schema: GeneratedSchema;
}

export interface BlogPostDetail {
  data: BlogPost;
  recommendations: Recommendation[];
}

export type CreateKeywordClientInput = Pick<CreateKeywordInput, "text"> &
  Partial<Pick<CreateKeywordInput, "country" | "device" | "tags">>;

export interface CreateBlogPostClientInput {
  title: string;
  slug?: string;
  content?: string;
  targetKeyword?: string;
  intent?: KeywordIntent;
  metaTitle?: string;
  metaDescription?: string;
  status?: BlogPostStatus;
}

export interface RankMySeoClient {
  config: RankMySeoClientConfig;
  /** Low-level: returns raw JSON (including `{ data: T }` envelope). Compat with React hooks. */
  api: <T>(path: string, init?: RequestInit) => Promise<T>;
  /** High-level: unwraps `{ data: T }` and throws `RankMySeoApiError` when `!res.ok`. */
  request: <T>(path: string, init?: RequestInit) => Promise<T>;
  keywords: {
    list: () => Promise<Keyword[]>;
    create: (input: CreateKeywordClientInput) => Promise<Keyword>;
    get: (id: string) => Promise<Keyword>;
    delete: (id: string) => Promise<void>;
  };
  snapshots: {
    list: (query: {
      keywordId?: string;
      from: string;
      to: string;
    }) => Promise<RankSnapshot[]>;
  };
  audits: {
    list: () => Promise<Audit[]>;
    get: (id: string) => Promise<Audit>;
  };
  reports: {
    list: () => Promise<Report[]>;
    create: (input: {
      title: string;
      from: string;
      to: string;
    }) => Promise<Report>;
  };
  dashboard: {
    get: () => Promise<DashboardConfig | null>;
    update: (widgets: DashboardConfig["widgets"]) => Promise<DashboardConfig>;
  };
  scan: {
    run: (url: string) => Promise<ScanResult>;
  };
  meta: {
    generate: (input: {
      title: string;
      content?: string;
      targetKeyword?: string;
      url?: string;
      siteName?: string;
    }) => Promise<MetaGenerationResult>;
  };
  schema: {
    generate: (input: SchemaGeneratorInput) => Promise<SchemaGenerationResult>;
  };
  blog: {
    list: () => Promise<BlogPost[]>;
    create: (input: CreateBlogPostClientInput) => Promise<BlogPost>;
    update: (id: string, patch: UpdateBlogPostInput) => Promise<BlogPost>;
    delete: (id: string) => Promise<void>;
    get: (id: string) => Promise<BlogPostDetail>;
  };
  agent: {
    chat: (
      messages: Array<{
        role: "user" | "assistant" | "system";
        content: string;
      }>,
    ) => Promise<string>;
  };
  blogModule: {
    status: () => Promise<{
      enabled: boolean;
      widget: DashboardWidget | undefined;
      options: BlogWidgetOptions;
    }>;
    enable: (
      opts?: Partial<BlogWidgetOptions>,
    ) => Promise<DashboardWidget | undefined>;
    disable: () => Promise<void>;
  };
}

function buildHeaders(
  config: RankMySeoClientConfig,
  init?: RequestInit,
): Headers {
  const headers = new Headers(init?.headers);
  headers.set("x-tenant-id", config.tenantId);
  headers.set("x-project-id", config.projectId);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (config.token) headers.set("authorization", `Bearer ${config.token}`);
  return headers;
}

async function readErrorBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: text };
  }
}

export function createRankMySeoClient(
  config: RankMySeoClientConfig,
): RankMySeoClient {
  const fetchImpl = config.fetchImpl ?? fetch;

  async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = buildHeaders(config, init);
    const res = await fetchImpl(`${config.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!res.ok) {
      throw new Error(`RankMySEO API error: ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  async function request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const headers = buildHeaders(config, init);
    const res = await fetchImpl(`${config.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!res.ok) {
      const body = await readErrorBody(res);
      const parsed = parseApiErrorBody(body);
      throw new RankMySeoApiError(parsed.message, res.status, {
        code: parsed.code,
        details: parsed.details,
      });
    }

    if (res.status === 204) return undefined as T;
    const json = (await res.json()) as { data: T };
    return json.data;
  }

  const client: RankMySeoClient = {
    config,
    api,
    request,
    keywords: {
      list: () => request<Keyword[]>("/keywords"),
      create: (input) =>
        request<Keyword>("/keywords", {
          method: "POST",
          body: JSON.stringify({ tags: [], ...input }),
        }),
      get: (id) => request<Keyword>(`/keywords/${id}`),
      delete: (id) => request<void>(`/keywords/${id}`, { method: "DELETE" }),
    },
    snapshots: {
      list: (query) => {
        const qs = new URLSearchParams({
          from: query.from,
          to: query.to,
        });
        if (query.keywordId) qs.set("keywordId", query.keywordId);
        return request<RankSnapshot[]>(`/snapshots?${qs}`);
      },
    },
    audits: {
      list: () => request<Audit[]>("/audits"),
      get: (id) => request<Audit>(`/audits/${id}`),
    },
    reports: {
      list: () => request<Report[]>("/reports"),
      create: (input) =>
        request<Report>("/reports", {
          method: "POST",
          body: JSON.stringify(input),
        }),
    },
    dashboard: {
      get: () => request<DashboardConfig | null>("/dashboard"),
      update: (widgets) =>
        request<DashboardConfig>("/dashboard", {
          method: "PUT",
          body: JSON.stringify({ widgets }),
        }),
    },
    scan: {
      run: (url) => {
        const target = normalizeHttpUrl(url);
        return request<ScanResult>("/scan", {
          method: "POST",
          body: JSON.stringify({ url: target.href }),
        });
      },
    },
    meta: {
      generate: (input) =>
        request<MetaGenerationResult>("/meta/generate", {
          method: "POST",
          body: JSON.stringify(input),
        }),
    },
    schema: {
      generate: (input) =>
        request<SchemaGenerationResult>("/schema/generate", {
          method: "POST",
          body: JSON.stringify(input),
        }),
    },
    blog: {
      list: () => request<BlogPost[]>("/blog"),
      create: (input) =>
        request<BlogPost>("/blog", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      update: (id, patch) =>
        request<BlogPost>(`/blog/${id}`, {
          method: "PUT",
          body: JSON.stringify(patch),
        }),
      delete: (id) => request<void>(`/blog/${id}`, { method: "DELETE" }),
      get: async (id) => {
        // Blog detail includes recommendations alongside data (not a pure unwrap).
        return api<BlogPostDetail>(`/blog/${id}`);
      },
    },
    agent: {
      chat: async (messages) => {
        const headers = buildHeaders(config);
        const res = await fetchImpl(`${config.baseUrl}/agent/chat`, {
          method: "POST",
          headers,
          body: JSON.stringify({ messages }),
        });
        if (!res.ok) {
          const body = await readErrorBody(res);
          const parsed = parseApiErrorBody(body);
          throw new RankMySeoApiError(parsed.message || `Chat error: ${res.status}`, res.status, {
            code: parsed.code,
            details: parsed.details,
          });
        }
        return res.text();
      },
    },
    blogModule: {
      status: async () => {
        const dash = await client.dashboard.get();
        const widget = dash?.widgets.find((w) => w.type === BLOG_WIDGET_TYPE);
        return {
          enabled: dashboardHasBlogWidget(dash?.widgets),
          widget,
          options: parseBlogWidgetOptions(widget?.options),
        };
      },
      enable: async (opts = {}) => {
        const dash = await client.dashboard.get();
        const widgets = dash?.widgets ?? [];
        if (dashboardHasBlogWidget(widgets)) {
          return widgets.find((w) => w.type === BLOG_WIDGET_TYPE);
        }
        const next: DashboardWidget = {
          id: crypto.randomUUID(),
          type: BLOG_WIDGET_TYPE,
          title: opts.labels?.listTitle ?? "Blog",
          query: {},
          options: { ...opts },
        };
        await client.dashboard.update([...widgets, next]);
        return next;
      },
      disable: async () => {
        const dash = await client.dashboard.get();
        if (!dash) return;
        await client.dashboard.update(
          dash.widgets.filter((w) => w.type !== BLOG_WIDGET_TYPE),
        );
      },
    },
  };

  return client;
}
