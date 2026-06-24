import type { PageSignals } from "@rankmyseo/core";

export function collectPageSignals(): PageSignals {
  const title = document.title || undefined;
  const metaDescription =
    document.querySelector('meta[name="description"]')?.getAttribute("content") ??
    undefined;
  const canonical =
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null;
  const h1Count = document.querySelectorAll("h1").length;
  const hasOgTags = Boolean(document.querySelector('meta[property^="og:"]'));
  const hasJsonLd = Boolean(document.querySelector('script[type="application/ld+json"]'));

  return {
    url: window.location.href,
    title,
    metaDescription,
    canonical: canonical ? new URL(canonical, window.location.href).href : null,
    h1Count,
    hasOgTags,
    hasJsonLd,
  };
}

export async function postPageSignals(
  baseUrl: string,
  scope: { tenantId: string; projectId: string },
  webVitals?: PageSignals["webVitals"],
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const signals = { ...collectPageSignals(), webVitals };
  await fetchImpl(`${baseUrl}/collect`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tenant-id": scope.tenantId,
      "x-project-id": scope.projectId,
    },
    body: JSON.stringify(signals),
  });
}

export function usePageCollector(options: {
  baseUrl: string;
  tenantId: string;
  projectId: string;
  enabled?: boolean;
}) {
  const enabled = options.enabled ?? true;

  if (typeof window !== "undefined" && enabled) {
    void import("web-vitals").then(({ onCLS, onLCP, onINP }) => {
      const vitals: NonNullable<PageSignals["webVitals"]> = {};
      onLCP((m) => {
        vitals.lcp = m.value;
      });
      onCLS((m) => {
        vitals.cls = m.value;
      });
      onINP((m) => {
        vitals.inp = m.value;
      });
      setTimeout(() => {
        void postPageSignals(
          options.baseUrl,
          { tenantId: options.tenantId, projectId: options.projectId },
          vitals,
        );
      }, 3000);
    });
  }
}
