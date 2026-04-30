export function getSnapshots(storageKey) {
    const raw = localStorage.getItem(storageKey);
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed))
            return parsed;
        if (parsed && typeof parsed === "object") {
            const maybeOne = parsed;
            if (maybeOne.savedAt && maybeOne.reason && maybeOne.data) {
                return [maybeOne];
            }
        }
        return [];
    }
    catch {
        return [];
    }
}
export function setSnapshots(storageKey, snapshots, maxCount = 3) {
    localStorage.setItem(storageKey, JSON.stringify(snapshots.slice(0, maxCount)));
}
export function captureSnapshot(storageKey, state, reason, nowIso, maxCount = 3) {
    const snapshot = {
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
export function snapshotDataCounts(snapshot) {
    const projects = Array.isArray(snapshot.data.projects) ? snapshot.data.projects.length : 0;
    const tasks = Array.isArray(snapshot.data.tasks) ? snapshot.data.tasks.length : 0;
    const sessions = Array.isArray(snapshot.data.sessions) ? snapshot.data.sessions.length : 0;
    return { projects, tasks, sessions };
}
