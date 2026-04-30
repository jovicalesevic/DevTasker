import { CURRENT_SCHEMA_VERSION, DEFAULT_PROJECT_NAME, DIFF_VIEW_MODE_KEY, SNAPSHOT_KEY, STORAGE_KEY } from "./constants";
import { loadState as loadStateFromStorage, mergeState as mergeAppState, replaceState as replaceAppState, saveState as saveStateToStorage } from "./state";
import { createEmptyState, isPersistedEnvelope, migrateState, normalizeAppState, sortState, validatePendingSessionDraft, validateTaskDraft } from "./validation";
import { byId, byIdOptional, escapeHtml, formatDate, formatDay, nowIso, priorityLabel, startOfWeek, statusLabel, uid } from "./utils";
import { buildDiffPreview } from "./diffPreview";
import { captureSnapshot, getSnapshots as getSnapshotsFromStorage, setSnapshots as setSnapshotsToStorage, snapshotDataCounts } from "./snapshots";
import { commitSession as commitSessionToState, flushPendingSessions as flushPendingSessionsFromQueue } from "./sync";
import { exportBackupJson as exportBackupJsonFile, importBackupFromFile, resetAppData as resetAllAppData, undoLastDestructiveAction as undoFromSnapshots } from "./backup";
import { averageLeadTimeHours as averageLeadTimeHoursFromState, calculateWorklogStreak as calculateWorklogStreakFromSessions, latestTaskActivity as latestTaskActivityFromState, nextUpScore as nextUpScoreForTask, predictTodayItems as predictTodayItemsFromState, topBlockers as topBlockersFromSessions, weeklyTrendText as weeklyTrendTextFromState } from "./analytics";
import { exportWeeklyReport as exportWeeklyReportFile } from "./report";
import { createSnapshotUiController } from "./snapshotUi";
import { createUiRenderer } from "./ui";
import { closeHelpModal as hideHelpModal, isHelpModalOpen, openHelpModal as showHelpModal } from "./helpModal";
import { createDiffModalController } from "./diffModal";
const state = loadState();
const activeTaskList = byId("activeTaskList");
const worklogTimeline = byId("worklogTimeline");
const archiveTaskList = byId("archiveTaskList");
const reminderList = byId("reminderList");
const weeklySummaryBody = byId("weeklySummaryBody");
const analyticsPanel = byId("analyticsPanel");
const nextUpBoard = byId("nextUpBoard");
const standupYesterday = byId("standupYesterday");
const standupToday = byId("standupToday");
const standupBlockers = byId("standupBlockers");
const syncStatusLabel = byId("syncStatusLabel");
const syncQueueCount = byId("syncQueueCount");
const syncNowBtn = byId("syncNowBtn");
const toastEl = byId("toast");
const clearDismissedRemindersBtn = byId("clearDismissedRemindersBtn");
const exportWeeklyReportBtn = byId("exportWeeklyReportBtn");
const exportBackupBtn = byId("exportBackupBtn");
const importBackupBtn = byId("importBackupBtn");
const importBackupInput = byId("importBackupInput");
const importModeSelect = byId("importModeSelect");
const resetAppDataBtn = byId("resetAppDataBtn");
const resetPreferencesBtn = byIdOptional("resetPreferencesBtn");
const undoLastChangeBtn = byId("undoLastChangeBtn");
const snapshotHistorySelect = byId("snapshotHistorySelect");
const deleteSelectedSnapshotBtn = byId("deleteSelectedSnapshotBtn");
const clearSnapshotHistoryBtn = byId("clearSnapshotHistoryBtn");
const snapshotMeta = byId("snapshotMeta");
const diagSchemaVersion = byIdOptional("diagSchemaVersion");
const diagSnapshots = byIdOptional("diagSnapshots");
const diagQueue = byIdOptional("diagQueue");
const diagNetwork = byIdOptional("diagNetwork");
const diffModal = byIdOptional("diffModal");
const diffModalDescription = byIdOptional("diffModalDescription");
const diffModalBody = byIdOptional("diffModalBody");
const diffModalViewToggleBtn = byIdOptional("diffModalViewToggleBtn");
const diffModalCancelBtn = byIdOptional("diffModalCancelBtn");
const diffModalApplyBtn = byIdOptional("diffModalApplyBtn");
const helpBtn = byIdOptional("helpBtn");
const helpModal = byIdOptional("helpModal");
const helpModalCloseBtn = byIdOptional("helpModalCloseBtn");
const progressFill = byId("progressFill");
const progressText = byId("progressText");
const taskForm = byId("taskForm");
const sessionForm = byId("sessionForm");
const archiveSearch = byId("archiveSearch");
const archiveProjectFilter = byId("archiveProjectFilter");
const activeProjectFilter = byId("activeProjectFilter");
const sessionTaskSelect = byId("sessionTaskId");
const emptyActiveState = byId("emptyActiveState");
const emptyWorklogState = byId("emptyWorklogState");
const emptyArchiveState = byId("emptyArchiveState");
const diffModalController = createDiffModalController({
    storageKey: DIFF_VIEW_MODE_KEY,
    diffModal,
    diffModalDescription,
    diffModalBody,
    diffModalViewToggleBtn,
    diffModalCancelBtn,
    escapeHtml
});
const uiRenderer = createUiRenderer(() => state, {
    activeTaskList,
    archiveTaskList,
    worklogTimeline,
    nextUpBoard,
    reminderList,
    weeklySummaryBody,
    analyticsPanel,
    standupYesterday,
    standupToday,
    standupBlockers,
    activeProjectFilter,
    archiveProjectFilter,
    archiveSearch,
    sessionTaskSelect,
    emptyActiveState,
    emptyWorklogState,
    emptyArchiveState,
    syncStatusLabel,
    syncQueueCount,
    syncNowBtn,
    progressFill,
    progressText,
    diagSchemaVersion,
    diagSnapshots,
    diagQueue,
    diagNetwork
}, {
    getProject,
    changeTaskStatus,
    archiveTask,
    saveState,
    nowIso,
    formatDate,
    formatDay,
    escapeHtml,
    statusLabel,
    priorityLabel,
    groupSessionsByDay,
    nextUpScore,
    uniqueTaskTitles,
    predictTodayItems,
    topBlockers,
    averageLeadTimeHours,
    calculateWorklogStreak,
    weeklyTrendText,
    buildWeeklySummary,
    getSnapshotsCount: () => getSnapshotsFromStorage(SNAPSHOT_KEY).length
}, {
    defaultProjectName: DEFAULT_PROJECT_NAME,
    schemaVersion: CURRENT_SCHEMA_VERSION
});
const snapshotUiController = createSnapshotUiController({
    getSnapshots,
    setSnapshots,
    snapshotHistorySelect,
    snapshotMeta,
    undoLastChangeBtn,
    deleteSelectedSnapshotBtn,
    clearSnapshotHistoryBtn,
    snapshotDataCounts,
    escapeHtml,
    showToast,
    renderAll,
    snapshotStorageKey: SNAPSHOT_KEY
});
document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    flushPendingSessions();
    renderAll();
    registerServiceWorker();
});
function bindEvents() {
    taskForm.addEventListener("submit", handleTaskSubmit);
    sessionForm.addEventListener("submit", handleSessionSubmit);
    archiveSearch.addEventListener("input", () => renderArchive());
    archiveProjectFilter.addEventListener("change", () => renderArchive());
    activeProjectFilter.addEventListener("change", () => renderActiveTasks());
    byId("applyTemplateBtn").addEventListener("click", applyTaskTemplate);
    syncNowBtn.addEventListener("click", handleManualSync);
    clearDismissedRemindersBtn.addEventListener("click", clearDismissedReminders);
    exportWeeklyReportBtn.addEventListener("click", exportWeeklyReport);
    exportBackupBtn.addEventListener("click", exportBackupJson);
    importBackupBtn.addEventListener("click", () => importBackupInput.click());
    importBackupInput.addEventListener("change", handleImportBackup);
    resetAppDataBtn.addEventListener("click", resetAppData);
    resetPreferencesBtn?.addEventListener("click", resetPreferences);
    undoLastChangeBtn.addEventListener("click", undoLastDestructiveAction);
    deleteSelectedSnapshotBtn.addEventListener("click", deleteSelectedSnapshot);
    clearSnapshotHistoryBtn.addEventListener("click", clearSnapshotHistory);
    diffModalViewToggleBtn?.addEventListener("click", () => diffModalController.toggleView());
    diffModalCancelBtn?.addEventListener("click", () => diffModalController.close(false));
    diffModalApplyBtn?.addEventListener("click", () => diffModalController.close(true));
    helpBtn?.addEventListener("click", () => showHelpModal(helpModal, helpModalCloseBtn));
    helpModalCloseBtn?.addEventListener("click", () => hideHelpModal(helpModal));
    diffModal?.addEventListener("click", (event) => {
        if (event.target === diffModal)
            diffModalController.close(false);
    });
    helpModal?.addEventListener("click", (event) => {
        if (event.target === helpModal)
            hideHelpModal(helpModal);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && diffModalController.isOpen()) {
            diffModalController.close(false);
            return;
        }
        if (event.key === "Escape" && isHelpModalOpen(helpModal)) {
            hideHelpModal(helpModal);
        }
    });
    window.addEventListener("online", () => {
        const flushed = flushPendingSessions();
        if (flushed > 0)
            showToast(`Synced ${flushed} queued session(s).`);
        renderAll();
    });
    window.addEventListener("offline", () => {
        updateSyncStatus();
        showToast("Offline mode: sessions will be queued.");
    });
    document.querySelectorAll("[data-tab]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const tab = btn.dataset.tab;
            setTab(tab);
        });
    });
}
function handleTaskSubmit(event) {
    event.preventDefault();
    const titleInput = byId("taskTitle");
    const descriptionInput = byId("taskDescription");
    const projectInput = byId("taskProject");
    const priorityInput = byId("taskPriority");
    const dueInput = byId("taskDueDate");
    const draft = validateTaskDraft({
        title: titleInput.value,
        description: descriptionInput.value,
        priority: priorityInput.value,
        dueAt: dueInput.value || null
    });
    if (!draft) {
        showToast("Task form has invalid data.");
        return;
    }
    const project = upsertProject(projectInput.value.trim() || DEFAULT_PROJECT_NAME);
    const now = nowIso();
    state.tasks.unshift({
        id: uid(),
        title: draft.title,
        description: draft.description,
        projectId: project.id,
        priority: draft.priority,
        status: "todo",
        dueAt: draft.dueAt,
        createdAt: now,
        updatedAt: now,
        archivedAt: null
    });
    saveState();
    taskForm.reset();
    renderAll();
    showToast("Task added.");
}
function applyTaskTemplate() {
    const templateInput = byId("taskTemplate");
    const titleInput = byId("taskTitle");
    const descriptionInput = byId("taskDescription");
    const priorityInput = byId("taskPriority");
    const template = templateInput.value;
    if (!template)
        return;
    if (template === "bugfix") {
        titleInput.value = "Bugfix: ";
        descriptionInput.value = "Reproduction steps:\n- \n\nExpected:\nActual:\nFix plan:";
        priorityInput.value = "hitno";
    }
    else if (template === "feature") {
        titleInput.value = "Feature: ";
        descriptionInput.value = "User story:\nAcceptance criteria:\n- [ ] \n- [ ]";
        priorityInput.value = "bitno";
    }
    else {
        titleInput.value = "Refactor: ";
        descriptionInput.value = "Scope:\nRisk:\nTest plan:";
        priorityInput.value = "moze";
    }
    titleInput.focus();
    showToast("Template applied.");
}
function handleSessionSubmit(event) {
    event.preventDefault();
    const taskIdInput = byId("sessionTaskId");
    const minutesInput = byId("sessionMinutes");
    const notesInput = byId("sessionNotes");
    const blockerInput = byId("sessionBlocker");
    const nextStepInput = byId("sessionNextStep");
    const taskId = taskIdInput.value;
    const task = state.tasks.find((item) => item.id === taskId);
    if (!taskId || !task) {
        showToast("Select a valid task.");
        return;
    }
    const payload = validatePendingSessionDraft({
        id: uid(),
        taskId,
        minutes: Number(minutesInput.value),
        notes: notesInput.value,
        blocker: blockerInput.value,
        nextStep: nextStepInput.value,
        queuedAt: nowIso()
    });
    if (!payload) {
        showToast("Session input has invalid data.");
        return;
    }
    if (navigator.onLine) {
        commitSession(payload);
        showToast("Session saved.");
    }
    else {
        state.pendingSessions.unshift(payload);
        showToast("Offline: session queued for sync.");
    }
    saveState();
    sessionForm.reset();
    renderAll();
}
function setTab(tab) {
    document.querySelectorAll(".tab-panel").forEach((panel) => {
        panel.classList.toggle("hidden", panel.dataset.panel !== tab);
    });
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === tab);
    });
}
function renderAll() {
    ensureDefaultProject();
    reconcileTaskStatuses();
    generateReminders();
    renderProjectFilters();
    renderActiveTasks();
    renderSessionTaskSelect();
    renderWorklog();
    renderArchive();
    renderNextUp();
    renderStandupMode();
    renderAnalytics();
    renderReminders();
    renderWeeklySummary();
    updateProgress();
    updateSyncStatus();
    updateUndoAvailability();
    renderDiagnostics();
}
function renderProjectFilters() {
    uiRenderer.renderProjectFilters();
}
function renderActiveTasks() {
    uiRenderer.renderActiveTasks();
}
function renderSessionTaskSelect() {
    uiRenderer.renderSessionTaskSelect();
}
function renderWorklog() {
    uiRenderer.renderWorklog();
}
function renderArchive() {
    uiRenderer.renderArchive();
}
function renderNextUp() {
    uiRenderer.renderNextUp();
}
function renderStandupMode() {
    uiRenderer.renderStandupMode();
}
function renderAnalytics() {
    uiRenderer.renderAnalytics();
}
function renderReminders() {
    uiRenderer.renderReminders();
}
function renderWeeklySummary() {
    uiRenderer.renderWeeklySummary();
}
function clearDismissedReminders() {
    const before = state.reminders.length;
    state.reminders = state.reminders.filter((reminder) => !reminder.sentAt);
    const removed = before - state.reminders.length;
    saveState();
    renderReminders();
    showToast(removed > 0 ? `Removed ${removed} dismissed reminder(s).` : "No dismissed reminders.");
}
function updateSyncStatus() {
    uiRenderer.updateSyncStatus();
}
function updateProgress() {
    uiRenderer.updateProgress();
}
function buildWeeklySummary() {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekStartIso = weekStart.toISOString();
    const weekTasks = state.tasks.filter((task) => task.archivedAt && new Date(task.archivedAt) >= weekStart);
    const weekSessions = state.sessions.filter((session) => new Date(session.startedAt) >= weekStart);
    const totalMinutes = weekSessions.reduce((sum, session) => {
        const ms = new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime();
        return sum + Math.max(1, Math.round(ms / 60000));
    }, 0);
    const blockers = topBlockers(weekSessions);
    const blockerText = blockers.length ? blockers.join(", ") : "none";
    const content = `This week: ${weekTasks.length} tasks done, ${totalMinutes} total work minutes, top blockers: ${blockerText}.`;
    return {
        id: uid(),
        weekStart: weekStartIso,
        content,
        generatedAt: nowIso()
    };
}
function flushPendingSessions() {
    return flushPendingSessionsFromQueue(state, (payload) => commitSession(payload), saveState);
}
function commitSession(payload) {
    commitSessionToState(state, payload, nowIso);
}
function calculateWorklogStreak() {
    return calculateWorklogStreakFromSessions(state.sessions);
}
function weeklyTrendText() {
    return weeklyTrendTextFromState(state);
}
function generateReminders() {
    const now = new Date();
    const existingKey = new Set(state.reminders.map((item) => `${item.taskId}:${item.type}`));
    state.tasks.forEach((task) => {
        if (task.status === "done")
            return;
        if (task.dueAt && new Date(task.dueAt) <= now) {
            const key = `${task.id}:due`;
            if (!existingKey.has(key)) {
                state.reminders.push({
                    id: uid(),
                    taskId: task.id,
                    type: "due",
                    triggerAt: task.dueAt,
                    sentAt: null
                });
            }
        }
        const lastActivity = latestTaskActivity(task.id);
        if (lastActivity) {
            const staleAt = new Date(new Date(lastActivity).getTime() + 48 * 60 * 60 * 1000);
            const key = `${task.id}:stale`;
            if (staleAt <= now && !existingKey.has(key)) {
                state.reminders.push({
                    id: uid(),
                    taskId: task.id,
                    type: "stale",
                    triggerAt: staleAt.toISOString(),
                    sentAt: null
                });
            }
        }
    });
}
function reconcileTaskStatuses() {
    state.tasks.forEach((task) => {
        if (task.archivedAt && task.status !== "done")
            task.status = "done";
    });
}
function changeTaskStatus(taskId, status) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task)
        return;
    task.status = status;
    task.updatedAt = nowIso();
    if (status === "done" && !task.archivedAt) {
        task.archivedAt = nowIso();
    }
    saveState();
    renderAll();
}
function archiveTask(taskId) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task)
        return;
    task.status = "done";
    task.archivedAt = nowIso();
    task.updatedAt = nowIso();
    saveState();
    renderAll();
}
function loadState() {
    return loadStateFromStorage(STORAGE_KEY, createEmptyState, isPersistedEnvelope, migrateState);
}
function saveState() {
    saveStateToStorage(STORAGE_KEY, CURRENT_SCHEMA_VERSION, state, sortState);
}
function ensureDefaultProject() {
    if (!state.projects.some((project) => project.name === DEFAULT_PROJECT_NAME)) {
        state.projects.push({ id: uid(), name: DEFAULT_PROJECT_NAME });
        saveState();
    }
}
function upsertProject(name) {
    const existing = state.projects.find((item) => item.name.toLowerCase() === name.toLowerCase());
    if (existing)
        return existing;
    const project = { id: uid(), name };
    state.projects.push(project);
    return project;
}
function getProject(projectId) {
    return state.projects.find((project) => project.id === projectId);
}
function latestTaskActivity(taskId) {
    return latestTaskActivityFromState(state, taskId);
}
function groupSessionsByDay(sessions) {
    return sessions.reduce((acc, session) => {
        const key = session.startedAt.slice(0, 10);
        if (!acc[key])
            acc[key] = [];
        acc[key].push(session);
        return acc;
    }, {});
}
function topBlockers(sessions) {
    return topBlockersFromSessions(sessions);
}
function uniqueTaskTitles(sessions) {
    const ids = new Set();
    const titles = [];
    sessions.forEach((session) => {
        if (ids.has(session.taskId))
            return;
        ids.add(session.taskId);
        const task = state.tasks.find((item) => item.id === session.taskId);
        if (task)
            titles.push(task.title);
    });
    return titles.slice(0, 5);
}
function predictTodayItems() {
    return predictTodayItemsFromState(state, nextUpScore);
}
function nextUpScore(task) {
    return nextUpScoreForTask(task, latestTaskActivity(task.id));
}
function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./sw.js").catch(() => {
                // No-op: app should still work if registration fails.
            });
        });
    }
}
function handleManualSync() {
    const flushed = flushPendingSessions();
    renderAll();
    if (flushed > 0) {
        showToast(`Synced ${flushed} queued session(s).`);
    }
    else if (!navigator.onLine) {
        showToast("Cannot sync while offline.");
    }
    else {
        showToast("Queue is already empty.");
    }
}
function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove("hidden");
    window.setTimeout(() => {
        toastEl.classList.add("hidden");
    }, 2200);
}
function resetPreferences() {
    const confirmed = window.confirm("Reset UI preferences to default values?");
    if (!confirmed)
        return;
    diffModalController.resetViewPreference();
    showToast("Preferences reset.");
}
function exportBackupJson() {
    exportBackupJsonFile(state, showToast);
}
async function handleImportBackup() {
    const file = importBackupInput.files?.[0];
    if (!file)
        return;
    try {
        const importMode = importModeSelect.value === "merge" ? "merge" : "replace";
        await importBackupFromFile({
            state,
            file,
            importMode,
            normalizeAppState,
            buildDiffPreview: (current, incoming, mode, detailLevel) => buildDiffPreview(current, incoming, mode, detailLevel, formatDay),
            showDiffModal: (title, description, preview) => diffModalController.show(title, description, preview),
            snapshotCurrentState,
            mergeState,
            replaceState,
            saveState,
            renderAll,
            showToast
        });
    }
    finally {
        // Clear file input so selecting the same file triggers change event again.
        importBackupInput.value = "";
    }
}
function exportWeeklyReport() {
    const summary = state.weeklySummaries[0] ?? buildWeeklySummary();
    exportWeeklyReportFile({
        summary,
        avgLeadTimeHours: averageLeadTimeHours(),
        worklogStreakDays: calculateWorklogStreak(),
        weeklyTrend: weeklyTrendText(),
        topBlockers: topBlockers(state.sessions),
        nextUpItems: predictTodayItems(),
        showToast
    });
}
function averageLeadTimeHours() {
    return averageLeadTimeHoursFromState(state);
}
function replaceState(next) {
    replaceAppState(state, next);
}
function mergeState(next) {
    mergeAppState(state, next);
}
function resetAppData() {
    resetAllAppData({
        snapshotCurrentState,
        replaceState,
        saveState,
        renderAll,
        showToast
    });
}
async function undoLastDestructiveAction() {
    await undoFromSnapshots({
        state,
        selectedSnapshot: snapshotHistorySelect.value,
        getSnapshots,
        normalizeAppState,
        buildDiffPreview: (current, incoming, mode, detailLevel) => buildDiffPreview(current, incoming, mode, detailLevel, formatDay),
        showDiffModal: (title, description, preview) => diffModalController.show(title, description, preview),
        replaceState,
        saveState,
        renderAll,
        showToast
    });
}
function snapshotCurrentState(reason) {
    captureSnapshot(SNAPSHOT_KEY, state, reason, nowIso);
}
function getSnapshots() {
    return getSnapshotsFromStorage(SNAPSHOT_KEY);
}
function setSnapshots(snapshots) {
    setSnapshotsToStorage(SNAPSHOT_KEY, snapshots, 3);
}
function updateUndoAvailability() {
    snapshotUiController.updateUndoAvailability();
}
function deleteSelectedSnapshot() {
    snapshotUiController.deleteSelectedSnapshot();
}
function clearSnapshotHistory() {
    snapshotUiController.clearSnapshotHistory();
}
function renderDiagnostics() {
    uiRenderer.renderDiagnostics();
}
