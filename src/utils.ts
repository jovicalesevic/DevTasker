import type { Priority, TaskStatus } from "./types.js";

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function byId<T>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: ${id}`);
  return el as T;
}

export function byIdOptional<T>(id: string): T | null {
  const el = document.getElementById(id);
  return el ? (el as T) : null;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 9)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

export function formatDay(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}

export function statusLabel(status: TaskStatus): string {
  if (status === "todo") return "Todo";
  if (status === "in_progress") return "In progress";
  return "Done";
}

export function priorityLabel(priority: Priority): string {
  if (priority === "hitno") return "Urgent";
  if (priority === "bitno") return "Important";
  return "Can wait";
}

export function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
