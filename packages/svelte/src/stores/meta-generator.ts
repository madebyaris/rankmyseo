import { writable, type Writable } from "svelte/store";
import type { RankMySeoClient, MetaGenerationResult } from "@rankmyseo/client";
import { getRankMySeoContext } from "../context.js";

export interface GenerateMetaRequest {
  title: string;
  content?: string;
  targetKeyword?: string;
  url?: string;
  siteName?: string;
}

export type { MetaGenerationResult };

export interface MetaGeneratorStore {
  result: Writable<MetaGenerationResult | null>;
  generating: Writable<boolean>;
  error: Writable<Error | null>;
  generate: (input: GenerateMetaRequest) => Promise<MetaGenerationResult>;
}

export function createMetaGeneratorStore(
  client: RankMySeoClient,
): MetaGeneratorStore {
  const result = writable<MetaGenerationResult | null>(null);
  const generating = writable(false);
  const error = writable<Error | null>(null);

  async function generate(input: GenerateMetaRequest) {
    generating.set(true);
    error.set(null);
    try {
      const data = await client.meta.generate(input);
      result.set(data);
      return data;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      error.set(err);
      throw err;
    } finally {
      generating.set(false);
    }
  }

  return { result, generating, error, generate };
}

export function metaGeneratorStore(): MetaGeneratorStore {
  return createMetaGeneratorStore(getRankMySeoContext());
}
