import { writable, type Writable } from "svelte/store";
import type { RankMySeoClient } from "@rankmyseo/client";
import type {
  BlogWidgetOptions,
  DashboardWidget,
} from "@rankmyseo/core/schemas";
import { parseBlogWidgetOptions } from "@rankmyseo/core/schemas";
import { getRankMySeoContext } from "../context.js";

export interface BlogModuleStore {
  enabled: Writable<boolean>;
  loading: Writable<boolean>;
  widget: Writable<DashboardWidget | undefined>;
  options: Writable<BlogWidgetOptions>;
  enable: (
    opts?: Partial<BlogWidgetOptions>,
  ) => Promise<DashboardWidget | undefined>;
  disable: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function createBlogModuleStore(client: RankMySeoClient): BlogModuleStore {
  const enabled = writable(false);
  const loading = writable(true);
  const widget = writable<DashboardWidget | undefined>(undefined);
  const options = writable<BlogWidgetOptions>(
    parseBlogWidgetOptions(undefined),
  );

  async function refresh() {
    loading.set(true);
    try {
      const status = await client.blogModule.status();
      enabled.set(status.enabled);
      widget.set(status.widget);
      options.set(status.options);
    } finally {
      loading.set(false);
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

  void refresh();

  return { enabled, loading, widget, options, enable, disable, refresh };
}

export function blogModuleStore(): BlogModuleStore {
  return createBlogModuleStore(getRankMySeoContext());
}
