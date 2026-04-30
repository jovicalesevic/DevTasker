import type { AppState, PersistedStateEnvelope } from "./types";

export function loadState(
  storageKey: string,
  createEmptyState: () => AppState,
  isPersistedEnvelope: (value: unknown) => value is PersistedStateEnvelope,
  migrateState: (input: Partial<AppState>, fromVersion: number) => AppState
): AppState {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return createEmptyState();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isPersistedEnvelope(parsed)) {
      return migrateState(parsed.data, parsed.schemaVersion);
    }
    return migrateState(parsed as Partial<AppState>, 0);
  } catch {
    return createEmptyState();
  }
}

export function saveState(
  storageKey: string,
  currentSchemaVersion: number,
  state: AppState,
  sortState: (input: AppState) => AppState
): void {
  sortState(state);
  const envelope: PersistedStateEnvelope = {
    schemaVersion: currentSchemaVersion,
    data: state
  };
  localStorage.setItem(storageKey, JSON.stringify(envelope));
}

export function replaceState(state: AppState, next: AppState): void {
  state.projects = next.projects;
  state.tasks = next.tasks;
  state.sessions = next.sessions;
  state.pendingSessions = next.pendingSessions;
  state.reminders = next.reminders;
  state.weeklySummaries = next.weeklySummaries;
}

export function mergeState(state: AppState, next: AppState): void {
  state.projects = mergeById(state.projects, next.projects);
  state.tasks = mergeById(state.tasks, next.tasks);
  state.sessions = mergeById(state.sessions, next.sessions);
  state.pendingSessions = mergeById(state.pendingSessions, next.pendingSessions);
  state.reminders = mergeById(state.reminders, next.reminders);
  state.weeklySummaries = mergeById(state.weeklySummaries, next.weeklySummaries);
}

export function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  current.forEach((item) => map.set(item.id, item));
  incoming.forEach((item) => map.set(item.id, item));
  return [...map.values()];
}
