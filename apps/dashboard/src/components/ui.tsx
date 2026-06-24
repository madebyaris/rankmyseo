import type { ReactNode } from "react";

export function scoreColor(score: number): string {
  if (score >= 90) return "#16a34a";
  if (score >= 70) return "#65a30d";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

export function ScoreRing({ score, label }: { score: number; label?: string }) {
  const color = scoreColor(score);
  return (
    <div
      className="score-ring"
      style={{
        background: `conic-gradient(${color} ${score * 3.6}deg, #e5e7eb 0deg)`,
      }}
    >
      <div className="score-ring-inner">
        <strong style={{ color }}>{score}</strong>
        {label ? <span>{label}</span> : null}
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red" | "blue";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function priorityTone(
  priority: "high" | "medium" | "low",
): "red" | "amber" | "blue" {
  if (priority === "high") return "red";
  if (priority === "medium") return "amber";
  return "blue";
}

export function Card({
  title,
  subtitle,
  children,
  actions,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="card">
      {(title || actions) && (
        <header className="card-head">
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p className="muted">{subtitle}</p> : null}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>;
}
