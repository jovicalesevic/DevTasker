function formatAsList(items, fallback) {
    if (!items.length)
        return [`- ${fallback}`];
    return items.map((item) => `- ${item}`);
}
export function exportWeeklyReport(deps) {
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
