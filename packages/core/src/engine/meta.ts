import type { GeneratedMeta } from "../schemas/index.js";

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;
const DESCRIPTION_MIN = 70;

export interface GenerateMetaInput {
  title: string;
  content?: string;
  targetKeyword?: string;
  url?: string;
  siteName?: string;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildMetaTitle(title: string, siteName?: string): string {
  const base = collapseWhitespace(title);
  if (siteName) {
    const withBrand = `${base} | ${siteName}`;
    if (withBrand.length <= TITLE_MAX) return withBrand;
  }
  return truncateAtWord(base, TITLE_MAX);
}

function buildMetaDescription(
  content: string,
  title: string,
  targetKeyword?: string,
): string {
  let source = collapseWhitespace(content);
  if (!source) {
    source = targetKeyword
      ? `Everything you need to know about ${targetKeyword}. ${title}.`
      : `${title}.`;
  }

  // Ensure the target keyword appears for relevance, if there is room.
  if (
    targetKeyword &&
    !source.toLowerCase().includes(targetKeyword.toLowerCase())
  ) {
    source = `${targetKeyword} — ${source}`;
  }

  const description = truncateAtWord(source, DESCRIPTION_MAX);
  // Pad short descriptions so they clear the recommended minimum.
  if (description.length < DESCRIPTION_MIN && targetKeyword) {
    const padded = `${description} Learn more about ${targetKeyword}.`;
    return truncateAtWord(collapseWhitespace(padded), DESCRIPTION_MAX);
  }
  return description;
}

export function generateMeta(input: GenerateMetaInput): GeneratedMeta {
  const title = collapseWhitespace(input.title);
  const metaTitle = buildMetaTitle(title, input.siteName);
  const metaDescription = buildMetaDescription(
    input.content ?? "",
    title,
    input.targetKeyword,
  );
  const slug = slugify(input.targetKeyword || title);
  const canonical = input.url ?? null;

  const openGraph = {
    title: metaTitle,
    description: metaDescription,
    type: "article",
  };

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: metaDescription,
    ...(canonical ? { url: canonical, mainEntityOfPage: canonical } : {}),
  };

  const lines = [
    `<title>${escapeHtml(metaTitle)}</title>`,
    `<meta name="description" content="${escapeHtml(metaDescription)}" />`,
    canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" />` : null,
    `<meta property="og:title" content="${escapeHtml(openGraph.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(openGraph.description)}" />`,
    `<meta property="og:type" content="${openGraph.type}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  ].filter((line): line is string => line !== null);

  return {
    metaTitle,
    metaDescription,
    slug,
    canonical,
    openGraph,
    jsonLd,
    html: lines.join("\n"),
  };
}
