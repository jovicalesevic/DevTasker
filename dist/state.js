export function loadState(storageKey, createEmptyState, isPersistedEnvelope, migrateState) {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
        return createEmptyState();
    }
    try {
        const parsed = JSON.parse(raw);
        if (isPersistedEnvelope(parsed)) {
            return migrateState(parsed.data, parsed.schemaVersion);
        }
        return migrateState(parsed, 0);
    }
    catch {
        return createEmptyState();
    }
}
export function saveState(storageKey, currentSchemaVersion, state, sortState) {
    sortState(state);
    const envelope = {
        schemaVersion: currentSchemaVersion,
        data: state
    };
    localStorage.setItem(storageKey, JSON.stringify(envelope));
}
export function replaceState(state, next) {
    state.projects = next.projects;
    state.tasks = next.tasks;
    state.sessions = next.sessions;
    state.pendingSessions = next.pendingSessions;
    state.reminders = next.reminders;
    state.weeklySummaries = next.weeklySummaries;
}
export function mergeState(state, next) {
    state.projects = mergeById(state.projects, next.projects);
    state.tasks = mergeById(state.tasks, next.tasks);
    state.sessions = mergeById(state.sessions, next.sessions);
    state.pendingSessions = mergeById(state.pendingSessions, next.pendingSessions);
    state.reminders = mergeById(state.reminders, next.reminders);
    state.weeklySummaries = mergeById(state.weeklySummaries, next.weeklySummaries);
}
export function mergeById(current, incoming) {
    const map = new Map();
    current.forEach((item) => map.set(item.id, item));
    incoming.forEach((item) => map.set(item.id, item));
    return [...map.values()];
}
