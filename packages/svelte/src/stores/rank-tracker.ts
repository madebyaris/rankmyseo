import { writable, type Writable } from "svelte/store";
import type { RankMySeoClient } from "@rankmyseo/client";
import type { RankSnapshot } from "@rankmyseo/core/schemas";
import { getRankMySeoContext } from "../context.js";

export interface RankTrackerStore {
  snapshots: Writable<RankSnapshot[]>;
  loading: Writable<boolean>;
  loadHistory: () => Promise<void>;
}

export function createRankTrackerStore(
  client: RankMySeoClient,
  keywordId?: string,
): RankTrackerStore {
  const snapshots = writable<RankSnapshot[]>([]);
  const loading = writable(false);

  async function loadHistory() {
    if (!keywordId) {
      snapshots.set([]);
      return;
    }
    loading.set(true);
    try {
      const from = new Date();
      from.setFullYear(from.getFullYear() - 1);
      const to = new Date();
      snapshots.set(
        await client.snapshots.list({
          keywordId,
          from: from.toISOString(),
          to: to.toISOString(),
        }),
      );
    } finally {
      loading.set(false);
    }
  }

  void loadHistory();

  return { snapshots, loading, loadHistory };
}

export function rankTrackerStore(keywordId?: string): RankTrackerStore {
  return createRankTrackerStore(getRankMySeoContext(), keywordId);
}
