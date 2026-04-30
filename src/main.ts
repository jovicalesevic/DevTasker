import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_PROJECT_NAME,
  DIFF_VIEW_MODE_KEY,
  SNAPSHOT_KEY,
  STORAGE_KEY
} from "./constants.js";
import {
  loadState as loadStateFromStorage,
  mergeState as mergeAppState,
  replaceState as replaceAppState,
  saveState as saveStateToStorage
} from "./state.js";
import {
  createEmptyState,
  isPersistedEnvelope,
  migrateState,
  normalizeAppState,
  sortState,
  validatePendingSessionDraft,
  validateTaskDraft
} from "./validation.js";
import {
  byId,
  byIdOptional,
  escapeHtml,
  formatDate,
  formatDay,
  nowIso,
  priorityLabel,
  startOfWeek,
  statusLabel,
  uid
} from "./utils.js";
import { buildDiffPreview } from "./diffPreview.js";
import {
  captureSnapshot,
  getSnapshots as getSnapshotsFromStorage,
  setSnapshots as setSnapshotsToStorage,
  snapshotDataCounts
} from "./snapshots.js";
import { commitSession as commitSessionToState, flushPendingSessions as flushPendingSessionsFromQueue } from "./sync.js";
import {
  exportBackupJson as exportBackupJsonFile,
  importBackupFromFile,
  resetAppData as resetAllAppData,
  undoLastDestructiveAction as undoFromSnapshots
} from "./backup.js";
import {
  averageLeadTimeHours as averageLeadTimeHoursFromState,
  calculateWorklogStreak as calculateWorklogStreakFromSessions,
  latestTaskActivity as latestTaskActivityFromState,
  nextUpScore as nextUpScoreForTask,
  predictTodayItems as predictTodayItemsFromState,
  topBlockers as topBlockersFromSessions,
  weeklyTrendText as weeklyTrendTextFromState
} from "./analytics.js";
import { exportWeeklyReport as exportWeeklyReportFile } from "./report.js";
import { applyStaticTranslations, getLanguage, setLanguage, t, tf } from "./i18n.js";
import { createSnapshotUiController } from "./snapshotUi.js";
import { createUiRenderer } from "./ui.js";
import {
  closeHelpModal as hideHelpModal,
  isHelpModalOpen,
  openHelpModal as showHelpModal
} from "./helpModal.js";
import { createDiffModalController } from "./diffModal.js";
import type {
  AppState,
  DiffMode,
  PendingSession,
  PersistedStateEnvelope,
  Priority,
  Project,
  Reminder,
  Session,
  SnapshotEntry,
  TabKey,
  Task,
  TaskStatus,
  WeeklySummary
} from "./types.js";

const state: AppState = loadState();

