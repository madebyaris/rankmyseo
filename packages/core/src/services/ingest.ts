import type { PositionQuery, RankDataSource, RankStore } from "../ports/index.js";
import type { RankSnapshot } from "../schemas/index.js";

export interface IngestResult {
  appended: number;
  snapshots: RankSnapshot[];
}

export async function ingestPositions(
  dataSource: RankDataSource,
  store: RankStore,
  query: PositionQuery,
): Promise<IngestResult> {
  const inputs = await dataSource.fetchPositions(query);
  const snapshots: RankSnapshot[] = [];

  for (const input of inputs) {
    const snapshot = await store.snapshots.append(input);
    snapshots.push(snapshot);
  }

  return { appended: snapshots.length, snapshots };
}
