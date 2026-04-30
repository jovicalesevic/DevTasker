import type { AppState, PendingSession } from "./types.js";

export function commitSession(
  state: AppState,
  payload: PendingSession,
  nowIso: () => string
): void {
  const task = state.tasks.find((item) => item.id === payload.taskId);
  if (!task) return;
  const end = new Date();
  const start = new Date(end.getTime() - payload.minutes * 60_000);
  state.sessions.unshift({
    id: payload.id,
    taskId: payload.taskId,
    startedAt: start.toISOString(),
    endedAt: end.toISOString(),
    notes: payload.notes,
    blocker: payload.blocker,
    nextStep: payload.nextStep
  });
  task.status = "in_progress";
  task.updatedAt = nowIso();
}

export function flushPendingSessions(
  state: AppState,
  commit: (payload: PendingSession) => void,
  saveState: () => void
): number {
  if (!navigator.onLine || state.pendingSessions.length === 0) return 0;
  const queue = [...state.pendingSessions].sort((a, b) => a.queuedAt.localeCompare(b.queuedAt) || a.id.localeCompare(b.id));
  state.pendingSessions = [];
  queue.forEach((pending) => commit(pending));
  saveState();
  return queue.length;
}
