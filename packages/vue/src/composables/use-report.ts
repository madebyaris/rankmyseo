import { onMounted, ref } from "vue";
import type { Report } from "@rankmyseo/core/schemas";
import { useRankMySeoClient } from "../plugin.js";

export function useReport() {
  const client = useRankMySeoClient();
  const reports = ref<Report[]>([]);
  const loading = ref(true);

  async function refresh() {
    loading.value = true;
    try {
      reports.value = await client.reports.list();
    } finally {
      loading.value = false;
    }
  }

  async function generate(input: { title: string; from: string; to: string }) {
    await client.reports.create(input);
    await refresh();
  }

  onMounted(() => {
    void refresh();
  });

  return { reports, loading, refresh, generate };
}
