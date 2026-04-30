export type Priority = "hitno" | "bitno" | "moze";
export type TaskStatus = "todo" | "in_progress" | "done";
export type ReminderType = "due" | "stale";
export type TabKey = "active" | "worklog" | "archive" | "weekly";
export type DiffMode = "replace" | "merge";

export interface Project {
  id: string;
  name: string;
  repo?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  priority: Priority;
  status: TaskStatus;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface Session {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string;
  notes: string;
  blocker: string;
  nextStep: string;
}

export interface PendingSession {
  id: string;
  taskId: string;
  minutes: number;
  notes: string;
  blocker: string;
  nextStep: string;
  queuedAt: string;
}

export interface Reminder {
  id: string;
  taskId: string;
  type: ReminderType;
  triggerAt: string;
  sentAt: string | null;
}

export interface WeeklySummary {
  id: string;
  weekStart: string;
  content: string;
  generatedAt: string;
}

export interface AppState {
  projects: Project[];
  tasks: Task[];
  sessions: Session[];
  pendingSessions: PendingSession[];
  reminders: Reminder[];
  weeklySummaries: WeeklySummary[];
}

export interface PersistedStateEnvelope {
  schemaVersion: number;
  data: AppState;
}

export interface SnapshotEntry {
  savedAt: string;
  reason: string;
  data: Partial<AppState>;
}
