import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import { comparePageSnapshots } from "@rankmyseo/core";
import { scanPage } from "@rankmyseo/scanner";

function listen(
  handler: (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
  ) => void,
): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createServer(handler);
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("failed to bind");
      }
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        close: () =>
          new Promise((r, j) => server.close((err) => (err ? j(err) : r()))),
      });
    });
  });
}

function htmlPage(opts: {
  title?: string;
  canonical?: string;
  robots?: string;
  jsonLd?: string;
}): string {
  const title = opts.title
    ? `<title>${opts.title}</title>`
    : "";
  const canonical = opts.canonical
    ? `<link rel="canonical" href="${opts.canonical}" />`
    : "";
  const robots = opts.robots
    ? `<meta name="robots" content="${opts.robots}" />`
    : "";
  const jsonLd = opts.jsonLd
    ? `<script type="application/ld+json">${opts.jsonLd}</script>`
    : "";
  return `<!doctype html><html lang="en"><head>
    ${title}
    <meta name="description" content="A long enough description for the page so meta checks have something to measure." />
    ${canonical}
    ${robots}
    ${jsonLd}
  </head><body><h1>Page</h1><p>${"word ".repeat(300)}</p></body></html>`;
}

describe("regression dual-origin integration", () => {
  it("flags title removal between production and preview", async () => {
    const production = await listen((_req, res) => {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(
        htmlPage({
          title: "Production page title is present here",
          canonical: "https://example.com/",
          jsonLd: '{"@type":"WebPage"}',
        }),
      );
    });
    const preview = await listen((_req, res) => {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(
        htmlPage({
          canonical: "https://example.com/",
          jsonLd: '{"@type":"WebPage"}',
        }),
      );
    });

    try {
      const [baseline, current] = await Promise.all([
        scanPage(production.url, {
          route: "/",
          originLabel: "production",
          allowPrivateNetwork: true,
          allowedOrigins: [production.url],
        }),
        scanPage(preview.url, {
          route: "/",
          originLabel: "preview",
          allowPrivateNetwork: true,
          allowedOrigins: [preview.url],
        }),
      ]);

      const findings = comparePageSnapshots({ baseline, current });
      expect(findings.some((f) => f.id.includes("title"))).toBe(true);
    } finally {
      await Promise.all([production.close(), preview.close()]);
    }
  });

  it("passes when production and preview match on gated fields", async () => {
    const page = htmlPage({
      title: "Stable page title for both origins",
      canonical: "https://example.com/",
      jsonLd: '{"@type":"WebPage"}',
    });

    const production = await listen((_req, res) => {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(page);
    });
    const preview = await listen((_req, res) => {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(page);
    });

    try {
      const [baseline, current] = await Promise.all([
        scanPage(production.url, {
          route: "/",
          originLabel: "production",
          allowPrivateNetwork: true,
          allowedOrigins: [production.url],
        }),
        scanPage(preview.url, {
          route: "/",
          originLabel: "preview",
          allowPrivateNetwork: true,
          allowedOrigins: [preview.url],
        }),
      ]);

      expect(comparePageSnapshots({ baseline, current })).toEqual([]);
    } finally {
      await Promise.all([production.close(), preview.close()]);
    }
  });
});
