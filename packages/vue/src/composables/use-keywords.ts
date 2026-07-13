import { onMounted, ref } from "vue";
import type { Keyword } from "@rankmyseo/core/schemas";
import type { CreateKeywordClientInput } from "@rankmyseo/client";
import { useRankMySeoClient } from "../plugin.js";

export function useKeywords() {
  const client = useRankMySeoClient();
  const keywords = ref<Keyword[]>([]);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  async function refresh() {
    loading.value = true;
    error.value = null;
    try {
      keywords.value = await client.keywords.list();
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
    } finally {
      loading.value = false;
    }
  }

  async function addKeyword(input: CreateKeywordClientInput) {
    await client.keywords.create(input);
    await refresh();
  }

  onMounted(() => {
    void refresh();
  });

  return { keywords, loading, error, refresh, addKeyword };
}
