import { useCallback, useState } from "react";
import type { AuditCheckResult, GeneratedMeta } from "@rankmyseo/core";
import { useRankMySeoClient } from "../client.js";

export interface GenerateMetaRequest {
  title: string;
  content?: string;
  targetKeyword?: string;
  url?: string;
  siteName?: string;
}

export interface MetaGenerationResult {
  meta: GeneratedMeta;
  checks: AuditCheckResult[];
  score: number;
}

export function useMetaGenerator() {
  const { api } = useRankMySeoClient();
  const [result, setResult] = useState<MetaGenerationResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(
    async (input: GenerateMetaRequest) => {
      setGenerating(true);
      setError(null);
      try {
        const res = await api<{ data: MetaGenerationResult }>("/meta/generate", {
          method: "POST",
          body: JSON.stringify(input),
        });
        setResult(res.data);
        return res.data;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setGenerating(false);
      }
    },
    [api],
  );

  return { result, generating, error, generate };
}
