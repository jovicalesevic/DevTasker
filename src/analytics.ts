import type { AppState, Session, Task } from "./types.js";

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
  const dayStart = startOfDay(date);
  const day = dayStart.getDay();
  const diff = (day + 6) % 7;
  dayStart.setDate(dayStart.getDate() - diff);
  return dayStart;
}

export function averageLeadTimeHours(state: AppState): number {
  const doneTasks = state.tasks.filter((task) => task.archivedAt);
  if (!doneTasks.length) return 0;
  return Math.round(
    doneTasks.reduce((sum, task) => {
      const end = new Date(task.archivedAt || task.updatedAt).getTime();
      const start = new Date(task.createdAt).getTime();
      return sum + (end - start) / (1000 * 60 * 60);
    }, 0) / doneTasks.length
  );
}

export function calculateWorklogStreak(sessions: Session[]): number {
  if (!sessions.length) return 0;
  const activeDays = new Set(sessions.map((session) => session.startedAt.slice(0, 10)));
  let streak = 0;
  const cursor = startOfDay(new Date());
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (activeDays.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function weeklyTrendText(state: AppState): string {
  const start = startOfWeek(new Date());
  const currentWeekDone = state.tasks.filter(
    (task) => task.archivedAt && new Date(task.archivedAt) >= start
  ).length;
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - 7);
  const prevWeekDone = state.tasks.filter((task) => {
    if (!task.archivedAt) return false;
    const doneAt = new Date(task.archivedAt);
    return doneAt >= prevStart && doneAt < start;
  }).length;

  if (currentWeekDone > prevWeekDone) return `+${currentWeekDone - prevWeekDone} vs previous week`;
  if (currentWeekDone < prevWeekDone) return `-${prevWeekDone - currentWeekDone} vs previous week`;
  return "same as previous week";
}

export function topBlockers(sessions: Session[]): string[] {
  const counts = new Map<string, number>();
  sessions.forEach((session) => {
    const blocker = session.blocker.trim();
    if (!blocker) return;
    counts.set(blocker, (counts.get(blocker) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0]);
}

export function latestTaskActivity(state: AppState, taskId: string): string | null {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return null;
  const session = state.sessions.find((item) => item.taskId === taskId);
  if (session) return session.endedAt;
  return task.updatedAt;
}

export function nextUpScore(task: Task, lastActivity: string | null): number {
  let score = 0;
  if (task.priority === "hitno") score += 30;
  if (task.priority === "bitno") score += 15;
  if (task.status === "in_progress") score += 20;
  if (task.dueAt) {
    const hoursLeft = (new Date(task.dueAt).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursLeft <= 24) score += 25;
    else if (hoursLeft <= 72) score += 10;
  }
  if (lastActivity) {
    const idleHours = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
    if (idleHours > 48) score += 10;
  }
  return score;
}

export function predictTodayItems(state: AppState, scoreFn: (task: Task) => number): string[] {
  const staleTasks = state.tasks
    .filter((task) => task.status !== "done")
    .sort((a, b) => scoreFn(b) - scoreFn(a))
    .slice(0, 5);
  return staleTasks.map((task) => task.title);
}
