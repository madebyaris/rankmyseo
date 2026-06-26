import type { DashboardWidget } from "@rankmyseo/core/schemas";
import { useKeywords } from "@rankmyseo/react";

export function KeywordTable({ widget }: { widget: DashboardWidget }) {
  const { keywords, loading } = useKeywords();

  return (
    <div className="rms-card">
      <h3>{widget.title}</h3>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="rms-table">
          <thead>
            <tr>
              <th>Keyword</th>
              <th>Country</th>
              <th>Device</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((kw) => (
              <tr key={kw.id}>
                <td>{kw.text}</td>
                <td>{kw.country}</td>
                <td>{kw.device}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
