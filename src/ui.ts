import type { AppState, Task, WeeklySummary } from "./types";

interface UiElements {
  activeTaskList: HTMLUListElement;
  archiveTaskList: HTMLUListElement;
  worklogTimeline: HTMLDivElement;
  nextUpBoard: HTMLDivElement;
  reminderList: HTMLUListElement;
  weeklySummaryBody: HTMLDivElement;
  analyticsPanel: HTMLDivElement;
  standupYesterday: HTMLUListElement;
  standupToday: HTMLUListElement;
  standupBlockers: HTMLUListElement;
  activeProjectFilter: HTMLSelectElement;
  archiveProjectFilter: HTMLSelectElement;
  archiveSearch: HTMLInputElement;
  sessionTaskSelect: HTMLSelectElement;
  emptyActiveState: HTMLDivElement;
  emptyWorklogState: HTMLDivElement;
  emptyArchiveState: HTMLDivElement;
  syncStatusLabel: HTMLSpanElement;
  syncQueueCount: HTMLSpanElement;
  syncNowBtn: HTMLButtonElement;
  progressFill: HTMLDivElement;
  progressText: HTMLSpanElement;
  diagSchemaVersion: HTMLSpanElement | null;
  diagSnapshots: HTMLSpanElement | null;
  diagQueue: HTMLSpanElement | null;
  diagNetwork: HTMLSpanElement | null;
}

interface UiCallbacks {
  getProject: (projectId: string) => { name: string } | undefined;
  changeTaskStatus: (id: string, status: "todo" | "in_progress" | "done") => void;
  archiveTask: (id: string) => void;
  saveState: () => void;
  nowIso: () => string;
  formatDate: (value: string) => string;
  formatDay: (value: string) => string;
  escapeHtml: (value: string) => string;
  statusLabel: (status: Task["status"]) => string;
  priorityLabel: (priority: Task["priority"]) => string;
  groupSessionsByDay: (sessions: AppState["sessions"]) => Record<string, AppState["sessions"]>;
  nextUpScore: (task: Task) => number;
  uniqueTaskTitles: (sessions: AppState["sessions"]) => string[];
  predictTodayItems: () => string[];
  topBlockers: (sessions: AppState["sessions"]) => string[];
  averageLeadTimeHours: () => number;
  calculateWorklogStreak: () => number;
  weeklyTrendText: () => string;
  buildWeeklySummary: () => WeeklySummary;
  getSnapshotsCount: () => number;
}

interface UiOptions {
  defaultProjectName: string;
  schemaVersion: number;
}

