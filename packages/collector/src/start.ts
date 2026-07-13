import type { PageSignals } from "@rankmyseo/core/schemas";
import { postPageSignals, type PageCollectorConfig } from "./post.js";

export type WebVitalsModule = {
  onCLS: (cb: (metric: { value: number }) => void) => void;
  onLCP: (cb: (metric: { value: number }) => void) => void;
  onINP: (cb: (metric: { value: number }) => void) => void;
};

export interface StartPageCollectorOptions extends PageCollectorConfig {
  /** Override web-vitals loader (tests). */
  loadWebVitals?: () => Promise<WebVitalsModule>;
}

/**
 * Starts collecting web-vitals and posts page signals after `delayMs`.
 * Returns an idempotent dispose function that cancels the pending post.
 */
export function startPageCollector(
  config: StartPageCollectorOptions,
): () => void {
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  if (typeof window === "undefined") {
    return dispose;
  }

  const delayMs = config.delayMs ?? 3000;
  const load =
    config.loadWebVitals ??
    (() => import("web-vitals") as Promise<WebVitalsModule>);

  void load()
    .then(({ onCLS, onLCP, onINP }) => {
      if (disposed) return;

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

      timer = setTimeout(() => {
        if (disposed) return;
        void postPageSignals(config, vitals);
      }, delayMs);
    })
    .catch(() => {
      // Ignore load failures (SSR / missing web-vitals).
    });

  return dispose;
}
