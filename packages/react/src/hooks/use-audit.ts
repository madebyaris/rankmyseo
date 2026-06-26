import { useCallback, useEffect, useState } from "react";
import type { Audit } from "@rankmyseo/core/schemas";
import { useRankMySeoClient } from "../client.js";

export function useAudit() {
  const { api } = useRankMySeoClient();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await api<{ data: Audit[] }>("/audits");
    setAudits(res.data);
    setLoading(false);
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { audits, loading, refresh };
}
