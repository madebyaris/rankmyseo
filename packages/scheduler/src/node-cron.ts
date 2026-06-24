import "server-only";

import cron, { type ScheduledTask } from "node-cron";
import type { ScheduledJob, Scheduler } from "@rankmyseo/core";

export class NodeCronScheduler implements Scheduler {
  private jobs = new Map<string, ScheduledJob>();
  private tasks = new Map<string, ScheduledTask>();

  register(job: ScheduledJob): void {
    this.jobs.set(job.id, job);
  }

  async start(): Promise<void> {
    for (const job of this.jobs.values()) {
      if (this.tasks.has(job.id)) continue;
      const task = cron.schedule(job.cron, () => {
        void job.handler();
      });
      this.tasks.set(job.id, task);
    }
  }

  async stop(): Promise<void> {
    for (const task of this.tasks.values()) {
      task.stop();
    }
    this.tasks.clear();
  }
}
