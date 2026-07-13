import { createDefaultDataSource } from "@rankmyseo/datasource";
import { ingestPositions } from "@rankmyseo/core";
import { ManualScheduler, registerIngestionJob } from "@rankmyseo/scheduler";
import type { RankMySeoConfig } from "@rankmyseo/core";
import type { RankStore } from "@rankmyseo/core";

function groupKeywords(
  keywords: Array<{ id: string; text: string; country: string; device: "desktop" | "mobile" }>,
) {
  const groups = new Map<
    string,
    {
      country: string;
      device: "desktop" | "mobile";
      keywords: Array<{ id: string; text: string }>;
    }
  >();
  for (const keyword of keywords) {
    const key = `${keyword.country}:${keyword.device}`;
    const existing = groups.get(key);
    if (existing) {
      existing.keywords.push({ id: keyword.id, text: keyword.text });
    } else {
      groups.set(key, {
        country: keyword.country,
        device: keyword.device,
        keywords: [{ id: keyword.id, text: keyword.text }],
      });
    }
  }
  return [...groups.values()];
}

export async function runScheduledIngestion(
  config: RankMySeoConfig,
  store: RankStore,
): Promise<{ appended: number; skipped?: boolean }> {
  if (!config.schedule.enabled) {
    return { appended: 0, skipped: true };
  }

  const projects = await store.projects.list({
    tenantId: config.tenantId,
    projectId: config.projectId,
  });
  const siteUrl = projects[0]?.domain
    ? projects[0].domain.startsWith("http")
      ? projects[0].domain
      : `https://${projects[0].domain}`
    : undefined;

  const keywords = await store.keywords.list({
    tenantId: config.tenantId,
    projectId: config.projectId,
  });

  const dataSource = createDefaultDataSource({
    configs: config.dataSources,
    siteUrl,
    keywords: keywords.map((k) => ({ id: k.id, text: k.text })),
  });

  let appended = 0;
  for (const group of groupKeywords(keywords)) {
    const result = await ingestPositions(dataSource, store, {
      tenantId: config.tenantId,
      projectId: config.projectId,
      keywordIds: group.keywords.map((k) => k.id),
      country: group.country,
      device: group.device,
    });
    appended += result.appended;
  }

  return { appended };
}

export function createSchedulerWithIngestion(
  config: RankMySeoConfig,
  store: RankStore,
): ManualScheduler {
  const scheduler = new ManualScheduler();
  if (!config.schedule.enabled) {
    return scheduler;
  }

  registerIngestionJob(scheduler, {
    cron: config.schedule.cron,
    dataSource: createDefaultDataSource({ configs: config.dataSources }),
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
        country: keywords[0]?.country ?? "us",
        device: keywords[0]?.device ?? "desktop",
      };
    },
  });

  return scheduler;
}
