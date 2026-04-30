import { MAX_DESCRIPTION_LENGTH, MAX_TEXT_FIELD_LENGTH, MAX_TITLE_LENGTH } from "./constants";
export function validateTaskDraft(input) {
    const title = input.title.trim();
    const description = input.description.trim();
    const priority = parsePriority(input.priority);
    if (!title || title.length > MAX_TITLE_LENGTH || !priority || description.length > MAX_DESCRIPTION_LENGTH) {
        return null;
    }
    let dueAt = null;
    if (input.dueAt) {
        const iso = normalizeDueInput(input.dueAt);
        if (!iso)
            return null;
        dueAt = iso;
    }
    return { title, description, priority, dueAt };
}
export function validatePendingSessionDraft(input) {
    const minutes = Math.max(1, Math.round(input.minutes || 0));
    if (!input.id || !input.taskId || minutes < 1)
        return null;
    const notes = input.notes.trim().slice(0, MAX_DESCRIPTION_LENGTH);
    const blocker = input.blocker.trim().slice(0, MAX_TEXT_FIELD_LENGTH);
    const nextStep = input.nextStep.trim().slice(0, MAX_TEXT_FIELD_LENGTH);
    if (!isValidIsoDate(input.queuedAt))
        return null;
    return { ...input, minutes, notes, blocker, nextStep };
}
export function normalizeProject(value) {
    if (!value || typeof value !== "object")
        return null;
    const p = value;
    if (!p.id || !p.name)
        return null;
    return {
        id: String(p.id),
        name: String(p.name).trim().slice(0, MAX_TEXT_FIELD_LENGTH),
        repo: p.repo ? String(p.repo).slice(0, MAX_DESCRIPTION_LENGTH) : undefined
    };
}
export function normalizeTask(value) {
    if (!value || typeof value !== "object")
        return null;
    const t = value;
    const priority = parsePriority(t.priority);
    const status = parseTaskStatus(t.status);
    if (!t.id || !t.title || !t.projectId || !priority || !status)
        return null;
    const createdAt = normalizeIsoDate(t.createdAt);
    const updatedAt = normalizeIsoDate(t.updatedAt);
    if (!createdAt || !updatedAt)
        return null;
    const dueAt = t.dueAt ? normalizeIsoDate(t.dueAt) : null;
    const archivedAt = t.archivedAt ? normalizeIsoDate(t.archivedAt) : null;
    return {
        id: String(t.id),
        title: String(t.title).trim().slice(0, MAX_TITLE_LENGTH),
        description: String(t.description ?? "").trim().slice(0, MAX_DESCRIPTION_LENGTH),
        projectId: String(t.projectId),
        priority,
        status,
        dueAt,
        createdAt,
        updatedAt,
        archivedAt
    };
}
export function normalizeSession(value) {
    if (!value || typeof value !== "object")
        return null;
    const s = value;
    if (!s.id || !s.taskId)
        return null;
    const startedAt = normalizeIsoDate(s.startedAt);
    const endedAt = normalizeIsoDate(s.endedAt);
    if (!startedAt || !endedAt)
        return null;
    return {
        id: String(s.id),
        taskId: String(s.taskId),
        startedAt,
        endedAt,
        notes: String(s.notes ?? "").slice(0, MAX_DESCRIPTION_LENGTH),
        blocker: String(s.blocker ?? "").slice(0, MAX_TEXT_FIELD_LENGTH),
        nextStep: String(s.nextStep ?? "").slice(0, MAX_TEXT_FIELD_LENGTH)
    };
}
export function normalizePendingSession(value) {
    if (!value || typeof value !== "object")
        return null;
    const p = value;
    const candidate = {
        id: String(p.id ?? ""),
        taskId: String(p.taskId ?? ""),
        minutes: Number(p.minutes ?? 0),
        notes: String(p.notes ?? ""),
        blocker: String(p.blocker ?? ""),
        nextStep: String(p.nextStep ?? ""),
        queuedAt: String(p.queuedAt ?? "")
    };
    return validatePendingSessionDraft(candidate);
}
export function normalizeReminder(value) {
    if (!value || typeof value !== "object")
        return null;
    const r = value;
    const type = r.type === "due" || r.type === "stale" ? r.type : null;
    const triggerAt = normalizeIsoDate(r.triggerAt);
    if (!r.id || !r.taskId || !type || !triggerAt)
        return null;
    const sentAt = r.sentAt ? normalizeIsoDate(r.sentAt) : null;
    return {
        id: String(r.id),
        taskId: String(r.taskId),
        type,
        triggerAt,
        sentAt
    };
}
export function normalizeWeeklySummary(value) {
    if (!value || typeof value !== "object")
        return null;
    const w = value;
    const weekStart = normalizeIsoDate(w.weekStart);
    const generatedAt = normalizeIsoDate(w.generatedAt);
    if (!w.id || !weekStart || !generatedAt)
        return null;
    return {
        id: String(w.id),
        weekStart,
        content: String(w.content ?? "").slice(0, MAX_DESCRIPTION_LENGTH),
        generatedAt
    };
}
export function normalizeAppState(input) {
    const projects = (Array.isArray(input.projects) ? input.projects : [])
        .map(normalizeProject)
        .filter((item) => item !== null);
    const tasks = (Array.isArray(input.tasks) ? input.tasks : [])
        .map(normalizeTask)
        .filter((item) => item !== null);
    const sessions = (Array.isArray(input.sessions) ? input.sessions : [])
        .map(normalizeSession)
        .filter((item) => item !== null);
    const pendingSessions = (Array.isArray(input.pendingSessions) ? input.pendingSessions : [])
        .map(normalizePendingSession)
        .filter((item) => item !== null);
    const reminders = (Array.isArray(input.reminders) ? input.reminders : [])
        .map(normalizeReminder)
        .filter((item) => item !== null);
    const weeklySummaries = (Array.isArray(input.weeklySummaries) ? input.weeklySummaries : [])
        .map(normalizeWeeklySummary)
        .filter((item) => item !== null);
    return sortState({
        projects,
        tasks,
        sessions,
        pendingSessions,
        reminders,
        weeklySummaries
    });
}
export function createEmptyState() {
    return {
        projects: [],
        tasks: [],
        sessions: [],
        pendingSessions: [],
        reminders: [],
        weeklySummaries: []
    };
}
export function isPersistedEnvelope(value) {
    if (!value || typeof value !== "object")
        return false;
    const v = value;
    return typeof v.schemaVersion === "number" && typeof v.data === "object";
}
export function migrateState(input, _fromVersion) {
    return normalizeAppState(input);
}
export function sortState(input) {
    input.projects.sort((a, b) => a.name.localeCompare(b.name, "en-US") || a.id.localeCompare(b.id));
    input.tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    input.sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt) || b.id.localeCompare(a.id));
    input.pendingSessions.sort((a, b) => b.queuedAt.localeCompare(a.queuedAt) || b.id.localeCompare(a.id));
    input.reminders.sort((a, b) => a.triggerAt.localeCompare(b.triggerAt) || a.id.localeCompare(b.id));
    input.weeklySummaries.sort((a, b) => b.weekStart.localeCompare(a.weekStart) || b.id.localeCompare(a.id));
    return input;
}
export function parsePriority(value) {
    if (value === "hitno" || value === "bitno" || value === "moze")
        return value;
    return null;
}
export function parseTaskStatus(value) {
    if (value === "todo" || value === "in_progress" || value === "done")
        return value;
    return null;
}
export function normalizeIsoDate(value) {
    if (!value)
        return null;
    try {
        const iso = new Date(String(value)).toISOString();
        return isValidIsoDate(iso) ? iso : null;
    }
    catch {
        return null;
    }
}
export function normalizeDueInput(value) {
    const raw = value.trim();
    if (!raw)
        return null;
    const direct = normalizeIsoDate(raw);
    if (direct)
        return direct;
    const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slash) {
        const month = Number(slash[1]);
        const day = Number(slash[2]);
        const year = Number(slash[3]);
        const parsed = new Date(year, month - 1, day, 23, 59, 0, 0);
        if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day)
            return null;
        const iso = normalizeIsoDate(parsed.toISOString());
        return iso;
    }
    const dotted = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dotted) {
        const day = Number(dotted[1]);
        const month = Number(dotted[2]);
        const year = Number(dotted[3]);
        const parsed = new Date(year, month - 1, day, 23, 59, 0, 0);
        if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day)
            return null;
        const iso = normalizeIsoDate(parsed.toISOString());
        return iso;
    }
    return null;
}
export function isValidIsoDate(value) {
    return !Number.isNaN(new Date(value).getTime());
}
