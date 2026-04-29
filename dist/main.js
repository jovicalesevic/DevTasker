"use strict";
const STORAGE_KEY = "devtasker_state_v2";
const SNAPSHOT_KEY = "devtasker_last_snapshot_v1";
const DIFF_VIEW_MODE_KEY = "devtasker_diff_view_mode_v1";
const DEFAULT_PROJECT_NAME = "General";
const CURRENT_SCHEMA_VERSION = 1;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_TEXT_FIELD_LENGTH = 300;
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
const resetPreferencesBtn = byId("resetPreferencesBtn");
const undoLastChangeBtn = byId("undoLastChangeBtn");
const snapshotHistorySelect = byId("snapshotHistorySelect");
const deleteSelectedSnapshotBtn = byId("deleteSelectedSnapshotBtn");
const clearSnapshotHistoryBtn = byId("clearSnapshotHistoryBtn");
const snapshotMeta = byId("snapshotMeta");
const diagSchemaVersion = byId("diagSchemaVersion");
const diagSnapshots = byId("diagSnapshots");
const diagQueue = byId("diagQueue");
const diagNetwork = byId("diagNetwork");
const diffModal = byId("diffModal");
const diffModalDescription = byId("diffModalDescription");
const diffModalBody = byId("diffModalBody");
const diffModalViewToggleBtn = byId("diffModalViewToggleBtn");
const diffModalCancelBtn = byId("diffModalCancelBtn");
const diffModalApplyBtn = byId("diffModalApplyBtn");
const progressFill = byId("progressFill");
const progressText = byId("progressText");
const taskForm = byId("taskForm");
const sessionForm = byId("sessionForm");
const archiveSearch = byId("archiveSearch");
const archiveProjectFilter = byId("archiveProjectFilter");
const activeProjectFilter = byId("activeProjectFilter");
const sessionTaskSelect = byId("sessionTaskSelect");
const emptyActiveState = byId("emptyActiveState");
const emptyWorklogState = byId("emptyWorklogState");
const emptyArchiveState = byId("emptyArchiveState");
let activeDiffModalResolver = null;
let activeDiffModalPreview = null;
let lastDiffModalViewMode = loadDiffViewMode();
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
    resetPreferencesBtn.addEventListener("click", resetPreferences);
    undoLastChangeBtn.addEventListener("click", undoLastDestructiveAction);
    deleteSelectedSnapshotBtn.addEventListener("click", deleteSelectedSnapshot);
    clearSnapshotHistoryBtn.addEventListener("click", clearSnapshotHistory);
    diffModalViewToggleBtn.addEventListener("click", toggleDiffModalView);
    diffModalCancelBtn.addEventListener("click", () => closeDiffModal(false));
    diffModalApplyBtn.addEventListener("click", () => closeDiffModal(true));
    diffModal.addEventListener("click", (event) => {
        if (event.target === diffModal)
            closeDiffModal(false);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !diffModal.classList.contains("hidden")) {
            closeDiffModal(false);
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
        descriptionInput.value = "Koraci reprodukcije:\n- \n\nExpected:\nActual:\nFix plan:";
        priorityInput.value = "hitno";
    }
    else if (template === "feature") {
        titleInput.value = "Feature: ";
        descriptionInput.value = "User story:\nAcceptance kriterijumi:\n- [ ] \n- [ ]";
        priorityInput.value = "bitno";
    }
    else {
        titleInput.value = "Refactor: ";
        descriptionInput.value = "Scope:\nRizik:\nPlan testiranja:";
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
    const options = state.projects
        .map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`)
        .join("");
    const allOption = `<option value="">Svi projekti</option>`;
    activeProjectFilter.innerHTML = allOption + options;
    archiveProjectFilter.innerHTML = allOption + options;
}
function renderActiveTasks() {
    const filterProjectId = activeProjectFilter.value;
    activeTaskList.innerHTML = "";
    const activeTasks = state.tasks.filter((task) => {
        if (task.status === "done")
            return false;
        if (filterProjectId && task.projectId !== filterProjectId)
            return false;
        return true;
    });
    emptyActiveState.classList.toggle("hidden", activeTasks.length > 0);
    activeTasks.forEach((task) => {
        const project = getProject(task.projectId);
        const li = document.createElement("li");
        li.className = "card";
        li.innerHTML = `
      <div class="card-head">
        <h4>${escapeHtml(task.title)}</h4>
        <span class="priority ${task.priority}">${priorityLabel(task.priority)}</span>
      </div>
      <p>${escapeHtml(task.description || "Bez opisa.")}</p>
      <div class="meta-row">
        <span>${escapeHtml(project?.name || DEFAULT_PROJECT_NAME)}</span>
        <span>${task.dueAt ? `Rok: ${formatDate(task.dueAt)}` : "Bez roka"}</span>
        <span>${statusLabel(task.status)}</span>
      </div>
      <div class="action-row">
        <button data-action="markDone" data-id="${task.id}">Zavrsi</button>
        <button data-action="archive" data-id="${task.id}">Arhiviraj</button>
      </div>
    `;
        activeTaskList.appendChild(li);
    });
    activeTaskList.querySelectorAll('button[data-action="markDone"]').forEach((btn) => {
        btn.addEventListener("click", () => {
            changeTaskStatus(btn.dataset.id || "", "done");
        });
    });
    activeTaskList.querySelectorAll('button[data-action="archive"]').forEach((btn) => {
        btn.addEventListener("click", () => {
            archiveTask(btn.dataset.id || "");
        });
    });
}
function renderSessionTaskSelect() {
    const options = state.tasks
        .filter((task) => task.status !== "done")
        .map((task) => `<option value="${task.id}">${escapeHtml(task.title)}</option>`)
        .join("");
    sessionTaskSelect.innerHTML = `<option value="">Izaberi task</option>${options}`;
}
function renderWorklog() {
    worklogTimeline.innerHTML = "";
    const grouped = groupSessionsByDay(state.sessions);
    const days = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));
    emptyWorklogState.classList.toggle("hidden", days.length > 0);
    days.forEach((day) => {
        const wrap = document.createElement("section");
        wrap.className = "day-group";
        const list = grouped[day]
            .map((session) => {
            const task = state.tasks.find((item) => item.id === session.taskId);
            const durationMin = Math.max(1, Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000));
            return `
          <article class="card compact">
            <div class="card-head">
              <h4>${escapeHtml(task?.title || "Nepoznat task")}</h4>
              <span>${durationMin}m</span>
            </div>
            <p>${escapeHtml(session.notes || "Nema belezaka.")}</p>
            <div class="meta-row">
              <span>Blocker: ${escapeHtml(session.blocker || "-")}</span>
              <span>Sledece: ${escapeHtml(session.nextStep || "-")}</span>
            </div>
          </article>
        `;
        })
            .join("");
        wrap.innerHTML = `<h3>${formatDay(day)}</h3>${list}`;
        worklogTimeline.appendChild(wrap);
    });
}
function renderArchive() {
    archiveTaskList.innerHTML = "";
    const query = archiveSearch.value.trim().toLowerCase();
    const filterProjectId = archiveProjectFilter.value;
    const archivedTasks = state.tasks.filter((task) => {
        if (task.status !== "done" && !task.archivedAt)
            return false;
        if (filterProjectId && task.projectId !== filterProjectId)
            return false;
        if (query && !task.title.toLowerCase().includes(query) && !task.description.toLowerCase().includes(query)) {
            return false;
        }
        return true;
    });
    emptyArchiveState.classList.toggle("hidden", archivedTasks.length > 0);
    archivedTasks.forEach((task) => {
        const project = getProject(task.projectId);
        const li = document.createElement("li");
        li.className = "card compact";
        li.innerHTML = `
      <div class="card-head">
        <h4>${escapeHtml(task.title)}</h4>
        <span>${escapeHtml(project?.name || DEFAULT_PROJECT_NAME)}</span>
      </div>
      <p>${escapeHtml(task.description || "Bez opisa.")}</p>
      <div class="meta-row">
        <span>Kreirano: ${formatDate(task.createdAt)}</span>
        <span>Zavrseno: ${task.archivedAt ? formatDate(task.archivedAt) : "-"}</span>
      </div>
    `;
        archiveTaskList.appendChild(li);
    });
}
function renderNextUp() {
    nextUpBoard.innerHTML = "";
    const grouped = new Map();
    state.tasks
        .filter((task) => task.status !== "done")
        .forEach((task) => {
        const list = grouped.get(task.projectId) ?? [];
        list.push(task);
        grouped.set(task.projectId, list);
    });
    const projectIds = [...grouped.keys()];
    if (!projectIds.length) {
        nextUpBoard.innerHTML = `<div class="empty-state">Nema kandidata za next up.</div>`;
        return;
    }
    projectIds.forEach((projectId) => {
        const project = getProject(projectId);
        const topTasks = (grouped.get(projectId) ?? [])
            .sort((a, b) => nextUpScore(b) - nextUpScore(a))
            .slice(0, 3);
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
      <div class="card-head">
        <h4>${escapeHtml(project?.name || DEFAULT_PROJECT_NAME)}</h4>
        <span>Top ${topTasks.length}</span>
      </div>
      <ul class="standup-list">
        ${topTasks.map((task) => `<li>${escapeHtml(task.title)}</li>`).join("")}
      </ul>
    `;
        nextUpBoard.appendChild(card);
    });
}
function renderStandupMode() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdaySessions = state.sessions.filter((session) => {
        const ended = new Date(session.endedAt);
        return ended >= yesterdayStart && ended < todayStart;
    });
    const todaySessions = state.sessions.filter((session) => {
        const ended = new Date(session.endedAt);
        return ended >= todayStart;
    });
    const yesterdayItems = uniqueTaskTitles(yesterdaySessions);
    const todayItems = predictTodayItems();
    const blockerItems = topBlockers(todaySessions.length ? todaySessions : state.sessions);
    renderSimpleList(standupYesterday, yesterdayItems, "Bez zavrsenih session-a juce.");
    renderSimpleList(standupToday, todayItems, "Nema predloga za danas.");
    renderSimpleList(standupBlockers, blockerItems, "Nema blocker-a.");
}
function renderAnalytics() {
    const leadTimeHours = averageLeadTimeHours();
    const streak = calculateWorklogStreak();
    const trend = weeklyTrendText();
    analyticsPanel.innerHTML = `
    <article class="metric-card">
      <div class="metric-label">Avg lead time</div>
      <div class="metric-value">${leadTimeHours}h</div>
    </article>
    <article class="metric-card">
      <div class="metric-label">Worklog streak</div>
      <div class="metric-value">${streak} dana</div>
    </article>
    <article class="metric-card">
      <div class="metric-label">Weekly trend</div>
      <div class="metric-value">${escapeHtml(trend)}</div>
    </article>
  `;
}
function renderReminders() {
    reminderList.innerHTML = "";
    const reminders = state.reminders
        .filter((reminder) => !reminder.sentAt)
        .sort((a, b) => (a.triggerAt < b.triggerAt ? -1 : 1))
        .slice(0, 5);
    reminders.forEach((reminder) => {
        const task = state.tasks.find((item) => item.id === reminder.taskId);
        if (!task)
            return;
        const li = document.createElement("li");
        li.className = "card compact";
        li.innerHTML = `
      <div class="card-head">
        <h4>${escapeHtml(task.title)}</h4>
        <span>${reminder.type === "due" ? "Due" : "Stale"}</span>
      </div>
      <p>Trigger: ${formatDate(reminder.triggerAt)}</p>
      <div class="action-row">
        <button data-action="dismissReminder" data-id="${reminder.id}">Dismiss</button>
      </div>
    `;
        reminderList.appendChild(li);
    });
    reminderList.querySelectorAll('button[data-action="dismissReminder"]').forEach((btn) => {
        btn.addEventListener("click", () => {
            const reminder = state.reminders.find((item) => item.id === btn.dataset.id);
            if (!reminder)
                return;
            reminder.sentAt = nowIso();
            saveState();
            renderReminders();
        });
    });
}
function renderWeeklySummary() {
    const summary = buildWeeklySummary();
    state.weeklySummaries = [summary];
    saveState();
    weeklySummaryBody.innerHTML = `<p>${escapeHtml(summary.content)}</p>`;
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
    syncStatusLabel.textContent = `Sync: ${navigator.onLine ? "online" : "offline"}`;
    syncQueueCount.textContent = `Queue: ${state.pendingSessions.length}`;
    syncNowBtn.disabled = !navigator.onLine || state.pendingSessions.length === 0;
}
function updateProgress() {
    const total = state.tasks.length;
    const done = state.tasks.filter((task) => task.status === "done").length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${done}/${total} zavrseno`;
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
    const blockerText = blockers.length ? blockers.join(", ") : "nema";
    const content = `Ove nedelje: zavrseno ${weekTasks.length} taskova, ukupno ${totalMinutes} min rada, top blokatori: ${blockerText}.`;
    return {
        id: uid(),
        weekStart: weekStartIso,
        content,
        generatedAt: nowIso()
    };
}
function renderSimpleList(target, items, emptyMessage) {
    if (!items.length) {
        target.innerHTML = `<li>${escapeHtml(emptyMessage)}</li>`;
        return;
    }
    target.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}
function flushPendingSessions() {
    if (!navigator.onLine || state.pendingSessions.length === 0)
        return 0;
    const queue = [...state.pendingSessions].sort((a, b) => a.queuedAt.localeCompare(b.queuedAt) || a.id.localeCompare(b.id));
    state.pendingSessions = [];
    queue.forEach((pending) => commitSession(pending));
    saveState();
    return queue.length;
}
function commitSession(payload) {
    const task = state.tasks.find((item) => item.id === payload.taskId);
    if (!task)
        return;
    const end = new Date();
    const start = new Date(end.getTime() - payload.minutes * 60000);
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
function calculateWorklogStreak() {
    if (!state.sessions.length)
        return 0;
    const activeDays = new Set(state.sessions.map((session) => session.startedAt.slice(0, 10)));
    let streak = 0;
    const cursor = startOfDay(new Date());
    while (true) {
        const key = cursor.toISOString().slice(0, 10);
        if (activeDays.has(key)) {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }
        else {
            break;
        }
    }
    return streak;
}
function weeklyTrendText() {
    const start = startOfWeek(new Date());
    const currentWeekDone = state.tasks.filter((task) => task.archivedAt && new Date(task.archivedAt) >= start).length;
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevWeekDone = state.tasks.filter((task) => {
        if (!task.archivedAt)
            return false;
        const doneAt = new Date(task.archivedAt);
        return doneAt >= prevStart && doneAt < start;
    }).length;
    if (currentWeekDone > prevWeekDone)
        return `+${currentWeekDone - prevWeekDone} vs prosle`;
    if (currentWeekDone < prevWeekDone)
        return `-${prevWeekDone - currentWeekDone} vs prosle`;
    return "isto kao prosle";
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
    const raw = localStorage.getItem(STORAGE_KEY);
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
function saveState() {
    sortState(state);
    const envelope = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        data: state
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
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
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task)
        return null;
    const session = state.sessions.find((item) => item.taskId === taskId);
    if (session)
        return session.endedAt;
    return task.updatedAt;
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
    const counts = new Map();
    sessions.forEach((session) => {
        const blocker = session.blocker.trim();
        if (!blocker)
            return;
        counts.set(blocker, (counts.get(blocker) || 0) + 1);
    });
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((entry) => entry[0]);
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
    const staleTasks = state.tasks
        .filter((task) => task.status !== "done")
        .sort((a, b) => nextUpScore(b) - nextUpScore(a))
        .slice(0, 5);
    return staleTasks.map((task) => task.title);
}
function validateTaskDraft(input) {
    const title = input.title.trim();
    const description = input.description.trim();
    const priority = parsePriority(input.priority);
    if (!title || title.length > MAX_TITLE_LENGTH || !priority || description.length > MAX_DESCRIPTION_LENGTH) {
        return null;
    }
    let dueAt = null;
    if (input.dueAt) {
        const iso = new Date(input.dueAt).toISOString();
        if (!isValidIsoDate(iso))
            return null;
        dueAt = iso;
    }
    return { title, description, priority, dueAt };
}
function validatePendingSessionDraft(input) {
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
function normalizeProject(value) {
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
function normalizeTask(value) {
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
function normalizeSession(value) {
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
function normalizePendingSession(value) {
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
function normalizeReminder(value) {
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
function normalizeWeeklySummary(value) {
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
function sortState(input) {
    input.projects.sort((a, b) => a.name.localeCompare(b.name, "sr-RS") || a.id.localeCompare(b.id));
    input.tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    input.sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt) || b.id.localeCompare(a.id));
    input.pendingSessions.sort((a, b) => b.queuedAt.localeCompare(a.queuedAt) || b.id.localeCompare(a.id));
    input.reminders.sort((a, b) => a.triggerAt.localeCompare(b.triggerAt) || a.id.localeCompare(b.id));
    input.weeklySummaries.sort((a, b) => b.weekStart.localeCompare(a.weekStart) || b.id.localeCompare(a.id));
    return input;
}
function parsePriority(value) {
    if (value === "hitno" || value === "bitno" || value === "moze")
        return value;
    return null;
}
function parseTaskStatus(value) {
    if (value === "todo" || value === "in_progress" || value === "done")
        return value;
    return null;
}
function normalizeIsoDate(value) {
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
function isValidIsoDate(value) {
    return !Number.isNaN(new Date(value).getTime());
}
function nextUpScore(task) {
    let score = 0;
    if (task.priority === "hitno")
        score += 30;
    if (task.priority === "bitno")
        score += 15;
    if (task.status === "in_progress")
        score += 20;
    if (task.dueAt) {
        const hoursLeft = (new Date(task.dueAt).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursLeft <= 24)
            score += 25;
        else if (hoursLeft <= 72)
            score += 10;
    }
    const lastActivity = latestTaskActivity(task.id);
    if (lastActivity) {
        const idleHours = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
        if (idleHours > 48)
            score += 10;
    }
    return score;
}
function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
function startOfWeek(date) {
    const copy = new Date(date);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
}
function byId(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`Missing element: ${id}`);
    return el;
}
function uid() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2, 9)}`;
}
function nowIso() {
    return new Date().toISOString();
}
function formatDate(value) {
    return new Date(value).toLocaleString("sr-RS", {
        dateStyle: "short",
        timeStyle: "short"
    });
}
function formatDay(value) {
    return new Date(value).toLocaleDateString("sr-RS", {
        weekday: "long",
        month: "short",
        day: "numeric"
    });
}
function statusLabel(status) {
    if (status === "todo")
        return "Todo";
    if (status === "in_progress")
        return "In progress";
    return "Done";
}
function priorityLabel(priority) {
    if (priority === "hitno")
        return "Hitno";
    if (priority === "bitno")
        return "Bitno";
    return "Moze";
}
function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
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
function showDiffModal(title, description, preview) {
    byId("diffModalTitle").textContent = title;
    diffModalDescription.textContent = description;
    activeDiffModalPreview = { ...preview, mode: lastDiffModalViewMode };
    updateDiffModalView();
    diffModal.classList.remove("hidden");
    diffModalCancelBtn.focus();
    if (activeDiffModalResolver) {
        activeDiffModalResolver(false);
        activeDiffModalResolver = null;
    }
    return new Promise((resolve) => {
        activeDiffModalResolver = resolve;
    });
}
function closeDiffModal(approved) {
    if (diffModal.classList.contains("hidden"))
        return;
    diffModal.classList.add("hidden");
    diffModalBody.textContent = "";
    activeDiffModalPreview = null;
    const resolver = activeDiffModalResolver;
    activeDiffModalResolver = null;
    if (resolver)
        resolver(approved);
}
function toggleDiffModalView() {
    if (!activeDiffModalPreview)
        return;
    activeDiffModalPreview.mode = activeDiffModalPreview.mode === "detailed" ? "compact" : "detailed";
    lastDiffModalViewMode = activeDiffModalPreview.mode;
    saveDiffViewMode(lastDiffModalViewMode);
    updateDiffModalView();
}
function updateDiffModalView() {
    if (!activeDiffModalPreview)
        return;
    const preview = activeDiffModalPreview.mode === "detailed" ? activeDiffModalPreview.detailed : activeDiffModalPreview.compact;
    diffModalBody.innerHTML = renderDiffPreviewHtml(preview);
    diffModalViewToggleBtn.textContent = activeDiffModalPreview.mode === "detailed" ? "View: Detailed" : "View: Compact";
    diffModalViewToggleBtn.classList.toggle("is-active", activeDiffModalPreview.mode === "detailed");
}
function loadDiffViewMode() {
    const saved = localStorage.getItem(DIFF_VIEW_MODE_KEY);
    return saved === "compact" ? "compact" : "detailed";
}
function saveDiffViewMode(mode) {
    localStorage.setItem(DIFF_VIEW_MODE_KEY, mode);
}
function resetPreferences() {
    const confirmed = window.confirm("Reset UI preferences to default values?");
    if (!confirmed)
        return;
    localStorage.removeItem(DIFF_VIEW_MODE_KEY);
    lastDiffModalViewMode = "detailed";
    showToast("Preferences reset.");
}
function renderDiffPreviewHtml(preview) {
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
function exportBackupJson() {
    const now = new Date();
    const filename = `devtasker-backup-${now.toISOString().slice(0, 10)}.json`;
    const payload = {
        version: 1,
        exportedAt: now.toISOString(),
        data: state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast(`Backup exported: ${filename}`);
}
async function handleImportBackup() {
    const file = importBackupInput.files?.[0];
    if (!file)
        return;
    try {
        const text = await file.text();
        const raw = JSON.parse(text);
        const payload = raw;
        const candidate = payload && typeof payload === "object" && payload.data ? payload.data : raw;
        const next = normalizeAppState(candidate);
        const importMode = importModeSelect.value === "merge" ? "merge" : "replace";
        const preview = {
            compact: buildDiffPreview(state, next, importMode, "compact"),
            detailed: buildDiffPreview(state, next, importMode, "detailed")
        };
        const modeNote = importMode === "merge"
            ? "Merge mode keeps existing items by id (removed count stays 0 by design)."
            : "Replace mode can remove items missing from imported backup.";
        const confirmed = await showDiffModal("Confirm import", `Mode: ${importMode}. ${modeNote}`, preview);
        if (!confirmed) {
            showToast("Import cancelled.");
            return;
        }
        snapshotCurrentState(`import:${importMode}`);
        if (importMode === "merge") {
            mergeState(next);
        }
        else {
            replaceState(next);
        }
        saveState();
        renderAll();
        showToast(`Backup imported (${importMode}).`);
    }
    catch {
        showToast("Invalid backup file.");
    }
    finally {
        importBackupInput.value = "";
    }
}
function exportWeeklyReport() {
    const summary = state.weeklySummaries[0] ?? buildWeeklySummary();
    const now = new Date();
    const lines = [
        "# DevTasker Weekly Report",
        "",
        `Generated: ${now.toLocaleString("sr-RS")}`,
        `Week start: ${new Date(summary.weekStart).toLocaleDateString("sr-RS")}`,
        "",
        "## Summary",
        summary.content,
        "",
        "## Analytics",
        `- Avg lead time: ${averageLeadTimeHours()}h`,
        `- Worklog streak: ${calculateWorklogStreak()} dana`,
        `- Weekly trend: ${weeklyTrendText()}`,
        "",
        "## Top blockers",
        ...formatAsList(topBlockers(state.sessions), "Nema blocker-a"),
        "",
        "## Next up",
        ...formatAsList(predictTodayItems(), "Nema predloga za danas.")
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const filename = `devtasker-weekly-${now.toISOString().slice(0, 10)}.md`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast(`Report exported: ${filename}`);
}
function averageLeadTimeHours() {
    const doneTasks = state.tasks.filter((task) => task.archivedAt);
    if (!doneTasks.length)
        return 0;
    return Math.round(doneTasks.reduce((sum, task) => {
        const end = new Date(task.archivedAt || task.updatedAt).getTime();
        const start = new Date(task.createdAt).getTime();
        return sum + (end - start) / (1000 * 60 * 60);
    }, 0) / doneTasks.length);
}
function formatAsList(items, fallback) {
    if (!items.length)
        return [`- ${fallback}`];
    return items.map((item) => `- ${item}`);
}
function buildDiffPreview(current, incoming, mode, detailLevel) {
    const taskTitle = (taskId) => {
        const fromIncoming = incoming.tasks.find((item) => item.id === taskId);
        if (fromIncoming)
            return fromIncoming.title;
        const fromCurrent = current.tasks.find((item) => item.id === taskId);
        return fromCurrent?.title || taskId;
    };
    const proj = countDiffDetailed(current.projects, incoming.projects, mode, (item) => item.name || item.id);
    const tasks = countDiffDetailed(current.tasks, incoming.tasks, mode, (item) => item.title || item.id);
    const sessions = countDiffDetailed(current.sessions, incoming.sessions, mode, (item) => `${taskTitle(item.taskId)} (${formatDay(item.startedAt.slice(0, 10))})`);
    const pending = countDiffDetailed(current.pendingSessions, incoming.pendingSessions, mode, (item) => `${taskTitle(item.taskId)} (${item.minutes}m)`);
    const reminders = countDiffDetailed(current.reminders, incoming.reminders, mode, (item) => `${item.type.toUpperCase()} - ${taskTitle(item.taskId)}`);
    const weekly = countDiffDetailed(current.weeklySummaries, incoming.weeklySummaries, mode, (item) => new Date(item.weekStart).toLocaleDateString("sr-RS"));
    return [
        ...formatDiffSection("Projects", proj, detailLevel),
        ...formatDiffSection("Tasks", tasks, detailLevel),
        ...formatDiffSection("Sessions", sessions, detailLevel),
        ...formatDiffSection("Pending sessions", pending, detailLevel),
        ...formatDiffSection("Reminders", reminders, detailLevel),
        ...formatDiffSection("Weekly summaries", weekly, detailLevel)
    ].join("\n");
}
function countDiffDetailed(current, incoming, mode, label) {
    const currentMap = new Map(current.map((item) => [item.id, item]));
    const incomingMap = new Map(incoming.map((item) => [item.id, item]));
    const sampleAdded = [];
    const sampleRemoved = [];
    const sampleUpdated = [];
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
            if (!incomingMap.has(id))
                sampleRemoved.push(label(currentItem));
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
function formatDiffSection(title, diff, detailLevel) {
    const lines = [`${title}: ${formatDiff(diff)}`];
    if (detailLevel === "compact")
        return lines;
    if (diff.sampleAdded.length > 0)
        lines.push(`  + Added: ${diff.sampleAdded.join(", ")}`);
    if (diff.sampleRemoved.length > 0)
        lines.push(`  - Removed: ${diff.sampleRemoved.join(", ")}`);
    if (diff.sampleUpdated.length > 0)
        lines.push(`  ~ Updated: ${diff.sampleUpdated.join(", ")}`);
    return lines;
}
function formatDiff(diff) {
    return `+${diff.added} / -${diff.removed} / ~${diff.updated}`;
}
function normalizeAppState(input) {
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
function createEmptyState() {
    return {
        projects: [],
        tasks: [],
        sessions: [],
        pendingSessions: [],
        reminders: [],
        weeklySummaries: []
    };
}
function isPersistedEnvelope(value) {
    if (!value || typeof value !== "object")
        return false;
    const v = value;
    return typeof v.schemaVersion === "number" && typeof v.data === "object";
}
function migrateState(input, _fromVersion) {
    return normalizeAppState(input);
}
function replaceState(next) {
    state.projects = next.projects;
    state.tasks = next.tasks;
    state.sessions = next.sessions;
    state.pendingSessions = next.pendingSessions;
    state.reminders = next.reminders;
    state.weeklySummaries = next.weeklySummaries;
}
function mergeState(next) {
    state.projects = mergeById(state.projects, next.projects);
    state.tasks = mergeById(state.tasks, next.tasks);
    state.sessions = mergeById(state.sessions, next.sessions);
    state.pendingSessions = mergeById(state.pendingSessions, next.pendingSessions);
    state.reminders = mergeById(state.reminders, next.reminders);
    state.weeklySummaries = mergeById(state.weeklySummaries, next.weeklySummaries);
}
function mergeById(current, incoming) {
    const map = new Map();
    current.forEach((item) => map.set(item.id, item));
    incoming.forEach((item) => map.set(item.id, item));
    return [...map.values()];
}
function resetAppData() {
    const confirmed = window.confirm("This will remove all local DevTasker data. Continue?");
    if (!confirmed)
        return;
    snapshotCurrentState("reset");
    replaceState({
        projects: [],
        tasks: [],
        sessions: [],
        pendingSessions: [],
        reminders: [],
        weeklySummaries: []
    });
    saveState();
    renderAll();
    showToast("App data reset.");
}
async function undoLastDestructiveAction() {
    const snapshots = getSnapshots();
    const selected = snapshotHistorySelect.value;
    const snapshot = snapshots.find((item) => item.savedAt === selected) ?? snapshots[0];
    if (!snapshot) {
        showToast("No snapshot available.");
        return;
    }
    const target = normalizeAppState(snapshot.data);
    const preview = {
        compact: buildDiffPreview(state, target, "replace", "compact"),
        detailed: buildDiffPreview(state, target, "replace", "detailed")
    };
    const confirmed = await showDiffModal("Confirm undo", `Snapshot reason: ${snapshot.reason}. This will replace current local state.`, preview);
    if (!confirmed) {
        showToast("Undo cancelled.");
        return;
    }
    replaceState(target);
    saveState();
    renderAll();
    showToast(`Undo applied (${snapshot.reason}).`);
}
function snapshotCurrentState(reason) {
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
    const snapshots = getSnapshots();
    snapshots.unshift(snapshot);
    setSnapshots(snapshots);
}
function getSnapshots() {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
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
function setSnapshots(snapshots) {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots.slice(0, 3)));
}
function updateUndoAvailability() {
    const snapshots = getSnapshots();
    undoLastChangeBtn.disabled = snapshots.length === 0;
    deleteSelectedSnapshotBtn.disabled = snapshots.length === 0;
    clearSnapshotHistoryBtn.disabled = snapshots.length === 0;
    snapshotHistorySelect.innerHTML = snapshots
        .map((snapshot) => {
        const when = new Date(snapshot.savedAt).toLocaleString("sr-RS", {
            dateStyle: "short",
            timeStyle: "short"
        });
        const counts = snapshotDataCounts(snapshot);
        return `<option value="${snapshot.savedAt}">${escapeHtml(snapshot.reason)} @ ${when} - ${counts.projects} projects / ${counts.tasks} tasks / ${counts.sessions} sessions</option>`;
    })
        .join("");
    if (snapshots.length === 0) {
        snapshotMeta.textContent = "No snapshot available.";
        snapshotHistorySelect.innerHTML = `<option value="">No snapshots</option>`;
        snapshotHistorySelect.disabled = true;
        return;
    }
    snapshotHistorySelect.disabled = false;
    const latest = snapshots[0];
    const when = new Date(latest.savedAt).toLocaleString("sr-RS", {
        dateStyle: "short",
        timeStyle: "short"
    });
    const counts = snapshotDataCounts(latest);
    snapshotMeta.textContent = `Latest snapshot: ${latest.reason} @ ${when} - ${counts.projects} projects / ${counts.tasks} tasks / ${counts.sessions} sessions (stored: ${snapshots.length}/3)`;
}
function snapshotDataCounts(snapshot) {
    const projects = Array.isArray(snapshot.data.projects) ? snapshot.data.projects.length : 0;
    const tasks = Array.isArray(snapshot.data.tasks) ? snapshot.data.tasks.length : 0;
    const sessions = Array.isArray(snapshot.data.sessions) ? snapshot.data.sessions.length : 0;
    return { projects, tasks, sessions };
}
function deleteSelectedSnapshot() {
    const snapshots = getSnapshots();
    if (!snapshots.length) {
        showToast("No snapshots to delete.");
        return;
    }
    const selected = snapshotHistorySelect.value;
    const next = snapshots.filter((item) => item.savedAt !== selected);
    setSnapshots(next);
    renderAll();
    showToast(next.length === snapshots.length ? "Snapshot not found." : "Selected snapshot deleted.");
}
function clearSnapshotHistory() {
    const snapshots = getSnapshots();
    if (!snapshots.length) {
        showToast("Snapshot history already empty.");
        return;
    }
    const confirmed = window.confirm("Delete all stored snapshots?");
    if (!confirmed)
        return;
    localStorage.removeItem(SNAPSHOT_KEY);
    renderAll();
    showToast("Snapshot history cleared.");
}
function renderDiagnostics() {
    diagSchemaVersion.textContent = `Schema: v${CURRENT_SCHEMA_VERSION}`;
    diagSnapshots.textContent = `Snapshots: ${getSnapshots().length}/3`;
    diagQueue.textContent = `Queue: ${state.pendingSessions.length}`;
    diagNetwork.textContent = `Network: ${navigator.onLine ? "online" : "offline"}`;
}
