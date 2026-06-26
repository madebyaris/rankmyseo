import { useCallback, useMemo } from "react";
import {
  BLOG_WIDGET_TYPE,
  dashboardHasBlogWidget,
  parseBlogWidgetOptions,
  type BlogWidgetOptions,
  type DashboardWidget,
} from "@rankmyseo/core/schemas";
import { useDashboardConfig } from "./use-dashboard-config.js";

export function useBlogModule() {
  const { config, loading, update } = useDashboardConfig();

  const widget = useMemo(
    () => config?.widgets.find((w) => w.type === BLOG_WIDGET_TYPE),
    [config?.widgets],
  );

  const enabled = dashboardHasBlogWidget(config?.widgets);
  const options = parseBlogWidgetOptions(widget?.options);

  const enable = useCallback(
    async (opts: Partial<BlogWidgetOptions> = {}) => {
      const widgets = config?.widgets ?? [];
      if (dashboardHasBlogWidget(widgets)) return widget;

      const next: DashboardWidget = {
        id: crypto.randomUUID(),
        type: BLOG_WIDGET_TYPE,
        title: opts.labels?.listTitle ?? "Blog",
        query: {},
        options: { ...opts },
      };

      await update([...widgets, next]);
      return next;
    },
    [config?.widgets, update, widget],
  );

  const disable = useCallback(async () => {
    if (!config) return;
    await update(config.widgets.filter((w) => w.type !== BLOG_WIDGET_TYPE));
  }, [config, update]);

  return {
    enabled,
    loading,
    widget,
    options,
    enable,
    disable,
  };
}
