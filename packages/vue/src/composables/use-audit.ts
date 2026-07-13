import { onMounted, ref } from "vue";
import type { Audit } from "@rankmyseo/core/schemas";
import { useRankMySeoClient } from "../plugin.js";

export function useAudit() {
  const client = useRankMySeoClient();
  const audits = ref<Audit[]>([]);
  const loading = ref(true);

  async function refresh() {
    loading.value = true;
    try {
      audits.value = await client.audits.list();
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    void refresh();
  });

  return { audits, loading, refresh };
}
