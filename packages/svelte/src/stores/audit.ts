import { writable, type Writable } from "svelte/store";
import type { RankMySeoClient } from "@rankmyseo/client";
import type { Audit } from "@rankmyseo/core/schemas";
import { getRankMySeoContext } from "../context.js";

export interface AuditStore {
  audits: Writable<Audit[]>;
  loading: Writable<boolean>;
  refresh: () => Promise<void>;
}

export function createAuditStore(client: RankMySeoClient): AuditStore {
  const audits = writable<Audit[]>([]);
  const loading = writable(true);

  async function refresh() {
    loading.set(true);
    try {
      audits.set(await client.audits.list());
    } finally {
      loading.set(false);
    }
  }

  void refresh();

  return { audits, loading, refresh };
}

export function auditStore(): AuditStore {
  return createAuditStore(getRankMySeoContext());
}
