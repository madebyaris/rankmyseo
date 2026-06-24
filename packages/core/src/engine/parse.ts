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
  const hasOgTags = /<meta[^>]+property\s*=\s*["']og:/i.test(html);
  const hasJsonLd =
    /<script[^>]+type\s*=\s*["']application\/ld\+json["']/i.test(html);

  return pageSignalsSchema.parse({
    url,
    title,
    metaDescription,
    canonical: canonical ?? null,
    h1Count,
    hasOgTags,
    hasJsonLd,
  });
}
