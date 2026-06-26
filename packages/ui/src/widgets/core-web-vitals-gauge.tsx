import type { DashboardWidget } from "@rankmyseo/core/schemas";
import { useAudit } from "@rankmyseo/react";

export function CoreWebVitalsGauge({ widget }: { widget: DashboardWidget }) {
  const { audits, loading } = useAudit();
  const cwvChecks =
    audits[0]?.checks.filter((c) => c.ruleId.startsWith("cwv-")) ?? [];

  return (
    <div className="rms-card">
      <h3>{widget.title}</h3>
      {loading ? (
        <p>Loading…</p>
      ) : cwvChecks.length === 0 ? (
        <p>No CWV data yet — enable the on-page collector</p>
      ) : (
        <ul>
          {cwvChecks.map((c) => (
            <li key={c.ruleId}>
              {c.ruleId}: {c.passed ? "pass" : "fail"} — {c.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
