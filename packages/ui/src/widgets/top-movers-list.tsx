import type { DashboardWidget } from "@rankmyseo/core";
import { useReport } from "@rankmyseo/react";

export function TopMoversList({ widget }: { widget: DashboardWidget }) {
  const { reports, loading } = useReport();
  const movers = reports[0]?.summary?.topMovers ?? [];

  return (
    <div className="rms-card">
      <h3>{widget.title}</h3>
      {loading ? (
        <p>Loading…</p>
      ) : movers.length === 0 ? (
        <p>No movers in latest report</p>
      ) : (
        <ul>
          {movers.map((m) => (
            <li key={m.keywordId}>
              {m.keywordText}{" "}
              <span className="rms-badge">
                {m.previousPosition} → {m.currentPosition} ({m.delta > 0 ? "+" : ""}
                {m.delta})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
