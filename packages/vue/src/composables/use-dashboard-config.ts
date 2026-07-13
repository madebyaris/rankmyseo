import { onMounted, ref } from "vue";
import type { DashboardConfig } from "@rankmyseo/core/schemas";
import { useRankMySeoClient } from "../plugin.js";

export function useDashboardConfig() {
  const client = useRankMySeoClient();
  const config = ref<DashboardConfig | null>(null);
  const loading = ref(true);

  async function refresh() {
    loading.value = true;
    try {
      config.value = await client.dashboard.get();
    } finally {
      loading.value = false;
    }
  }

  async function update(widgets: DashboardConfig["widgets"]) {
    config.value = await client.dashboard.update(widgets);
  }

  onMounted(() => {
    void refresh();
  });

  return { config, loading, refresh, update };
}
