import type { PageSignals } from "@rankmyseo/core/schemas";

export interface CollectPageSignalsContext {
  document?: Pick<Document, "title" | "querySelector" | "querySelectorAll">;
  location?: Pick<Location, "href">;
}

export function collectPageSignals(
  ctx: CollectPageSignalsContext = {},
): PageSignals {
  const doc = ctx.document ?? document;
  const loc = ctx.location ?? window.location;

  const title = doc.title || undefined;
  const metaDescription =
    doc.querySelector('meta[name="description"]')?.getAttribute("content") ??
    undefined;
  const canonical =
    doc.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null;
  const h1Count = doc.querySelectorAll("h1").length;
  const hasOgTags = Boolean(doc.querySelector('meta[property^="og:"]'));
  const hasJsonLd = Boolean(
    doc.querySelector('script[type="application/ld+json"]'),
  );

  return {
    url: loc.href,
    title,
    metaDescription,
    canonical: canonical ? new URL(canonical, loc.href).href : null,
    h1Count,
    hasOgTags,
    hasJsonLd,
  };
}
