import type { DashboardWidget } from "@rankmyseo/core";
import { KeywordTable } from "./widgets/keyword-table.js";
import { RankHistoryChart } from "./widgets/rank-history-chart.js";
import { AuditScoreCard } from "./widgets/audit-score-card.js";
import { TopMoversList } from "./widgets/top-movers-list.js";
import { CoreWebVitalsGauge } from "./widgets/core-web-vitals-gauge.js";

export const widgetRegistry = {
  KeywordTable,
  RankHistoryChart,
  AuditScoreCard,
  TopMoversList,
  CoreWebVitalsGauge,
} as const;

export type WidgetType = keyof typeof widgetRegistry;

export function DashboardRenderer({ widgets }: { widgets: DashboardWidget[] }) {
  return (
    <div className="rms-grid">
      {widgets.map((widget) => {
        const Component = widgetRegistry[widget.type as WidgetType];
        if (!Component) {
          return (
            <div key={widget.id} className="rms-card">
              <h3>{widget.title}</h3>
              <p>Unknown widget type: {widget.type}</p>
            </div>
          );
        }
        return <Component key={widget.id} widget={widget} />;
      })}
    </div>
  );
}
