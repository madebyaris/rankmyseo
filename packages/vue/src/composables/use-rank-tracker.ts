import { onMounted, ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import type { RankSnapshot } from "@rankmyseo/core/schemas";
import { useRankMySeoClient } from "../plugin.js";

export function useRankTracker(
  keywordId?: MaybeRefOrGetter<string | undefined>,
) {
  const client = useRankMySeoClient();
  const snapshots = ref<RankSnapshot[]>([]);
  const loading = ref(false);

  async function loadHistory() {
    const id = toValue(keywordId);
    if (!id) {
      snapshots.value = [];
      return;
    }
    loading.value = true;
    try {
      const from = new Date();
      from.setFullYear(from.getFullYear() - 1);
      const to = new Date();
      snapshots.value = await client.snapshots.list({
        keywordId: id,
        from: from.toISOString(),
        to: to.toISOString(),
      });
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    void loadHistory();
  });

  watch(
    () => toValue(keywordId),
    () => {
      void loadHistory();
    },
  );

  return { snapshots, loading, loadHistory };
}
