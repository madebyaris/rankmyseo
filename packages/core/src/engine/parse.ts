import { parse as parseHtml } from "node-html-parser";
import { pageSignalsSchema, type PageSignals } from "../schemas/index.js";

function decodeText(text: string | undefined | null): string | undefined {
  if (!text) return undefined;
  return text.replace(/\s+/g, " ").trim() || undefined;
}

function attr(
  el: { getAttribute(name: string): string | undefined } | null,
  name: string,
): string | undefined {
  return decodeText(el?.getAttribute(name) ?? undefined);
}

function normalizeCanonical(
  href: string | undefined,
  pageUrl: string,
): string | null {
  if (!href) return null;
  try {
    return new URL(href, pageUrl).href;
  } catch {
    return null;
  }
}

export interface ExtractPageSignalsOptions {
  /** HTTP header X-Robots-Tag value, if available from the response. */
  xRobotsTag?: string | null;
}

/**
 * Extract on-page SEO signals from a raw HTML string using a real HTML parser.
 */
export function extractPageSignals(
  html: string,
  url: string,
  options: ExtractPageSignalsOptions = {},
): PageSignals {
  const root = parseHtml(html, {
    lowerCaseTagName: false,
    comment: false,
    blockTextElements: {
      script: true,
      style: true,
      noscript: true,
    },
  });

  const title = decodeText(root.querySelector("title")?.text);
  const metaDescription = attr(
    root.querySelector('meta[name="description"]'),
    "content",
  );
  const canonicalHref = attr(
    root.querySelector('link[rel="canonical"]'),
    "href",
  );
  const canonical = normalizeCanonical(canonicalHref, url);

  const h1Count = root.querySelectorAll("h1").length;
  const h2Count = root.querySelectorAll("h2").length;
  const hasOgTags = Boolean(root.querySelector('meta[property^="og:"]'));

  const lang =
    decodeText(root.querySelector("html")?.getAttribute("lang")) ?? null;
  const hasViewportMeta = Boolean(
    root.querySelector('meta[name="viewport"]'),
  );

  const robotsContent = attr(
    root.querySelector('meta[name="robots"]'),
    "content",
  );
  const robotsNoindex = /\bnoindex\b/i.test(robotsContent ?? "");
  const xRobotsNoindex = /\bnoindex\b/i.test(options.xRobotsTag ?? "");

  const imgTags = root.querySelectorAll("img");
  const imageCount = imgTags.length;
  const imagesWithAlt = imgTags.filter((tag) => {
    const alt = tag.getAttribute("alt");
    return typeof alt === "string" && alt.trim().length > 0;
  }).length;

  const { types: jsonLdTypes, valid: jsonLdValid, present: hasJsonLd } =
    extractJsonLdInfo(html);

  const wordCount = countWords(root);

  return pageSignalsSchema.parse({
    url,
    title,
    metaDescription,
    canonical,
    h1Count,
    h2Count,
    hasOgTags,
    hasJsonLd,
    jsonLdTypes,
    jsonLdValid,
    lang,
    hasViewportMeta,
    robotsNoindex,
    xRobotsNoindex,
    imageCount,
    imagesWithAlt,
    wordCount,
  });
}

function countWords(root: {
  querySelector(selector: string): { text: string } | null;
}): number {
  const body = root.querySelector("body");
  const raw = (body?.text ?? "").replace(/\s+/g, " ").trim();
  if (!raw) return 0;
  return raw.split(" ").filter(Boolean).length;
}

function collectTypesFromNode(node: unknown, types: Set<string>): void {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (const item of node) collectTypesFromNode(item, types);
    return;
  }
  if (typeof node !== "object") return;

  const record = node as Record<string, unknown>;
  const typeValue = record["@type"];
  if (typeof typeValue === "string") {
    types.add(typeValue);
  } else if (Array.isArray(typeValue)) {
    for (const t of typeValue) {
      if (typeof t === "string") types.add(t);
    }
  }

  if (record["@graph"]) {
    collectTypesFromNode(record["@graph"], types);
  }

  for (const value of Object.values(record)) {
    if (value !== record["@graph"] && value !== typeValue) {
      collectTypesFromNode(value, types);
    }
  }
}

export function extractJsonLdTypes(html: string): string[] {
  return extractJsonLdInfo(html).types;
}

export function extractJsonLdInfo(html: string): {
  types: string[];
  valid: boolean;
  present: boolean;
} {
  const types = new Set<string>();
  const scriptPattern =
    /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match: RegExpExecArray | null;
  let present = false;
  let valid = true;

  while ((match = scriptPattern.exec(html)) !== null) {
    present = true;
    const raw = match[1]?.trim();
    if (!raw) {
      valid = false;
      continue;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      collectTypesFromNode(parsed, types);
    } catch {
      valid = false;
    }
  }

  return { types: [...types], valid: present ? valid : true, present };
}
