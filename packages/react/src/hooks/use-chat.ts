import { useCallback, useState } from "react";
import { useRankMySeoClient } from "../client.js";

export function useRankMySeoChat() {
  const { baseUrl, tenantId, projectId, token, fetchImpl } = useRankMySeoClient();
  const [streaming, setStreaming] = useState(false);
  const fetchFn = fetchImpl ?? fetch;

  const sendMessage = useCallback(
    async (messages: Array<{ role: "user" | "assistant" | "system"; content: string }>) => {
      setStreaming(true);
      try {
        const headers: Record<string, string> = {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
          "x-project-id": projectId,
        };
        if (token) headers.authorization = `Bearer ${token}`;

        const res = await fetchFn(`${baseUrl}/agent/chat`, {
          method: "POST",
          headers,
          body: JSON.stringify({ messages }),
        });

        if (!res.ok) throw new Error(`Chat error: ${res.status}`);
        return res.text();
      } finally {
        setStreaming(false);
      }
    },
    [baseUrl, tenantId, projectId, token, fetchFn],
  );

  return { sendMessage, streaming };
}
