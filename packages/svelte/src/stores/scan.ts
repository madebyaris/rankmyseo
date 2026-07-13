import { writable, type Writable } from "svelte/store";
import type { RankMySeoClient, ScanResult } from "@rankmyseo/client";
import { getRankMySeoContext } from "../context.js";

export type { ScanResult };

export interface ScanStore {
  result: Writable<ScanResult | null>;
  scanning: Writable<boolean>;
  error: Writable<Error | null>;
  scan: (url: string) => Promise<ScanResult>;
}

export function createScanStore(client: RankMySeoClient): ScanStore {
  const result = writable<ScanResult | null>(null);
  const scanning = writable(false);
  const error = writable<Error | null>(null);

  async function scan(url: string) {
    scanning.set(true);
    error.set(null);
    try {
      const data = await client.scan.run(url);
      result.set(data);
      return data;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      error.set(err);
      throw err;
    } finally {
      scanning.set(false);
    }
  }

  return { result, scanning, error, scan };
}

export function scanStore(): ScanStore {
  return createScanStore(getRankMySeoContext());
}
