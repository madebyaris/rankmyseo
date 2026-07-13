import { writable, type Writable } from "svelte/store";
import type { RankMySeoClient } from "@rankmyseo/client";
import type { Report } from "@rankmyseo/core/schemas";
import { getRankMySeoContext } from "../context.js";

export interface ReportStore {
  reports: Writable<Report[]>;
  loading: Writable<boolean>;
  refresh: () => Promise<void>;
  generate: (input: {
    title: string;
    from: string;
    to: string;
  }) => Promise<void>;
}

export function createReportStore(client: RankMySeoClient): ReportStore {
  const reports = writable<Report[]>([]);
  const loading = writable(true);

  async function refresh() {
    loading.set(true);
    try {
      reports.set(await client.reports.list());
    } finally {
      loading.set(false);
    }
  }

  async function generate(input: {
    title: string;
    from: string;
    to: string;
  }) {
    await client.reports.create(input);
    await refresh();
  }

  void refresh();

  return { reports, loading, refresh, generate };
}

export function reportStore(): ReportStore {
  return createReportStore(getRankMySeoContext());
}
