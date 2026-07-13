import { writable, type Writable } from "svelte/store";
import type { RankMySeoClient, CreateKeywordClientInput } from "@rankmyseo/client";
import type { Keyword } from "@rankmyseo/core/schemas";
import { getRankMySeoContext } from "../context.js";

export interface KeywordsStore {
  keywords: Writable<Keyword[]>;
  loading: Writable<boolean>;
  error: Writable<Error | null>;
  refresh: () => Promise<void>;
  addKeyword: (input: CreateKeywordClientInput) => Promise<void>;
}

export function createKeywordsStore(client: RankMySeoClient): KeywordsStore {
  const keywords = writable<Keyword[]>([]);
  const loading = writable(true);
  const error = writable<Error | null>(null);

  async function refresh() {
    loading.set(true);
    error.set(null);
    try {
      keywords.set(await client.keywords.list());
    } catch (e) {
      error.set(e instanceof Error ? e : new Error(String(e)));
    } finally {
      loading.set(false);
    }
  }

  async function addKeyword(input: CreateKeywordClientInput) {
    await client.keywords.create(input);
    await refresh();
  }

  void refresh();

  return { keywords, loading, error, refresh, addKeyword };
}

/** Uses `getRankMySeoContext()` — call during component init. */
export function keywordsStore(): KeywordsStore {
  return createKeywordsStore(getRankMySeoContext());
}