export function createUiRenderer(
  getState: () => AppState,
  elements: UiElements,
  callbacks: UiCallbacks,
  options: UiOptions
): {
  renderProjectFilters: () => void;
  renderActiveTasks: () => void;
  renderSessionTaskSelect: () => void;
  renderWorklog: () => void;
  renderArchive: () => void;
  renderNextUp: () => void;
  renderStandupMode: () => void;
  renderAnalytics: () => void;
  renderReminders: () => void;
  renderWeeklySummary: () => void;
  updateSyncStatus: () => void;
  updateProgress: () => void;
  renderDiagnostics: () => void;
} {
  function renderSimpleList(target: HTMLUListElement, items: string[], emptyMessage: string): void {
    if (!items.length) {
      target.innerHTML = `<li>${callbacks.escapeHtml(emptyMessage)}</li>`;
      return;
    }
    target.innerHTML = items.map((item) => `<li>${callbacks.escapeHtml(item)}</li>`).join("");
  }

  return {
    renderProjectFilters(): void {
      const state = getState();
      const optionsHtml = state.projects
        .map((project) => `<option value="${project.id}">${callbacks.escapeHtml(project.name)}</option>`)
        .join("");
      const allOption = `<option value="">All projects</option>`;
      elements.activeProjectFilter.innerHTML = allOption + optionsHtml;
      elements.archiveProjectFilter.innerHTML = allOption + optionsHtml;
    },
    renderActiveTasks(): void {
      const state = getState();
      const filterProjectId = elements.activeProjectFilter.value;
      elements.activeTaskList.innerHTML = "";

      const activeTasks = state.tasks.filter((task) => {
        if (task.status === "done") return false;
        if (filterProjectId && task.projectId !== filterProjectId) return false;
        return true;
      });

      elements.emptyActiveState.classList.toggle("hidden", activeTasks.length > 0);
      activeTasks.forEach((task) => {
        const project = callbacks.getProject(task.projectId);
        const li = document.createElement("li");
        li.className = "card";
        li.innerHTML = `
          <div class="card-head">
            <h4>${callbacks.escapeHtml(task.title)}</h4>
            <span class="priority ${task.priority}">${callbacks.priorityLabel(task.priority)}</span>
          </div>
          <p>${callbacks.escapeHtml(task.description || "No description.")}</p>
          <div class="meta-row">
            <span>${callbacks.escapeHtml(project?.name || options.defaultProjectName)}</span>
            <span>${task.dueAt ? `Due: ${callbacks.formatDate(task.dueAt)}` : "No due date"}</span>
            <span>${callbacks.statusLabel(task.status)}</span>
          </div>
          <div class="action-row">
            <button data-action="markDone" data-id="${task.id}">Mark done</button>
            <button data-action="archive" data-id="${task.id}">Archive</button>
          </div>
        `;
        elements.activeTaskList.appendChild(li);
      });

      elements.activeTaskList.querySelectorAll<HTMLButtonElement>('button[data-action="markDone"]').forEach((btn) => {
        btn.addEventListener("click", () => {
          callbacks.changeTaskStatus(btn.dataset.id || "", "done");
        });
      });
      elements.activeTaskList.querySelectorAll<HTMLButtonElement>('button[data-action="archive"]').forEach((btn) => {
        btn.addEventListener("click", () => {
          callbacks.archiveTask(btn.dataset.id || "");
        });
      });
    },
    renderSessionTaskSelect(): void {
      const state = getState();
      const optionsHtml = state.tasks
        .filter((task) => task.status !== "done")
        .map((task) => `<option value="${task.id}">${callbacks.escapeHtml(task.title)}</option>`)
        .join("");
      elements.sessionTaskSelect.innerHTML = `<option value="">Select task</option>${optionsHtml}`;
    },
    renderWorklog(): void {
      const state = getState();
      elements.worklogTimeline.innerHTML = "";
      const grouped = callbacks.groupSessionsByDay(state.sessions);
      const days = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));
      elements.emptyWorklogState.classList.toggle("hidden", days.length > 0);

      days.forEach((day) => {
        const wrap = document.createElement("section");
        wrap.className = "day-group";
        const list = grouped[day]
          .map((session) => {
            const task = state.tasks.find((item) => item.id === session.taskId);
            const durationMin = Math.max(
              1,
              Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60_000)
            );
            return `
              <article class="card compact">
                <div class="card-head">
                  <h4>${callbacks.escapeHtml(task?.title || "Unknown task")}</h4>
                  <span>${durationMin}m</span>
                </div>
                <p>${callbacks.escapeHtml(session.notes || "No notes.")}</p>
                <div class="meta-row">
                  <span>Blocker: ${callbacks.escapeHtml(session.blocker || "-")}</span>
                  <span>Next: ${callbacks.escapeHtml(session.nextStep || "-")}</span>
                </div>
              </article>
            `;
          })
          .join("");

        wrap.innerHTML = `<h3>${callbacks.formatDay(day)}</h3>${list}`;
        elements.worklogTimeline.appendChild(wrap);
      });
    },
    renderArchive(): void {
      const state = getState();
      elements.archiveTaskList.innerHTML = "";
      const query = elements.archiveSearch.value.trim().toLowerCase();
      const filterProjectId = elements.archiveProjectFilter.value;

      const archivedTasks = state.tasks.filter((task) => {
        if (task.status !== "done" && !task.archivedAt) return false;
        if (filterProjectId && task.projectId !== filterProjectId) return false;
        if (query && !task.title.toLowerCase().includes(query) && !task.description.toLowerCase().includes(query)) {
          return false;
        }
        return true;
      });

      elements.emptyArchiveState.classList.toggle("hidden", archivedTasks.length > 0);
      archivedTasks.forEach((task) => {
        const project = callbacks.getProject(task.projectId);
        const li = document.createElement("li");
        li.className = "card compact";
        li.innerHTML = `
          <div class="card-head">
            <h4>${callbacks.escapeHtml(task.title)}</h4>
            <span>${callbacks.escapeHtml(project?.name || options.defaultProjectName)}</span>
          </div>
          <p>${callbacks.escapeHtml(task.description || "No description.")}</p>
          <div class="meta-row">
            <span>Created: ${callbacks.formatDate(task.createdAt)}</span>
            <span>Done: ${task.archivedAt ? callbacks.formatDate(task.archivedAt) : "-"}</span>
          </div>
        `;
        elements.archiveTaskList.appendChild(li);
      });
    },
    renderNextUp(): void {
      const state = getState();
      elements.nextUpBoard.innerHTML = "";
      const grouped = new Map<string, Task[]>();
      state.tasks
        .filter((task) => task.status !== "done")
        .forEach((task) => {
          const list = grouped.get(task.projectId) ?? [];
          list.push(task);
          grouped.set(task.projectId, list);
        });

      const projectIds = [...grouped.keys()];
      if (!projectIds.length) {
        elements.nextUpBoard.innerHTML = `<div class="empty-state">No next-up candidates.</div>`;
        return;
      }

      projectIds.forEach((projectId) => {
        const project = callbacks.getProject(projectId);
        const topTasks = (grouped.get(projectId) ?? [])
          .sort((a, b) => callbacks.nextUpScore(b) - callbacks.nextUpScore(a))
          .slice(0, 3);

        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
          <div class="card-head">
            <h4>${callbacks.escapeHtml(project?.name || options.defaultProjectName)}</h4>
            <span>Top ${topTasks.length}</span>
          </div>
          <ul class="standup-list">
            ${topTasks.map((task) => `<li>${callbacks.escapeHtml(task.title)}</li>`).join("")}
          </ul>
        `;
        elements.nextUpBoard.appendChild(card);
      });
    },
    renderStandupMode(): void {
      const state = getState();
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

      const yesterdayItems = callbacks.uniqueTaskTitles(yesterdaySessions);
      const todayItems = callbacks.predictTodayItems();
      const blockerItems = callbacks.topBlockers(todaySessions.length ? todaySessions : state.sessions);

      renderSimpleList(elements.standupYesterday, yesterdayItems, "No completed sessions yesterday.");
      renderSimpleList(elements.standupToday, todayItems, "No suggestions for today.");
      renderSimpleList(elements.standupBlockers, blockerItems, "No blockers.");
    },
    renderAnalytics(): void {
      const leadTimeHours = callbacks.averageLeadTimeHours();
      const streak = callbacks.calculateWorklogStreak();
      const trend = callbacks.weeklyTrendText();

      elements.analyticsPanel.innerHTML = `
        <article class="metric-card">
          <div class="metric-label">Avg lead time</div>
          <div class="metric-value">${leadTimeHours}h</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Worklog streak</div>
          <div class="metric-value">${streak} days</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Weekly trend</div>
          <div class="metric-value">${callbacks.escapeHtml(trend)}</div>
        </article>
      `;
    },
    renderReminders(): void {
      const state = getState();
      elements.reminderList.innerHTML = "";
      const reminders = state.reminders
        .filter((reminder) => !reminder.sentAt)
        .sort((a, b) => (a.triggerAt < b.triggerAt ? -1 : 1))
        .slice(0, 5);

      reminders.forEach((reminder) => {
        const task = state.tasks.find((item) => item.id === reminder.taskId);
        if (!task) return;
        const li = document.createElement("li");
        li.className = "card compact";
        li.innerHTML = `
          <div class="card-head">
            <h4>${callbacks.escapeHtml(task.title)}</h4>
            <span>${reminder.type === "due" ? "Due" : "Stale"}</span>
          </div>
          <p>Trigger: ${callbacks.formatDate(reminder.triggerAt)}</p>
          <div class="action-row">
            <button data-action="dismissReminder" data-id="${reminder.id}">Dismiss</button>
          </div>
        `;
        elements.reminderList.appendChild(li);
      });

      elements.reminderList.querySelectorAll<HTMLButtonElement>('button[data-action="dismissReminder"]').forEach((btn) => {
        btn.addEventListener("click", () => {
          const stateSnapshot = getState();
          const reminder = stateSnapshot.reminders.find((item) => item.id === btn.dataset.id);
          if (!reminder) return;
          reminder.sentAt = callbacks.nowIso();
          callbacks.saveState();
          this.renderReminders();
        });
      });
    },
    renderWeeklySummary(): void {
      const state = getState();
      const summary = callbacks.buildWeeklySummary();
      state.weeklySummaries = [summary];
      callbacks.saveState();
      elements.weeklySummaryBody.innerHTML = `<p>${callbacks.escapeHtml(summary.content)}</p>`;
    },
    updateSyncStatus(): void {
      const state = getState();
      elements.syncStatusLabel.textContent = `Sync: ${navigator.onLine ? "online" : "offline"}`;
      elements.syncQueueCount.textContent = `Queue: ${state.pendingSessions.length}`;
      elements.syncNowBtn.disabled = !navigator.onLine || state.pendingSessions.length === 0;
    },
    updateProgress(): void {
      const state = getState();
      const total = state.tasks.length;
      const done = state.tasks.filter((task) => task.status === "done").length;
      const percent = total ? Math.round((done / total) * 100) : 0;
      elements.progressFill.style.width = `${percent}%`;
      elements.progressText.textContent = `${done}/${total} done`;
    },
    renderDiagnostics(): void {
      const state = getState();
      if (elements.diagSchemaVersion) elements.diagSchemaVersion.textContent = `Schema: v${options.schemaVersion}`;
      if (elements.diagSnapshots) elements.diagSnapshots.textContent = `Snapshots: ${callbacks.getSnapshotsCount()}/3`;
      if (elements.diagQueue) elements.diagQueue.textContent = `Queue: ${state.pendingSessions.length}`;
      if (elements.diagNetwork) elements.diagNetwork.textContent = `Network: ${navigator.onLine ? "online" : "offline"}`;
    }
  };
}
