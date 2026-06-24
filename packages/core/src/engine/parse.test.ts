import { describe, it, expect } from "vitest";
import { extractPageSignals } from "./parse.js";

describe("extractPageSignals", () => {
  it("extracts SEO signals from raw HTML", () => {
    const html = `<!DOCTYPE html><html><head>
      <title>My Page Title</title>
      <meta name="description" content="A concise page description." />
      <link rel="canonical" href="https://example.com/page" />
      <meta property="og:title" content="My Page" />
      <script type="application/ld+json">{"@type":"Article"}</script>
      </head><body><h1>Heading</h1><h1>Second</h1></body></html>`;

    const signals = extractPageSignals(html, "https://example.com/page");

    expect(signals.title).toBe("My Page Title");
    expect(signals.metaDescription).toBe("A concise page description.");
    expect(signals.canonical).toBe("https://example.com/page");
    expect(signals.h1Count).toBe(2);
    expect(signals.hasOgTags).toBe(true);
    expect(signals.hasJsonLd).toBe(true);
  });

  it("handles minimal HTML with sensible defaults", () => {
    const signals = extractPageSignals("<html><body></body></html>", "https://example.com");
    expect(signals.title).toBeUndefined();
    expect(signals.h1Count).toBe(0);
    expect(signals.hasOgTags).toBe(false);
    expect(signals.canonical).toBeNull();
  });
});
