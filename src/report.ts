import type { WeeklySummary } from "./types.js";

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
  t: (key: string) => string;
  tf: (key: string, vars: Record<string, string | number>) => string;
  locale: string;
}

export function exportWeeklyReport(deps: ExportWeeklyReportDeps): void {
  const now = new Date();
  const lines = [
    "# DevTasker Weekly Report",
    "",
    deps.tf("report.generated", { value: now.toLocaleString(deps.locale) }),
    deps.tf("report.weekStart", { value: new Date(deps.summary.weekStart).toLocaleDateString(deps.locale) }),
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
    ...formatAsList(deps.topBlockers, deps.t("report.noBlockers")),
    "",
    "## Next up",
    ...formatAsList(deps.nextUpItems, deps.t("report.noSuggestions"))
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const filename = `devtasker-weekly-${now.toISOString().slice(0, 10)}.md`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  deps.showToast(deps.tf("report.exported", { filename }));
}
