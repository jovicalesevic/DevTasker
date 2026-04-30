export function createUiRenderer(getState, elements, callbacks, options) {
    function renderSimpleList(target, items, emptyMessage) {
        if (!items.length) {
            target.innerHTML = `<li>${callbacks.escapeHtml(emptyMessage)}</li>`;
            return;
        }
        target.innerHTML = items.map((item) => `<li>${callbacks.escapeHtml(item)}</li>`).join("");
    }
    return {
        renderProjectFilters() {
            const state = getState();
            const optionsHtml = state.projects
                .map((project) => `<option value="${project.id}">${callbacks.escapeHtml(project.name)}</option>`)
                .join("");
            const allOption = `<option value="">${callbacks.t("filter.allProjects")}</option>`;
            elements.activeProjectFilter.innerHTML = allOption + optionsHtml;
            elements.archiveProjectFilter.innerHTML = allOption + optionsHtml;
        },
        renderActiveTasks() {
            const state = getState();
            const filterProjectId = elements.activeProjectFilter.value;
            elements.activeTaskList.innerHTML = "";
            const activeTasks = state.tasks.filter((task) => {
                if (task.status === "done")
                    return false;
                if (filterProjectId && task.projectId !== filterProjectId)
                    return false;
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
          <p>${callbacks.escapeHtml(task.description || callbacks.t("common.noDescription"))}</p>
          <div class="meta-row">
            <span>${callbacks.escapeHtml(project?.name || options.defaultProjectName)}</span>
            <span>${task.dueAt ? `${callbacks.t("common.duePrefix")} ${callbacks.formatDate(task.dueAt)}` : callbacks.t("common.noDueDate")}</span>
            <span>${callbacks.statusLabel(task.status)}</span>
          </div>
          <div class="action-row">
            <button data-action="markDone" data-id="${task.id}">${callbacks.t("btn.markDone")}</button>
            <button data-action="archive" data-id="${task.id}">${callbacks.t("btn.archive")}</button>
          </div>
        `;
                elements.activeTaskList.appendChild(li);
            });
            elements.activeTaskList.querySelectorAll('button[data-action="markDone"]').forEach((btn) => {
                btn.addEventListener("click", () => {
                    callbacks.changeTaskStatus(btn.dataset.id || "", "done");
                });
            });
            elements.activeTaskList.querySelectorAll('button[data-action="archive"]').forEach((btn) => {
                btn.addEventListener("click", () => {
                    callbacks.archiveTask(btn.dataset.id || "");
                });
            });
        },
        renderSessionTaskSelect() {
            const state = getState();
            const optionsHtml = state.tasks
                .filter((task) => task.status !== "done")
                .map((task) => `<option value="${task.id}">${callbacks.escapeHtml(task.title)}</option>`)
                .join("");
            elements.sessionTaskSelect.innerHTML = `<option value="">${callbacks.t("input.selectTask")}</option>${optionsHtml}`;
        },
        renderWorklog() {
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
                    const durationMin = Math.max(1, Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000));
                    return `
              <article class="card compact">
                <div class="card-head">
                  <h4>${callbacks.escapeHtml(task?.title || callbacks.t("common.unknownTask"))}</h4>
                  <span>${durationMin}m</span>
                </div>
                <p>${callbacks.escapeHtml(session.notes || callbacks.t("common.noNotes"))}</p>
                <div class="meta-row">
                  <span>${callbacks.t("worklog.blocker")}: ${callbacks.escapeHtml(session.blocker || "-")}</span>
                  <span>${callbacks.t("worklog.next")}: ${callbacks.escapeHtml(session.nextStep || "-")}</span>
                </div>
              </article>
            `;
                })
                    .join("");
                wrap.innerHTML = `<h3>${callbacks.formatDay(day)}</h3>${list}`;
                elements.worklogTimeline.appendChild(wrap);
            });
        },
        renderArchive() {
            const state = getState();
            elements.archiveTaskList.innerHTML = "";
            const query = elements.archiveSearch.value.trim().toLowerCase();
            const filterProjectId = elements.archiveProjectFilter.value;
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
          <p>${callbacks.escapeHtml(task.description || callbacks.t("common.noDescription"))}</p>
          <div class="meta-row">
            <span>${callbacks.t("archive.created")}: ${callbacks.formatDate(task.createdAt)}</span>
            <span>${callbacks.t("archive.done")}: ${task.archivedAt ? callbacks.formatDate(task.archivedAt) : "-"}</span>
          </div>
        `;
                elements.archiveTaskList.appendChild(li);
            });
        },
        renderNextUp() {
            const state = getState();
            elements.nextUpBoard.innerHTML = "";
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
                elements.nextUpBoard.innerHTML = `<div class="empty-state">${callbacks.t("nextup.empty")}</div>`;
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
            <span>${callbacks.t("nextup.top")} ${topTasks.length}</span>
          </div>
          <ul class="standup-list">
            ${topTasks.map((task) => `<li>${callbacks.escapeHtml(task.title)}</li>`).join("")}
          </ul>
        `;
                elements.nextUpBoard.appendChild(card);
            });
        },
        renderStandupMode() {
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
            renderSimpleList(elements.standupYesterday, yesterdayItems, callbacks.t("standup.emptyYesterday"));
            renderSimpleList(elements.standupToday, todayItems, callbacks.t("standup.emptyToday"));
            renderSimpleList(elements.standupBlockers, blockerItems, callbacks.t("standup.emptyBlockers"));
        },
        renderAnalytics() {
            const leadTimeHours = callbacks.averageLeadTimeHours();
            const streak = callbacks.calculateWorklogStreak();
            const trend = callbacks.weeklyTrendText();
            elements.analyticsPanel.innerHTML = `
        <article class="metric-card">
          <div class="metric-label">${callbacks.t("analytics.avgLeadTime")}</div>
          <div class="metric-value">${leadTimeHours}h</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">${callbacks.t("analytics.worklogStreak")}</div>
          <div class="metric-value">${streak} ${callbacks.t("analytics.days")}</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">${callbacks.t("analytics.weeklyTrend")}</div>
          <div class="metric-value">${callbacks.escapeHtml(trend)}</div>
        </article>
      `;
        },
        renderReminders() {
            const state = getState();
            elements.reminderList.innerHTML = "";
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
            <h4>${callbacks.escapeHtml(task.title)}</h4>
            <span>${reminder.type === "due" ? callbacks.t("reminder.due") : callbacks.t("reminder.stale")}</span>
          </div>
          <p>${callbacks.t("reminder.trigger")}: ${callbacks.formatDate(reminder.triggerAt)}</p>
          <div class="action-row">
            <button data-action="dismissReminder" data-id="${reminder.id}">${callbacks.t("btn.dismiss")}</button>
          </div>
        `;
                elements.reminderList.appendChild(li);
            });
            elements.reminderList.querySelectorAll('button[data-action="dismissReminder"]').forEach((btn) => {
                btn.addEventListener("click", () => {
                    const stateSnapshot = getState();
                    const reminder = stateSnapshot.reminders.find((item) => item.id === btn.dataset.id);
                    if (!reminder)
                        return;
                    reminder.sentAt = callbacks.nowIso();
                    callbacks.saveState();
                    this.renderReminders();
                });
            });
        },
        renderWeeklySummary() {
            const state = getState();
            const summary = callbacks.buildWeeklySummary();
            state.weeklySummaries = [summary];
            callbacks.saveState();
            elements.weeklySummaryBody.innerHTML = `<p>${callbacks.escapeHtml(summary.content)}</p>`;
        },
        updateSyncStatus() {
            const state = getState();
            elements.syncStatusLabel.textContent = `${callbacks.t("sync.sync")}: ${navigator.onLine ? callbacks.t("sync.online") : callbacks.t("sync.offline")}`;
            elements.syncQueueCount.textContent = `${callbacks.t("sync.queue")}: ${state.pendingSessions.length}`;
            elements.syncNowBtn.disabled = !navigator.onLine || state.pendingSessions.length === 0;
        },
        updateProgress() {
            const state = getState();
            const total = state.tasks.length;
            const done = state.tasks.filter((task) => task.status === "done").length;
            const percent = total ? Math.round((done / total) * 100) : 0;
            elements.progressFill.style.width = `${percent}%`;
            elements.progressText.textContent = `${done}/${total} ${callbacks.t("progress.done")}`;
        },
        renderDiagnostics() {
            const state = getState();
            if (elements.diagSchemaVersion)
                elements.diagSchemaVersion.textContent = `${callbacks.t("diag.schema")}: v${options.schemaVersion}`;
            if (elements.diagSnapshots)
                elements.diagSnapshots.textContent = `${callbacks.t("diag.snapshots")}: ${callbacks.getSnapshotsCount()}/3`;
            if (elements.diagQueue)
                elements.diagQueue.textContent = `${callbacks.t("diag.queue")}: ${state.pendingSessions.length}`;
            if (elements.diagNetwork)
                elements.diagNetwork.textContent = `${callbacks.t("diag.network")}: ${navigator.onLine ? callbacks.t("sync.online") : callbacks.t("sync.offline")}`;
        }
    };
}
