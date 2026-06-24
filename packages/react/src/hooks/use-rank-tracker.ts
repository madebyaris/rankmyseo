import { useCallback, useEffect, useState } from "react";
import type { RankSnapshot } from "@rankmyseo/core";
import { useRankMySeoClient } from "../client.js";

export function useRankTracker(keywordId?: string) {
  const { api } = useRankMySeoClient();
  const [snapshots, setSnapshots] = useState<RankSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!keywordId) {
      setSnapshots([]);
      return;
    }
    setLoading(true);
    const from = new Date();
    from.setFullYear(from.getFullYear() - 1);
    const to = new Date();
    const qs = new URLSearchParams({
      keywordId,
      from: from.toISOString(),
      to: to.toISOString(),
    });
    const res = await api<{ data: RankSnapshot[] }>(`/snapshots?${qs}`);
    setSnapshots(res.data);
    setLoading(false);
  }, [api, keywordId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return { snapshots, loading, loadHistory };
}
