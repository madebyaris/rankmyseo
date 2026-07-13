import { describe, it, expect, vi, afterEach } from "vitest";
import { collectPageSignals } from "./collect.js";
import { postPageSignals } from "./post.js";
import { startPageCollector } from "./start.js";

describe("collectPageSignals", () => {
  it("reads signals from injected document/location", () => {
    const elements = {
      meta: {
        getAttribute: (name: string) =>
          name === "content" ? "A great page" : null,
      },
      canonical: {
        getAttribute: (name: string) =>
          name === "href" ? "/canonical-path" : null,
      },
      og: {},
      jsonLd: {},
    };

    const fakeDoc = {
      title: "Hello SEO",
      querySelector: (sel: string) => {
        if (sel === 'meta[name="description"]') return elements.meta;
        if (sel === 'link[rel="canonical"]') return elements.canonical;
        if (sel === 'meta[property^="og:"]') return elements.og;
        if (sel === 'script[type="application/ld+json"]') return elements.jsonLd;
        return null;
      },
      querySelectorAll: (sel: string) => {
        if (sel === "h1") return { length: 2 };
        return { length: 0 };
      },
    };

    const signals = collectPageSignals({
      document: fakeDoc as unknown as Document,
      location: { href: "https://example.com/page" },
    });

    expect(signals).toEqual({
      url: "https://example.com/page",
      title: "Hello SEO",
      metaDescription: "A great page",
      canonical: "https://example.com/canonical-path",
      h1Count: 2,
      hasOgTags: true,
      hasJsonLd: true,
    });
  });

  it("uses live document when no context is provided", () => {
    document.title = "Live Title";
    document.body.innerHTML = `
      <meta name="description" content="Live desc" />
      <h1>One</h1>
    `;
    window.history.replaceState({}, "", "/live");

    const signals = collectPageSignals();
    expect(signals.title).toBe("Live Title");
    expect(signals.metaDescription).toBe("Live desc");
    expect(signals.h1Count).toBe(1);
    expect(signals.url).toContain("/live");
  });
});

describe("postPageSignals", () => {
  it("POSTs collected signals with scope headers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 201 });

    const fakeDoc = {
      title: "Post me",
      querySelector: () => null,
      querySelectorAll: () => ({ length: 0 }),
    };

    await postPageSignals(
      {
        baseUrl: "http://localhost:3456",
        tenantId: "t",
        projectId: "p",
        fetchImpl,
      },
      { lcp: 1200, cls: 0.01 },
      {
        document: fakeDoc as unknown as Document,
        location: { href: "https://example.com/" },
      },
    );

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("http://localhost:3456/collect");
    expect(init.method).toBe("POST");
    expect(init.headers["x-tenant-id"]).toBe("t");
    expect(init.headers["x-project-id"]).toBe("p");
    const body = JSON.parse(init.body as string);
    expect(body.url).toBe("https://example.com/");
    expect(body.title).toBe("Post me");
    expect(body.webVitals).toEqual({ lcp: 1200, cls: 0.01 });
  });
});

describe("startPageCollector", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("posts after delay and dispose is idempotent", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 201 });

    const dispose = startPageCollector({
      baseUrl: "http://localhost",
      tenantId: "t",
      projectId: "p",
      fetchImpl,
      delayMs: 1000,
      loadWebVitals: async () => ({
        onLCP: (cb) => cb({ value: 10 }),
        onCLS: (cb) => cb({ value: 0.1 }),
        onINP: (cb) => cb({ value: 20 }),
      }),
    });

    await vi.advanceTimersByTimeAsync(0); // flush microtasks for loadWebVitals
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(1000);

    expect(fetchImpl).toHaveBeenCalledOnce();
    const body = JSON.parse(fetchImpl.mock.calls[0]![1].body as string);
    expect(body.webVitals).toEqual({ lcp: 10, cls: 0.1, inp: 20 });

    dispose();
    dispose();
  });

  it("dispose cancels the pending post", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 201 });

    const dispose = startPageCollector({
      baseUrl: "http://localhost",
      tenantId: "t",
      projectId: "p",
      fetchImpl,
      delayMs: 1000,
      loadWebVitals: async () => ({
        onLCP: () => undefined,
        onCLS: () => undefined,
        onINP: () => undefined,
      }),
    });

    await Promise.resolve();
    dispose();
    dispose();
    await vi.advanceTimersByTimeAsync(5000);

    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
