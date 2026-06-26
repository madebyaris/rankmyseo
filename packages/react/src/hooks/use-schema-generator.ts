import { useCallback, useState } from "react";
import type { GeneratedSchema } from "@rankmyseo/core/schemas";
import type { SchemaGeneratorInput } from "@rankmyseo/core";
import { useRankMySeoClient } from "../client.js";

export interface SchemaGenerationResult {
  schema: GeneratedSchema;
}

export function useSchemaGenerator() {
  const { api } = useRankMySeoClient();
  const [result, setResult] = useState<SchemaGenerationResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(
    async (input: SchemaGeneratorInput) => {
      setGenerating(true);
      setError(null);
      try {
        const res = await api<{ data: SchemaGenerationResult }>("/schema/generate", {
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