const activeTaskList = byId<HTMLUListElement>("activeTaskList");
const worklogTimeline = byId<HTMLDivElement>("worklogTimeline");
const archiveTaskList = byId<HTMLUListElement>("archiveTaskList");
const reminderList = byId<HTMLUListElement>("reminderList");
const weeklySummaryBody = byId<HTMLDivElement>("weeklySummaryBody");
const analyticsPanel = byId<HTMLDivElement>("analyticsPanel");
const nextUpBoard = byId<HTMLDivElement>("nextUpBoard");
const standupYesterday = byId<HTMLUListElement>("standupYesterday");
const standupToday = byId<HTMLUListElement>("standupToday");
const standupBlockers = byId<HTMLUListElement>("standupBlockers");
const syncStatusLabel = byId<HTMLSpanElement>("syncStatusLabel");
const syncQueueCount = byId<HTMLSpanElement>("syncQueueCount");
const syncNowBtn = byId<HTMLButtonElement>("syncNowBtn");
const toastEl = byId<HTMLDivElement>("toast");
const clearDismissedRemindersBtn = byId<HTMLButtonElement>("clearDismissedRemindersBtn");
const exportWeeklyReportBtn = byId<HTMLButtonElement>("exportWeeklyReportBtn");
const exportBackupBtn = byId<HTMLButtonElement>("exportBackupBtn");
const importBackupBtn = byId<HTMLButtonElement>("importBackupBtn");
const importBackupInput = byId<HTMLInputElement>("importBackupInput");
const importModeSelect = byId<HTMLSelectElement>("importModeSelect");
const resetAppDataBtn = byId<HTMLButtonElement>("resetAppDataBtn");
const resetPreferencesBtn = byIdOptional<HTMLButtonElement>("resetPreferencesBtn");
const undoLastChangeBtn = byId<HTMLButtonElement>("undoLastChangeBtn");
const snapshotHistorySelect = byId<HTMLSelectElement>("snapshotHistorySelect");
const deleteSelectedSnapshotBtn = byId<HTMLButtonElement>("deleteSelectedSnapshotBtn");
const clearSnapshotHistoryBtn = byId<HTMLButtonElement>("clearSnapshotHistoryBtn");
const snapshotMeta = byId<HTMLParagraphElement>("snapshotMeta");
const diagSchemaVersion = byIdOptional<HTMLSpanElement>("diagSchemaVersion");
const diagSnapshots = byIdOptional<HTMLSpanElement>("diagSnapshots");
const diagQueue = byIdOptional<HTMLSpanElement>("diagQueue");
const diagNetwork = byIdOptional<HTMLSpanElement>("diagNetwork");
const diffModal = byIdOptional<HTMLDivElement>("diffModal");
const diffModalDescription = byIdOptional<HTMLParagraphElement>("diffModalDescription");
const diffModalBody = byIdOptional<HTMLPreElement>("diffModalBody");
const diffModalViewToggleBtn = byIdOptional<HTMLButtonElement>("diffModalViewToggleBtn");
const diffModalCancelBtn = byIdOptional<HTMLButtonElement>("diffModalCancelBtn");
const diffModalApplyBtn = byIdOptional<HTMLButtonElement>("diffModalApplyBtn");
const helpBtn = byIdOptional<HTMLButtonElement>("helpBtn");
const languageSelect = byIdOptional<HTMLSelectElement>("languageSelect");
const helpModal = byIdOptional<HTMLDivElement>("helpModal");
const helpModalCloseBtn = byIdOptional<HTMLButtonElement>("helpModalCloseBtn");
const progressFill = byId<HTMLDivElement>("progressFill");
const progressText = byId<HTMLSpanElement>("progressText");
const taskForm = byId<HTMLFormElement>("taskForm");
const sessionForm = byId<HTMLFormElement>("sessionForm");
const archiveSearch = byId<HTMLInputElement>("archiveSearch");
const archiveProjectFilter = byId<HTMLSelectElement>("archiveProjectFilter");
const activeProjectFilter = byId<HTMLSelectElement>("activeProjectFilter");
const sessionTaskSelect = byId<HTMLSelectElement>("sessionTaskId");
const emptyActiveState = byId<HTMLDivElement>("emptyActiveState");
const emptyWorklogState = byId<HTMLDivElement>("emptyWorklogState");
const emptyArchiveState = byId<HTMLDivElement>("emptyArchiveState");
const diffModalController = createDiffModalController({
  storageKey: DIFF_VIEW_MODE_KEY,
  diffModal,
  diffModalDescription,
  diffModalBody,
  diffModalViewToggleBtn,
  diffModalCancelBtn,
  escapeHtml,
  t
});
const uiRenderer = createUiRenderer(
  () => state,
  {
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
  },
  {
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
    getSnapshotsCount: () => getSnapshotsFromStorage(SNAPSHOT_KEY).length,
    t
  },
  {
    defaultProjectName: DEFAULT_PROJECT_NAME,
    schemaVersion: CURRENT_SCHEMA_VERSION
  }
);
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
  snapshotStorageKey: SNAPSHOT_KEY,
  t,
  tf,
  locale: () => (getLanguage() === "sr" ? "sr-RS" : "en-US")
});

document.addEventListener("DOMContentLoaded", () => {
  applyStaticTranslations();
  if (languageSelect) languageSelect.value = getLanguage();
  bindEvents();
  flushPendingSessions();
  renderAll();
  registerServiceWorker();
});

