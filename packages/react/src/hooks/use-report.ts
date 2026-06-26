import { useCallback, useEffect, useState } from "react";
import type { Report } from "@rankmyseo/core/schemas";
import { useRankMySeoClient } from "../client.js";

export function useReport() {
  const { api } = useRankMySeoClient();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await api<{ data: Report[] }>("/reports");
    setReports(res.data);
    setLoading(false);
  }, [api]);

  const generate = useCallback(
    async (input: { title: string; from: string; to: string }) => {
      await api("/reports", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await refresh();
    },
    [api, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { reports, loading, refresh, generate };
}
