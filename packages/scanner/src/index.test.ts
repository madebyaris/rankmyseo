import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import { ScanError, safeFetch, scanPage } from "./index.js";

function listen(
  handler: (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse) => void,
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

describe("safeFetch / scanPage", () => {
  it("scans HTML pages when private network is allowed", async () => {
    const server = await listen((_req, res) => {
      res.writeHead(200, {
        "content-type": "text/html",
        "x-robots-tag": "index,follow",
      });
      res.end(`<!doctype html><html lang="en"><head>
        <title>Scanner test page title here</title>
        <meta name="description" content="A scanner test description that is long enough for audit checks to pass the meta length rule." />
        <link rel="canonical" href="http://127.0.0.1/" />
        <script type="application/ld+json">{"@type":"WebPage"}</script>
      </head><body><h1>Hello</h1><p>${"word ".repeat(300)}</p></body></html>`);
    });

    try {
      const snapshot = await scanPage(server.url, {
        allowPrivateNetwork: true,
        originLabel: "baseline",
      });
      expect(snapshot.statusCode).toBe(200);
      expect(snapshot.signals.title).toContain("Scanner test");
      expect(snapshot.audit.checks.length).toBeGreaterThan(0);
    } finally {
      await server.close();
    }
  });

  it("blocks private hosts by default", async () => {
    await expect(safeFetch("http://127.0.0.1:9/")).rejects.toBeInstanceOf(
      ScanError,
    );
  });

  it("rejects oversized bodies", async () => {
    const server = await listen((_req, res) => {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("x".repeat(1000));
    });
    try {
      await expect(
        safeFetch(server.url, {
          allowPrivateNetwork: true,
          maxBytes: 100,
        }),
      ).rejects.toMatchObject({ code: "BODY_TOO_LARGE" });
    } finally {
      await server.close();
    }
  });

  it("revalidates redirect targets against allowlist", async () => {
    const server = await listen((req, res) => {
      if (req.url === "/go") {
        res.writeHead(302, { location: "https://evil.example/" });
        res.end();
        return;
      }
      res.writeHead(200, { "content-type": "text/html" });
      res.end("<html><body>ok</body></html>");
    });
    try {
      await expect(
        safeFetch(`${server.url}/go`, {
          allowPrivateNetwork: true,
          allowedOrigins: [server.url],
        }),
      ).rejects.toMatchObject({ code: "ORIGIN_NOT_ALLOWED" });
    } finally {
      await server.close();
    }
  });

  it("rejects non-HTML content types", async () => {
    const server = await listen((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end("{}");
    });
    try {
      await expect(
        safeFetch(server.url, { allowPrivateNetwork: true }),
      ).rejects.toMatchObject({ code: "UNSUPPORTED_CONTENT_TYPE" });
    } finally {
      await server.close();
    }
  });
});
