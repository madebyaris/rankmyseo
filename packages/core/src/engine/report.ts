import { randomUUID } from "node:crypto";
import type {
  Audit,
  Keyword,
  RankSnapshot,
  Report,
  ReportSummary,
  TenantScope,
} from "../schemas/index.js";

export interface BuildReportInput extends TenantScope {
  title: string;
  from: Date;
  to: Date;
  keywords: Keyword[];
  snapshots: RankSnapshot[];
  audits: Audit[];
}

function latestSnapshotPerKeyword(
  snapshots: RankSnapshot[],
): Map<string, RankSnapshot> {
  const map = new Map<string, RankSnapshot>();
  for (const snap of snapshots) {
    const existing = map.get(snap.keywordId);
    if (!existing || snap.capturedAt > existing.capturedAt) {
      map.set(snap.keywordId, snap);
    }
  }
  return map;
}

function earliestSnapshotInWindow(
  snapshots: RankSnapshot[],
  from: Date,
): Map<string, RankSnapshot> {
  const map = new Map<string, RankSnapshot>();
  for (const snap of snapshots) {
    if (snap.capturedAt < from) continue;
    const existing = map.get(snap.keywordId);
    if (!existing || snap.capturedAt < existing.capturedAt) {
      map.set(snap.keywordId, snap);
    }
  }
  return map;
}

export function buildReportSummary(input: {
  keywords: Keyword[];
  snapshots: RankSnapshot[];
  audits: Audit[];
  from: Date;
  to: Date;
}): ReportSummary {
  const latest = latestSnapshotPerKeyword(input.snapshots);
  const earliest = earliestSnapshotInWindow(input.snapshots, input.from);

  const movers = input.keywords
    .map((kw) => {
      const prev = earliest.get(kw.id)?.position ?? null;
      const curr = latest.get(kw.id)?.position ?? null;
      if (prev === null || curr === null) return null;
      const delta = prev - curr;
      return {
        keywordId: kw.id,
        keywordText: kw.text,
        previousPosition: prev,
        currentPosition: curr,
        delta,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 10);

  const deltas = movers.map((m) => m.delta);
  const avgPositionDelta =
    deltas.length > 0
      ? Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10
      : undefined;

  const auditScoreTrend = input.audits
    .filter((a) => a.createdAt >= input.from && a.createdAt <= input.to)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((a) => ({ date: a.createdAt, score: a.score }));

  return {
    topMovers: movers,
    avgPositionDelta,
    auditScoreTrend,
  };
}

export function buildReport(input: BuildReportInput): Omit<Report, "createdAt"> {
  const summary = buildReportSummary({
    keywords: input.keywords,
    snapshots: input.snapshots,
    audits: input.audits,
    from: input.from,
    to: input.to,
  });

  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    projectId: input.projectId,
    title: input.title,
    from: input.from,
    to: input.to,
    summary,
  };
}