function bindEvents(): void {
  taskForm.addEventListener("submit", handleTaskSubmit);
  sessionForm.addEventListener("submit", handleSessionSubmit);
  archiveSearch.addEventListener("input", () => renderArchive());
  archiveProjectFilter.addEventListener("change", () => renderArchive());
  activeProjectFilter.addEventListener("change", () => renderActiveTasks());
  byId<HTMLButtonElement>("applyTemplateBtn").addEventListener("click", applyTaskTemplate);
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
  languageSelect?.addEventListener("change", () => {
    const next = languageSelect.value === "sr" ? "sr" : "en";
    setLanguage(next);
    applyStaticTranslations();
    renderAll();
  });
  helpModalCloseBtn?.addEventListener("click", () => hideHelpModal(helpModal));
  diffModal?.addEventListener("click", (event) => {
    if (event.target === diffModal) diffModalController.close(false);
  });
  helpModal?.addEventListener("click", (event) => {
    if (event.target === helpModal) hideHelpModal(helpModal);
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
    if (flushed > 0) showToast(`Synced ${flushed} queued session(s).`);
    renderAll();
  });
  window.addEventListener("offline", () => {
    updateSyncStatus();
    showToast(t("toast.offlineQueued"));
  });

  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab as TabKey;
      setTab(tab);
    });
  });
}

