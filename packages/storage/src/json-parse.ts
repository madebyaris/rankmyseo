import type { AuditCheckResult, ReportSummary } from "@rankmyseo/core";

/** Parse JSON stored as text (SQLite) or already-decoded jsonb (Postgres). */
export function parseJsonValue<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return raw as T;
}

export function parseTags(raw: unknown): string[] {
  const parsed = parseJsonValue<unknown>(raw, []);
  return Array.isArray(parsed)
    ? parsed.filter((t): t is string => typeof t === "string")
    : [];
}

export function parseChecks(raw: unknown): AuditCheckResult[] {
  const parsed = parseJsonValue<unknown>(raw, []);
  return Array.isArray(parsed) ? (parsed as AuditCheckResult[]) : [];
}

export function parseSummary(raw: unknown): ReportSummary | undefined {
  if (raw == null) return undefined;
  const parsed = parseJsonValue<unknown>(raw, undefined);
  if (parsed == null || typeof parsed !== "object") return undefined;
  return parsed as ReportSummary;
}

export function parseSerpFeatures(
  raw: unknown,
): Record<string, unknown> | undefined {
  if (raw == null) return undefined;
  const parsed = parseJsonValue<unknown>(raw, undefined);
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return undefined;
  }
  return parsed as Record<string, unknown>;
}
