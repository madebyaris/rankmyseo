import { scoreColor } from "@/lib/seo";

export function ScoreRing({
  score,
  size = 120,
}: {
  score: number;
  size?: number;
}) {
  const color = scoreColor(score);
  const inner = size - 24;
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${score * 3.6}deg, var(--muted) 0deg)`,
      }}
    >
      <div
        className="flex flex-col items-center justify-center rounded-full bg-card"
        style={{ width: inner, height: inner }}
      >
        <span
          className="text-3xl font-semibold tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}
