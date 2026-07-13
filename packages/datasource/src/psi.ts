import "server-only";

import type { PageSignals } from "@rankmyseo/core";

export interface PsiLabMetrics {
  lcp?: number;
  cls?: number;
  inp?: number;
  tbt?: number;
  source: "lab";
}

export interface CruxFieldMetrics {
  lcp?: number;
  cls?: number;
  inp?: number;
  source: "field";
}

export interface PsiResult {
  lab: PsiLabMetrics;
  field?: CruxFieldMetrics;
}

export interface PsiClientOptions {
  apiKey?: string;
  fetchImpl?: typeof fetch;
  strategy?: "mobile" | "desktop";
}

/**
 * PageSpeed Insights client.
 * Lab metrics come from Lighthouse; field metrics (when present) come from CrUX
 * embedded in the PSI response. Prefer the dedicated CrUX API for durable field trends.
 */
export class PsiClient {
  constructor(private readonly options: PsiClientOptions = {}) {}

  async fetchWebVitals(url: string): Promise<PsiResult> {
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const keyParam = this.options.apiKey
      ? `&key=${encodeURIComponent(this.options.apiKey)}`
      : "";
    const strategy = this.options.strategy ?? "mobile";
    const response = await fetchImpl(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&strategy=${strategy}${keyParam}`,
    );

    if (!response.ok) {
      throw new Error(`PSI API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      lighthouseResult?: {
        audits?: Record<string, { numericValue?: number }>;
      };
      loadingExperience?: {
        metrics?: Record<string, { percentile?: number }>;
      };
    };

    const audits = data.lighthouseResult?.audits ?? {};
    const lab: PsiLabMetrics = {
      lcp: audits["largest-contentful-paint"]?.numericValue,
      cls: audits["cumulative-layout-shift"]?.numericValue,
      inp: audits["interaction-to-next-paint"]?.numericValue,
      tbt: audits["total-blocking-time"]?.numericValue,
      source: "lab",
    };

    const fieldMetrics = data.loadingExperience?.metrics;
    const field: CruxFieldMetrics | undefined = fieldMetrics
      ? {
          lcp: fieldMetrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile,
          cls: fieldMetrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile,
          inp: fieldMetrics.INTERACTION_TO_NEXT_PAINT?.percentile,
          source: "field",
        }
      : undefined;

    return { lab, field };
  }

  async enrichPageSignals(
    signals: PageSignals,
    prefer: "lab" | "field" = "lab",
  ): Promise<PageSignals> {
    const vitals = await this.fetchWebVitals(signals.url);
    const chosen =
      prefer === "field" && vitals.field
        ? vitals.field
        : vitals.lab;
    return {
      ...signals,
      webVitals: {
        ...signals.webVitals,
        lcp: chosen.lcp,
        cls: chosen.cls,
        inp: chosen.inp,
        source: chosen.source,
      },
    };
  }
}
