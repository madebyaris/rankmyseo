import { ref } from "vue";
import type { SchemaGeneratorInput } from "@rankmyseo/core";
import type { SchemaGenerationResult } from "@rankmyseo/client";
import { useRankMySeoClient } from "../plugin.js";

export type { SchemaGenerationResult };

export function useSchemaGenerator() {
  const client = useRankMySeoClient();
  const result = ref<SchemaGenerationResult | null>(null);
  const generating = ref(false);
  const error = ref<Error | null>(null);

  async function generate(input: SchemaGeneratorInput) {
    generating.value = true;
    error.value = null;
    try {
      const data = await client.schema.generate(input);
      result.value = data;
      return data;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      error.value = err;
      throw err;
    } finally {
      generating.value = false;
    }
  }

  return { result, generating, error, generate };
}
