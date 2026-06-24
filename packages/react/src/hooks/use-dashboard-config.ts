import { useCallback, useEffect, useState } from "react";
import type { DashboardConfig } from "@rankmyseo/core";
import { useRankMySeoClient } from "../client.js";

export function useDashboardConfig() {
  const { api } = useRankMySeoClient();
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await api<{ data: DashboardConfig | null }>("/dashboard");
    setConfig(res.data);
    setLoading(false);
  }, [api]);

  const update = useCallback(
    async (widgets: DashboardConfig["widgets"]) => {
      const res = await api<{ data: DashboardConfig }>("/dashboard", {
        method: "PUT",
        body: JSON.stringify({ widgets }),
      });
      setConfig(res.data);
    },
    [api],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { config, loading, refresh, update };
}
