import "server-only";

import type { PageSignals } from "@rankmyseo/core";

export interface PsiResult {
  lcp?: number;
  cls?: number;
  inp?: number;
  fid?: number;
}

export interface PsiClientOptions {
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

export class PsiClient {
  constructor(private readonly options: PsiClientOptions = {}) {}

  async fetchWebVitals(url: string): Promise<PsiResult> {
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const keyParam = this.options.apiKey
      ? `&key=${encodeURIComponent(this.options.apiKey)}`
      : "";
    const response = await fetchImpl(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance${keyParam}`,
    );

    if (!response.ok) {
      throw new Error(`PSI API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      lighthouseResult?: {
        audits?: Record<
          string,
          { numericValue?: number; displayValue?: string }
        >;
      };
    };

    const audits = data.lighthouseResult?.audits ?? {};
    return {
      lcp: audits["largest-contentful-paint"]?.numericValue,
      cls: audits["cumulative-layout-shift"]?.numericValue,
      inp: audits["interaction-to-next-paint"]?.numericValue,
      fid: audits["max-potential-fid"]?.numericValue,
    };
  }

  async enrichPageSignals(signals: PageSignals): Promise<PageSignals> {
    const vitals = await this.fetchWebVitals(signals.url);
    return {
      ...signals,
      webVitals: { ...signals.webVitals, ...vitals },
    };
  }
}
