import type {
  PositionQuery,
  RankDataSource,
  RankStore,
  Scheduler,
} from "@rankmyseo/core";
import { ingestPositions } from "@rankmyseo/core";
import type { ManualScheduler } from "./manual.js";

export interface IngestionJobOptions {
  id?: string;
  cron?: string;
  dataSource: RankDataSource;
  store: RankStore;
  getQuery: () => Promise<PositionQuery>;
}

export function registerIngestionJob(
  scheduler: Scheduler,
  options: IngestionJobOptions,
): void {
  scheduler.register({
    id: options.id ?? "rank-ingestion",
    cron: options.cron ?? "0 6 * * *",
    handler: async () => {
      const query = await options.getQuery();
      await ingestPositions(options.dataSource, options.store, query);
    },
  });
}

export async function runIngestionNow(
  scheduler: ManualScheduler,
  jobId = "rank-ingestion",
): Promise<void> {
  await scheduler.run(jobId);
}
