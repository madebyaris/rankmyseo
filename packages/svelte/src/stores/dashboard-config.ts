import { writable, type Writable } from "svelte/store";
import type { RankMySeoClient } from "@rankmyseo/client";
import type { DashboardConfig } from "@rankmyseo/core/schemas";
import { getRankMySeoContext } from "../context.js";

export interface DashboardConfigStore {
  config: Writable<DashboardConfig | null>;
  loading: Writable<boolean>;
  refresh: () => Promise<void>;
  update: (widgets: DashboardConfig["widgets"]) => Promise<void>;
}

export function createDashboardConfigStore(
  client: RankMySeoClient,
): DashboardConfigStore {
  const config = writable<DashboardConfig | null>(null);
  const loading = writable(true);

  async function refresh() {
    loading.set(true);
    try {
      config.set(await client.dashboard.get());
    } finally {
      loading.set(false);
    }
  }

  async function update(widgets: DashboardConfig["widgets"]) {
    config.set(await client.dashboard.update(widgets));
  }

  void refresh();

  return { config, loading, refresh, update };
}

export function dashboardConfigStore(): DashboardConfigStore {
  return createDashboardConfigStore(getRankMySeoContext());
}
