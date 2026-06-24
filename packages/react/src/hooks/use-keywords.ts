import { useCallback, useEffect, useState } from "react";
import type { Keyword } from "@rankmyseo/core";
import { useRankMySeoClient } from "../client.js";

export function useKeywords() {
  const { api } = useRankMySeoClient();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ data: Keyword[] }>("/keywords");
      setKeywords(res.data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addKeyword = useCallback(
    async (input: { text: string; country?: string; device?: "desktop" | "mobile" }) => {
      await api("/keywords", {
        method: "POST",
        body: JSON.stringify({ ...input, tags: [] }),
      });
      await refresh();
    },
    [api, refresh],
  );

  return { keywords, loading, error, refresh, addKeyword };
}
