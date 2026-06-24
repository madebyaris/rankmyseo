import { createDefaultDataSource } from "@rankmyseo/datasource";
import { ingestPositions } from "@rankmyseo/core";
import { ManualScheduler, registerIngestionJob } from "@rankmyseo/scheduler";
import type { RankMySeoConfig } from "@rankmyseo/core";
import type { RankStore } from "@rankmyseo/core";

export async function runScheduledIngestion(
  config: RankMySeoConfig,
  store: RankStore,
): Promise<{ appended: number }> {
  const dataSource = createDefaultDataSource({
    configs: config.dataSources,
  });
  const keywords = await store.keywords.list({
    tenantId: config.tenantId,
    projectId: config.projectId,
  });

  const result = await ingestPositions(dataSource, store, {
    tenantId: config.tenantId,
    projectId: config.projectId,
    keywordIds: keywords.map((k) => k.id),
    country: "us",
    device: "desktop",
  });

  return { appended: result.appended };
}

export function createSchedulerWithIngestion(
  config: RankMySeoConfig,
  store: RankStore,
): ManualScheduler {
  const scheduler = new ManualScheduler();
  const dataSource = createDefaultDataSource({ configs: config.dataSources });

  registerIngestionJob(scheduler, {
    cron: config.schedule.cron,
    dataSource,
    store,
    getQuery: async () => {
      const keywords = await store.keywords.list({
        tenantId: config.tenantId,
        projectId: config.projectId,
      });
      return {
        tenantId: config.tenantId,
        projectId: config.projectId,
        keywordIds: keywords.map((k) => k.id),
        country: "us",
        device: "desktop",
      };
    },
  });

  return scheduler;
}
