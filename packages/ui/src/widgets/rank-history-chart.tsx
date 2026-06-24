import type { DashboardWidget } from "@rankmyseo/core";
import { useRankTracker } from "@rankmyseo/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function RankHistoryChart({ widget }: { widget: DashboardWidget }) {
  const keywordId = String(widget.query.keywordId ?? "");
  const { snapshots, loading } = useRankTracker(keywordId || undefined);

  const data = snapshots.map((s) => ({
    date: new Date(s.capturedAt).toLocaleDateString(),
    position: s.position ?? 0,
  }));

  return (
    <div className="rms-card">
      <h3>{widget.title}</h3>
      {loading || data.length === 0 ? (
        <p>{loading ? "Loading…" : "No rank history yet"}</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <XAxis dataKey="date" />
            <YAxis reversed domain={[1, "auto"]} />
            <Tooltip />
            <Line type="monotone" dataKey="position" stroke="#4f46e5" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
