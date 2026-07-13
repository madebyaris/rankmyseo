import { writable, type Writable } from "svelte/store";
import type { SchemaGeneratorInput } from "@rankmyseo/core";
import type { RankMySeoClient, SchemaGenerationResult } from "@rankmyseo/client";
import { getRankMySeoContext } from "../context.js";

export type { SchemaGenerationResult };

export interface SchemaGeneratorStore {
  result: Writable<SchemaGenerationResult | null>;
  generating: Writable<boolean>;
  error: Writable<Error | null>;
  generate: (input: SchemaGeneratorInput) => Promise<SchemaGenerationResult>;
}

export function createSchemaGeneratorStore(
  client: RankMySeoClient,
): SchemaGeneratorStore {
  const result = writable<SchemaGenerationResult | null>(null);
  const generating = writable(false);
  const error = writable<Error | null>(null);

  async function generate(input: SchemaGeneratorInput) {
    generating.set(true);
    error.set(null);
    try {
      const data = await client.schema.generate(input);
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

export function schemaGeneratorStore(): SchemaGeneratorStore {
  return createSchemaGeneratorStore(getRankMySeoContext());
}
