export function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
export function startOfWeek(date) {
    const copy = new Date(date);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
}
export function byId(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`Missing element: ${id}`);
    return el;
}
export function byIdOptional(id) {
    const el = document.getElementById(id);
    return el ? el : null;
}
export function uid() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2, 9)}`;
}
export function nowIso() {
    return new Date().toISOString();
}
export function formatDate(value) {
    return new Date(value).toLocaleString("en-US", {
        dateStyle: "short",
        timeStyle: "short"
    });
}
export function formatDay(value) {
    return new Date(value).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric"
    });
}
export function statusLabel(status) {
    if (status === "todo")
        return "Todo";
    if (status === "in_progress")
        return "In progress";
    return "Done";
}
export function priorityLabel(priority) {
    if (priority === "hitno")
        return "Urgent";
    if (priority === "bitno")
        return "Important";
    return "Can wait";
}
export function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}
