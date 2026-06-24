import type { DashboardWidget } from "@rankmyseo/core";
import { useAudit } from "@rankmyseo/react";

export function AuditScoreCard({ widget }: { widget: DashboardWidget }) {
  const { audits, loading } = useAudit();
  const latest = audits[0];

  return (
    <div className="rms-card">
      <h3>{widget.title}</h3>
      {loading ? (
        <p>Loading…</p>
      ) : latest ? (
        <>
          <div className="rms-score">{latest.score}</div>
          <p>{latest.url}</p>
          <p>{latest.checks.filter((c) => !c.passed).length} issues</p>
        </>
      ) : (
        <p>No audits yet</p>
      )}
    </div>
  );
}
