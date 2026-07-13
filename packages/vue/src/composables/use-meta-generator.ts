import { ref } from "vue";
import type {
  MetaGenerationResult,
} from "@rankmyseo/client";
import { useRankMySeoClient } from "../plugin.js";

export interface GenerateMetaRequest {
  title: string;
  content?: string;
  targetKeyword?: string;
  url?: string;
  siteName?: string;
}

export type { MetaGenerationResult };

export function useMetaGenerator() {
  const client = useRankMySeoClient();
  const result = ref<MetaGenerationResult | null>(null);
  const generating = ref(false);
  const error = ref<Error | null>(null);

  async function generate(input: GenerateMetaRequest) {
    generating.value = true;
    error.value = null;
    try {
      const data = await client.meta.generate(input);
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
