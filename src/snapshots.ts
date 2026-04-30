import type { AppState, SnapshotEntry } from "./types";

export function getSnapshots(storageKey: string): SnapshotEntry[] {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as SnapshotEntry[];
    if (parsed && typeof parsed === "object") {
      const maybeOne = parsed as Partial<SnapshotEntry>;
      if (maybeOne.savedAt && maybeOne.reason && maybeOne.data) {
        return [maybeOne as SnapshotEntry];
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function setSnapshots(storageKey: string, snapshots: SnapshotEntry[], maxCount = 3): void {
  localStorage.setItem(storageKey, JSON.stringify(snapshots.slice(0, maxCount)));
}

export function captureSnapshot(
  storageKey: string,
  state: AppState,
  reason: string,
  nowIso: () => string,
  maxCount = 3
): void {
  const snapshot: SnapshotEntry = {
    savedAt: nowIso(),
    reason,
    data: {
      projects: [...state.projects],
      tasks: [...state.tasks],
      sessions: [...state.sessions],
      pendingSessions: [...state.pendingSessions],
      reminders: [...state.reminders],
      weeklySummaries: [...state.weeklySummaries]
    }
  };
  const snapshots = getSnapshots(storageKey);
  snapshots.unshift(snapshot);
  setSnapshots(storageKey, snapshots, maxCount);
}

export function snapshotDataCounts(snapshot: SnapshotEntry): { projects: number; tasks: number; sessions: number } {
  const projects = Array.isArray(snapshot.data.projects) ? snapshot.data.projects.length : 0;
  const tasks = Array.isArray(snapshot.data.tasks) ? snapshot.data.tasks.length : 0;
  const sessions = Array.isArray(snapshot.data.sessions) ? snapshot.data.sessions.length : 0;
  return { projects, tasks, sessions };
}
