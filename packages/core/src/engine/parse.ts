import { pageSignalsSchema, type PageSignals } from "../schemas/index.js";

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function matchAttr(
  html: string,
  tag: RegExp,
  attr: "content" | "href",
): string | undefined {
  const match = html.match(tag);
  if (!match) return undefined;
  const fragment = match[0];
  const attrMatch = fragment.match(
    new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, "i"),
  );
  return attrMatch?.[1] ? decodeEntities(attrMatch[1]) : undefined;
}

/**
 * Extract on-page SEO signals from a raw HTML string. Regex-based so it stays
 * dependency-free and runnable anywhere the core runs (no DOM required).
 */
export function extractPageSignals(html: string, url: string): PageSignals {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1] ? decodeEntities(titleMatch[1]) : undefined;

  const metaDescription = matchAttr(
    html,
    /<meta[^>]+name\s*=\s*["']description["'][^>]*>/i,
    "content",
  );

  const canonical = matchAttr(
    html,
    /<link[^>]+rel\s*=\s*["']canonical["'][^>]*>/i,
    "href",
  );

  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  const h2Count = (html.match(/<h2[\s>]/gi) ?? []).length;
  const hasOgTags = /<meta[^>]+property\s*=\s*["']og:/i.test(html);
  const hasJsonLd =
    /<script[^>]+type\s*=\s*["']application\/ld\+json["']/i.test(html);

  const langMatch = html.match(/<html[^>]*\slang\s*=\s*["']([^"']+)["']/i);
  const lang = langMatch?.[1]?.trim() || null;

  const hasViewportMeta = /<meta[^>]+name\s*=\s*["']viewport["']/i.test(html);

  const robotsContent = matchAttr(
    html,
    /<meta[^>]+name\s*=\s*["']robots["'][^>]*>/i,
    "content",
  );
  const robotsNoindex = /\bnoindex\b/i.test(robotsContent ?? "");

  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const imageCount = imgTags.length;
  const imagesWithAlt = imgTags.filter((tag) =>
    /\balt\s*=\s*["'][^"']+["']/i.test(tag),
  ).length;

  const wordCount = countWords(html);
  const jsonLdTypes = extractJsonLdTypes(html);

  return pageSignalsSchema.parse({
    url,
    title,
    metaDescription,
    canonical: canonical ?? null,
    h1Count,
    h2Count,
    hasOgTags,
    hasJsonLd,
    jsonLdTypes,
    lang,
    hasViewportMeta,
    robotsNoindex,
    imageCount,
    imagesWithAlt,
    wordCount,
  });
}

/** Approximate visible-text word count: strip non-content tags, then tags. */
function countWords(html: string): number {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  return text.split(" ").length;
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

/** Parse JSON-LD blocks and collect Schema.org @type values. */
export function extractJsonLdTypes(html: string): string[] {
  const types = new Set<string>();
  const scriptPattern =
    /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match: RegExpExecArray | null;
  while ((match = scriptPattern.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      collectTypesFromNode(parsed, types);
    } catch {
      // skip invalid JSON-LD
    }
  }

  return [...types];
}