function handleTaskSubmit(event: SubmitEvent): void {
  event.preventDefault();
  const titleInput = byId<HTMLInputElement>("taskTitle");
  const descriptionInput = byId<HTMLTextAreaElement>("taskDescription");
  const projectInput = byId<HTMLInputElement>("taskProject");
  const priorityInput = byId<HTMLSelectElement>("taskPriority");
  const dueInput = byId<HTMLInputElement>("taskDueDate");

  const draft = validateTaskDraft({
    title: titleInput.value,
    description: descriptionInput.value,
    priority: priorityInput.value,
    dueAt: dueInput.value || null
  });
  if (!draft) {
    showToast(t("toast.taskInvalid"));
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
  showToast(t("toast.taskAdded"));
}

function applyTaskTemplate(): void {
  const templateInput = byId<HTMLSelectElement>("taskTemplate");
  const titleInput = byId<HTMLInputElement>("taskTitle");
  const descriptionInput = byId<HTMLTextAreaElement>("taskDescription");
  const priorityInput = byId<HTMLSelectElement>("taskPriority");

  const template = templateInput.value;
  if (!template) return;

  if (template === "bugfix") {
    titleInput.value = "Bugfix: ";
    descriptionInput.value = "Reproduction steps:\n- \n\nExpected:\nActual:\nFix plan:";
    priorityInput.value = "hitno";
  } else if (template === "feature") {
    titleInput.value = "Feature: ";
    descriptionInput.value = "User story:\nAcceptance criteria:\n- [ ] \n- [ ]";
    priorityInput.value = "bitno";
  } else {
    titleInput.value = "Refactor: ";
    descriptionInput.value = "Scope:\nRisk:\nTest plan:";
    priorityInput.value = "moze";
  }
  titleInput.focus();
  showToast(t("toast.templateApplied"));
}

function handleSessionSubmit(event: SubmitEvent): void {
  event.preventDefault();
  const taskIdInput = byId<HTMLSelectElement>("sessionTaskId");
  const minutesInput = byId<HTMLInputElement>("sessionMinutes");
  const notesInput = byId<HTMLTextAreaElement>("sessionNotes");
  const blockerInput = byId<HTMLInputElement>("sessionBlocker");
  const nextStepInput = byId<HTMLInputElement>("sessionNextStep");

  const taskId = taskIdInput.value;
  const task = state.tasks.find((item) => item.id === taskId);
  if (!taskId || !task) {
    showToast(t("toast.selectValidTask"));
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
    showToast(t("toast.sessionInvalid"));
    return;
  }

  if (navigator.onLine) {
    commitSession(payload);
    showToast(t("toast.sessionSaved"));
  } else {
    state.pendingSessions.unshift(payload);
    showToast(t("toast.sessionQueued"));
  }

  saveState();
  sessionForm.reset();
  renderAll();
}

function setTab(tab: TabKey): void {
  document.querySelectorAll<HTMLElement>(".tab-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.panel !== tab);
  });
  document.querySelectorAll<HTMLButtonElement>(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
}

function renderAll(): void {
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

function renderProjectFilters(): void {
  uiRenderer.renderProjectFilters();
}

function renderActiveTasks(): void {
  uiRenderer.renderActiveTasks();
}

function renderSessionTaskSelect(): void {
  uiRenderer.renderSessionTaskSelect();
}

function renderWorklog(): void {
  uiRenderer.renderWorklog();
}

function renderArchive(): void {
  uiRenderer.renderArchive();
}

function renderNextUp(): void {
  uiRenderer.renderNextUp();
}

function renderStandupMode(): void {
  uiRenderer.renderStandupMode();
}

function renderAnalytics(): void {
  uiRenderer.renderAnalytics();
}

function renderReminders(): void {
  uiRenderer.renderReminders();
}

function renderWeeklySummary(): void {
  uiRenderer.renderWeeklySummary();
}

function clearDismissedReminders(): void {
  const before = state.reminders.length;
  state.reminders = state.reminders.filter((reminder) => !reminder.sentAt);
  const removed = before - state.reminders.length;
  saveState();
  renderReminders();
  showToast(removed > 0 ? `Removed ${removed} dismissed reminder(s).` : "No dismissed reminders.");
}

function updateSyncStatus(): void {
  uiRenderer.updateSyncStatus();
}

function updateProgress(): void {
  uiRenderer.updateProgress();
}

function buildWeeklySummary(): WeeklySummary {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekStartIso = weekStart.toISOString();
  const weekTasks = state.tasks.filter((task) => task.archivedAt && new Date(task.archivedAt) >= weekStart);
  const weekSessions = state.sessions.filter((session) => new Date(session.startedAt) >= weekStart);
  const totalMinutes = weekSessions.reduce((sum, session) => {
    const ms = new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime();
    return sum + Math.max(1, Math.round(ms / 60_000));
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

function flushPendingSessions(): number {
  return flushPendingSessionsFromQueue(state, (payload) => commitSession(payload), saveState);
}

function commitSession(payload: PendingSession): void {
  commitSessionToState(state, payload, nowIso);
}

function calculateWorklogStreak(): number {
  return calculateWorklogStreakFromSessions(state.sessions);
}

function weeklyTrendText(): string {
  return weeklyTrendTextFromState(state);
}

function generateReminders(): void {
  const now = new Date();
  const existingKey = new Set(state.reminders.map((item) => `${item.taskId}:${item.type}`));
  state.tasks.forEach((task) => {
    if (task.status === "done") return;
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

function reconcileTaskStatuses(): void {
  state.tasks.forEach((task) => {
    if (task.archivedAt && task.status !== "done") task.status = "done";
  });
}

function changeTaskStatus(taskId: string, status: TaskStatus): void {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;
  task.status = status;
  task.updatedAt = nowIso();
  if (status === "done" && !task.archivedAt) {
    task.archivedAt = nowIso();
  }
  saveState();
  renderAll();
}

function archiveTask(taskId: string): void {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;
  task.status = "done";
  task.archivedAt = nowIso();
  task.updatedAt = nowIso();
  saveState();
  renderAll();
}

function loadState(): AppState {
  return loadStateFromStorage(STORAGE_KEY, createEmptyState, isPersistedEnvelope, migrateState);
}

function saveState(): void {
  saveStateToStorage(STORAGE_KEY, CURRENT_SCHEMA_VERSION, state, sortState);
}

function ensureDefaultProject(): void {
  if (!state.projects.some((project) => project.name === DEFAULT_PROJECT_NAME)) {
    state.projects.push({ id: uid(), name: DEFAULT_PROJECT_NAME });
    saveState();
  }
}

function upsertProject(name: string): Project {
  const existing = state.projects.find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  const project = { id: uid(), name };
  state.projects.push(project);
  return project;
}

function getProject(projectId: string): Project | undefined {
  return state.projects.find((project) => project.id === projectId);
}

function latestTaskActivity(taskId: string): string | null {
  return latestTaskActivityFromState(state, taskId);
}

function groupSessionsByDay(sessions: Session[]): Record<string, Session[]> {
  return sessions.reduce<Record<string, Session[]>>((acc, session) => {
    const key = session.startedAt.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {});
}

function topBlockers(sessions: Session[]): string[] {
  return topBlockersFromSessions(sessions);
}

function uniqueTaskTitles(sessions: Session[]): string[] {
  const ids = new Set<string>();
  const titles: string[] = [];
  sessions.forEach((session) => {
    if (ids.has(session.taskId)) return;
    ids.add(session.taskId);
    const task = state.tasks.find((item) => item.id === session.taskId);
    if (task) titles.push(task.title);
  });
  return titles.slice(0, 5);
}

function predictTodayItems(): string[] {
  return predictTodayItemsFromState(state, nextUpScore);
}

function nextUpScore(task: Task): number {
  return nextUpScoreForTask(task, latestTaskActivity(task.id));
}

function registerServiceWorker(): void {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // No-op: app should still work if registration fails.
      });
    });
  }
}

function handleManualSync(): void {
  const flushed = flushPendingSessions();
  renderAll();
  if (flushed > 0) {
    showToast(`Synced ${flushed} queued session(s).`);
  } else if (!navigator.onLine) {
    showToast(t("toast.cannotSyncOffline"));
  } else {
    showToast(t("toast.queueEmpty"));
  }
}

function showToast(message: string): void {
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  window.setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 2200);
}

function resetPreferences(): void {
  const confirmed = window.confirm(t("confirm.resetPreferences"));
  if (!confirmed) return;
  diffModalController.resetViewPreference();
  showToast(t("toast.preferencesReset"));
}

function exportBackupJson(): void {
  exportBackupJsonFile(state, showToast, tf);
}

async function handleImportBackup(): Promise<void> {
  const file = importBackupInput.files?.[0];
  if (!file) return;
  try {
    const importMode: DiffMode = importModeSelect.value === "merge" ? "merge" : "replace";
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
      showToast,
      t,
      tf
    });
  } finally {
    // Clear file input so selecting the same file triggers change event again.
    importBackupInput.value = "";
  }
}

function exportWeeklyReport(): void {
  const summary = state.weeklySummaries[0] ?? buildWeeklySummary();
  exportWeeklyReportFile({
    summary,
    avgLeadTimeHours: averageLeadTimeHours(),
    worklogStreakDays: calculateWorklogStreak(),
    weeklyTrend: weeklyTrendText(),
    topBlockers: topBlockers(state.sessions),
    nextUpItems: predictTodayItems(),
    showToast,
    t,
    tf,
    locale: getLanguage() === "sr" ? "sr-RS" : "en-US"
  });
}

function averageLeadTimeHours(): number {
  return averageLeadTimeHoursFromState(state);
}

function replaceState(next: AppState): void {
  replaceAppState(state, next);
}

function mergeState(next: AppState): void {
  mergeAppState(state, next);
}

function resetAppData(): void {
  resetAllAppData({
    snapshotCurrentState,
    replaceState,
    saveState,
    renderAll,
    showToast,
    t
  });
}

async function undoLastDestructiveAction(): Promise<void> {
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
    showToast,
    t,
    tf
  });
}

function snapshotCurrentState(reason: string): void {
  captureSnapshot(SNAPSHOT_KEY, state, reason, nowIso);
}

function getSnapshots(): SnapshotEntry[] {
  return getSnapshotsFromStorage(SNAPSHOT_KEY);
}

function setSnapshots(snapshots: SnapshotEntry[]): void {
  setSnapshotsToStorage(SNAPSHOT_KEY, snapshots, 3);
}

function updateUndoAvailability(): void {
  snapshotUiController.updateUndoAvailability();
}

function deleteSelectedSnapshot(): void {
  snapshotUiController.deleteSelectedSnapshot();
}

function clearSnapshotHistory(): void {
  snapshotUiController.clearSnapshotHistory();
}

function renderDiagnostics(): void {
  uiRenderer.renderDiagnostics();
}

