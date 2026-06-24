import "server-only";

import type { ScheduledJob, Scheduler } from "@rankmyseo/core";

export class ManualScheduler implements Scheduler {
  private jobs = new Map<string, ScheduledJob>();
  readonly runs: string[] = [];

  register(job: ScheduledJob): void {
    this.jobs.set(job.id, job);
  }

  async start(): Promise<void> {
    /* no-op for manual scheduler */
  }

  async stop(): Promise<void> {
    this.jobs.clear();
  }

  async run(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);
    this.runs.push(jobId);
    await job.handler();
  }

  listJobs(): ScheduledJob[] {
    return [...this.jobs.values()];
  }
}
