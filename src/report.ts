import type { WeeklySummary } from "./types";

function formatAsList(items: string[], fallback: string): string[] {
  if (!items.length) return [`- ${fallback}`];
  return items.map((item) => `- ${item}`);
}

interface ExportWeeklyReportDeps {
  summary: WeeklySummary;
  avgLeadTimeHours: number;
  worklogStreakDays: number;
  weeklyTrend: string;
  topBlockers: string[];
  nextUpItems: string[];
  showToast: (message: string) => void;
}

export function exportWeeklyReport(deps: ExportWeeklyReportDeps): void {
  const now = new Date();
  const lines = [
    "# DevTasker Weekly Report",
    "",
    `Generated: ${now.toLocaleString("en-US")}`,
    `Week start: ${new Date(deps.summary.weekStart).toLocaleDateString("en-US")}`,
    "",
    "## Summary",
    deps.summary.content,
    "",
    "## Analytics",
    `- Avg lead time: ${deps.avgLeadTimeHours}h`,
    `- Worklog streak: ${deps.worklogStreakDays} days`,
    `- Weekly trend: ${deps.weeklyTrend}`,
    "",
    "## Top blockers",
    ...formatAsList(deps.topBlockers, "No blockers"),
    "",
    "## Next up",
    ...formatAsList(deps.nextUpItems, "No suggestions for today.")
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const filename = `devtasker-weekly-${now.toISOString().slice(0, 10)}.md`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  deps.showToast(`Report exported: ${filename}`);
}
