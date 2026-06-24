import type { KeywordIntent, Recommendation } from "@rankmyseo/core";

/** Color for the audit score ring (genuine status data-viz, hence explicit). */
export function scoreColor(score: number): string {
  if (score >= 90) return "oklch(0.7 0.17 155)";
  if (score >= 70) return "oklch(0.75 0.16 130)";
  if (score >= 50) return "oklch(0.78 0.15 75)";
  return "oklch(0.63 0.22 25)";
}

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost";

export function priorityVariant(
  priority: Recommendation["priority"],
): BadgeVariant {
  if (priority === "high") return "destructive";
  if (priority === "medium") return "default";
  return "secondary";
}

export function intentVariant(intent: KeywordIntent): BadgeVariant {
  switch (intent) {
    case "commercial":
      return "default";
    case "transactional":
      return "secondary";
    default:
      return "outline";
  }
}
