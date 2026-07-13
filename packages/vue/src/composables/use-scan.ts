import { ref } from "vue";
import type {
  ScanResult,
} from "@rankmyseo/client";
import { useRankMySeoClient } from "../plugin.js";

export type { ScanResult };

export function useScan() {
  const client = useRankMySeoClient();
  const result = ref<ScanResult | null>(null);
  const scanning = ref(false);
  const error = ref<Error | null>(null);

  async function scan(url: string) {
    scanning.value = true;
    error.value = null;
    try {
      const data = await client.scan.run(url);
      result.value = data;
      return data;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      error.value = err;
      throw err;
    } finally {
      scanning.value = false;
    }
  }

  return { result, scanning, error, scan };
}
