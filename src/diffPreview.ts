import type { AppState, DiffMode } from "./types";

export function renderDiffPreviewHtml(preview: string, escapeHtml: (value: string) => string): string {
  return preview
    .split("\n")
    .map((line) => {
      const safe = escapeHtml(line)
        .replace(/(^|[\s(])\+(\d+)\b/g, `$1<span class="diff-plus">+$2</span>`)
        .replace(/(^|[\s(])-(\d+)\b/g, `$1<span class="diff-minus">-$2</span>`)
        .replace(/(^|[\s(])~(\d+)\b/g, `$1<span class="diff-updated">~$2</span>`);
      return `<div class="diff-line">${safe}</div>`;
    })
    .join("");
}

export function buildDiffPreview(
  current: AppState,
  incoming: AppState,
  mode: DiffMode,
  detailLevel: "compact" | "detailed",
  formatDay: (value: string) => string
): string {
  const taskTitle = (taskId: string): string => {
    const fromIncoming = incoming.tasks.find((item) => item.id === taskId);
    if (fromIncoming) return fromIncoming.title;
    const fromCurrent = current.tasks.find((item) => item.id === taskId);
    return fromCurrent?.title || taskId;
  };
  const proj = countDiffDetailed(current.projects, incoming.projects, mode, (item) => item.name || item.id);
  const tasks = countDiffDetailed(current.tasks, incoming.tasks, mode, (item) => item.title || item.id);
  const sessions = countDiffDetailed(current.sessions, incoming.sessions, mode, (item) => `${taskTitle(item.taskId)} (${formatDay(item.startedAt.slice(0, 10))})`);
  const pending = countDiffDetailed(current.pendingSessions, incoming.pendingSessions, mode, (item) => `${taskTitle(item.taskId)} (${item.minutes}m)`);
  const reminders = countDiffDetailed(current.reminders, incoming.reminders, mode, (item) => `${item.type.toUpperCase()} - ${taskTitle(item.taskId)}`);
  const weekly = countDiffDetailed(current.weeklySummaries, incoming.weeklySummaries, mode, (item) => new Date(item.weekStart).toLocaleDateString("en-US"));
  return [
    ...formatDiffSection("Projects", proj, detailLevel),
    ...formatDiffSection("Tasks", tasks, detailLevel),
    ...formatDiffSection("Sessions", sessions, detailLevel),
    ...formatDiffSection("Pending sessions", pending, detailLevel),
    ...formatDiffSection("Reminders", reminders, detailLevel),
    ...formatDiffSection("Weekly summaries", weekly, detailLevel)
  ].join("\n");
}

function countDiffDetailed<T extends { id: string }>(
  current: T[],
  incoming: T[],
  mode: DiffMode,
  label: (item: T) => string
): { added: number; removed: number; updated: number; sampleAdded: string[]; sampleRemoved: string[]; sampleUpdated: string[] } {
  const currentMap = new Map(current.map((item) => [item.id, item]));
  const incomingMap = new Map(incoming.map((item) => [item.id, item]));
  const sampleAdded: string[] = [];
  const sampleRemoved: string[] = [];
  const sampleUpdated: string[] = [];

  incomingMap.forEach((incomingItem, id) => {
    const currentItem = currentMap.get(id);
    if (!currentItem) {
      sampleAdded.push(label(incomingItem));
      return;
    }
    if (JSON.stringify(currentItem) !== JSON.stringify(incomingItem)) {
      sampleUpdated.push(label(incomingItem));
    }
  });

  if (mode === "replace") {
    currentMap.forEach((currentItem, id) => {
      if (!incomingMap.has(id)) sampleRemoved.push(label(currentItem));
    });
  }

  return {
    added: sampleAdded.length,
    removed: sampleRemoved.length,
    updated: sampleUpdated.length,
    sampleAdded: sampleAdded.slice(0, 3),
    sampleRemoved: sampleRemoved.slice(0, 3),
    sampleUpdated: sampleUpdated.slice(0, 3)
  };
}

function formatDiffSection(
  title: string,
  diff: { added: number; removed: number; updated: number; sampleAdded: string[]; sampleRemoved: string[]; sampleUpdated: string[] },
  detailLevel: "compact" | "detailed"
): string[] {
  const lines = [`${title}: ${formatDiff(diff)}`];
  if (detailLevel === "compact") return lines;
  if (diff.sampleAdded.length > 0) lines.push(`  + Added: ${diff.sampleAdded.join(", ")}`);
  if (diff.sampleRemoved.length > 0) lines.push(`  - Removed: ${diff.sampleRemoved.join(", ")}`);
  if (diff.sampleUpdated.length > 0) lines.push(`  ~ Updated: ${diff.sampleUpdated.join(", ")}`);
  return lines;
}

function formatDiff(diff: { added: number; removed: number; updated: number }): string {
  return `+${diff.added} / -${diff.removed} / ~${diff.updated}`;
}
