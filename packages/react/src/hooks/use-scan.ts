import { useCallback, useState } from "react";
import type { Audit, PageSignals, Recommendation } from "@rankmyseo/core/schemas";
import { normalizeHttpUrl } from "@rankmyseo/core/schemas";
import { useRankMySeoClient } from "../client.js";

export interface ScanResult {
  audit: Audit;
  signals: PageSignals;
  recommendations: Recommendation[];
}

export function useScan() {
  const { api } = useRankMySeoClient();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const scan = useCallback(
    async (url: string) => {
      setScanning(true);
      setError(null);
      try {
        const target = normalizeHttpUrl(url);
        const res = await api<{ data: ScanResult }>("/scan", {
          method: "POST",
          body: JSON.stringify({ url: target.href }),
        });
        setResult(res.data);
        return res.data;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setScanning(false);
      }
    },
    [api],
  );

  return { result, scanning, error, scan };
}
