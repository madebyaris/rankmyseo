import { describe, it, expect } from "vitest";
import { extractPageSignals, extractJsonLdTypes } from "./parse.js";

describe("extractPageSignals", () => {
  it("extracts SEO signals from raw HTML", () => {
    const html = `<!DOCTYPE html><html lang="en"><head>
      <title>My Page Title</title>
      <meta name="description" content="A concise page description." />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href="https://example.com/page" />
      <meta property="og:title" content="My Page" />
      <script type="application/ld+json">{"@type":"Article"}</script>
      </head><body><h1>Heading</h1><h1>Second</h1>
      <h2>Section one</h2><h2>Section two</h2>
      <img src="a.png" alt="A picture" /><img src="b.png" />
      <p>Some words of body content for the page.</p></body></html>`;

    const signals = extractPageSignals(html, "https://example.com/page");

    expect(signals.title).toBe("My Page Title");
    expect(signals.metaDescription).toBe("A concise page description.");
    expect(signals.canonical).toBe("https://example.com/page");
    expect(signals.h1Count).toBe(2);
    expect(signals.h2Count).toBe(2);
    expect(signals.hasOgTags).toBe(true);
    expect(signals.hasJsonLd).toBe(true);
    expect(signals.jsonLdTypes).toEqual(["Article"]);
    expect(signals.lang).toBe("en");
    expect(signals.hasViewportMeta).toBe(true);
    expect(signals.robotsNoindex).toBe(false);
    expect(signals.imageCount).toBe(2);
    expect(signals.imagesWithAlt).toBe(1);
    expect(signals.wordCount).toBeGreaterThan(0);
  });

  it("detects a noindex directive", () => {
    const html = `<html lang="en"><head>
      <meta name="robots" content="noindex, nofollow" />
      </head><body></body></html>`;
    const signals = extractPageSignals(html, "https://example.com");
    expect(signals.robotsNoindex).toBe(true);
  });

  it("handles minimal HTML with sensible defaults", () => {
    const signals = extractPageSignals("<html><body></body></html>", "https://example.com");
    expect(signals.title).toBeUndefined();
    expect(signals.h1Count).toBe(0);
    expect(signals.hasOgTags).toBe(false);
    expect(signals.canonical).toBeNull();
    expect(signals.lang).toBeNull();
    expect(signals.hasViewportMeta).toBe(false);
    expect(signals.robotsNoindex).toBe(false);
    expect(signals.imageCount).toBe(0);
  });

  it("extracts multiple @type values including @graph", () => {
    const html = `<html><head>
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Organization", "name": "Example" },
          { "@type": "WebSite", "name": "Example Site" }
        ]
      }</script>
      </head><body></body></html>`;
    expect(extractJsonLdTypes(html)).toEqual(["Organization", "WebSite"]);
  });
});
