import { onMounted, ref } from "vue";
import type {
  BlogWidgetOptions,
  DashboardWidget,
} from "@rankmyseo/core/schemas";
import { parseBlogWidgetOptions } from "@rankmyseo/core/schemas";
import { useRankMySeoClient } from "../plugin.js";

export function useBlogModule() {
  const client = useRankMySeoClient();
  const enabled = ref(false);
  const loading = ref(true);
  const widget = ref<DashboardWidget | undefined>();
  const options = ref<BlogWidgetOptions>(parseBlogWidgetOptions(undefined));

  async function refresh() {
    loading.value = true;
    try {
      const status = await client.blogModule.status();
      enabled.value = status.enabled;
      widget.value = status.widget;
      options.value = status.options;
    } finally {
      loading.value = false;
    }
  }

  async function enable(opts: Partial<BlogWidgetOptions> = {}) {
    const next = await client.blogModule.enable(opts);
    await refresh();
    return next;
  }

  async function disable() {
    await client.blogModule.disable();
    await refresh();
  }

  onMounted(() => {
    void refresh();
  });

  return {
    enabled,
    loading,
    widget,
    options,
    enable,
    disable,
  };
}
