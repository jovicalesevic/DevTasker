import type { SnapshotEntry } from "./types";

interface SnapshotUiDeps {
  getSnapshots: () => SnapshotEntry[];
  setSnapshots: (snapshots: SnapshotEntry[]) => void;
  snapshotHistorySelect: HTMLSelectElement;
  snapshotMeta: HTMLParagraphElement;
  undoLastChangeBtn: HTMLButtonElement;
  deleteSelectedSnapshotBtn: HTMLButtonElement;
  clearSnapshotHistoryBtn: HTMLButtonElement;
  snapshotDataCounts: (snapshot: SnapshotEntry) => { projects: number; tasks: number; sessions: number };
  escapeHtml: (value: string) => string;
  showToast: (message: string) => void;
  renderAll: () => void;
  snapshotStorageKey: string;
  t: (key: string) => string;
  tf: (key: string, vars: Record<string, string | number>) => string;
  locale: () => string;
}

export function createSnapshotUiController(deps: SnapshotUiDeps): {
  updateUndoAvailability: () => void;
  deleteSelectedSnapshot: () => void;
  clearSnapshotHistory: () => void;
} {
  return {
    updateUndoAvailability(): void {
      const snapshots = deps.getSnapshots();
      deps.undoLastChangeBtn.disabled = snapshots.length === 0;
      deps.deleteSelectedSnapshotBtn.disabled = snapshots.length === 0;
      deps.clearSnapshotHistoryBtn.disabled = snapshots.length === 0;
      deps.snapshotHistorySelect.innerHTML = snapshots
        .map((snapshot) => {
          const when = new Date(snapshot.savedAt).toLocaleString(deps.locale(), {
            dateStyle: "short",
            timeStyle: "short"
          });
          const counts = deps.snapshotDataCounts(snapshot);
          return `<option value="${snapshot.savedAt}">${deps.escapeHtml(snapshot.reason)} @ ${when} - ${counts.projects} projects / ${counts.tasks} tasks / ${counts.sessions} sessions</option>`;
        })
        .join("");

      if (snapshots.length === 0) {
        deps.snapshotMeta.textContent = deps.t("snapshot.none");
        deps.snapshotHistorySelect.innerHTML = `<option value="">No snapshots</option>`;
        deps.snapshotHistorySelect.disabled = true;
        return;
      }
      deps.snapshotHistorySelect.disabled = false;
      const latest = snapshots[0];
      const when = new Date(latest.savedAt).toLocaleString(deps.locale(), {
        dateStyle: "short",
        timeStyle: "short"
      });
      const counts = deps.snapshotDataCounts(latest);
      deps.snapshotMeta.textContent = deps.tf("snapshot.latestMeta", {
        reason: latest.reason,
        when,
        projects: counts.projects,
        tasks: counts.tasks,
        sessions: counts.sessions,
        count: snapshots.length
      });
    },
    deleteSelectedSnapshot(): void {
      const snapshots = deps.getSnapshots();
      if (!snapshots.length) {
        deps.showToast(deps.t("snapshot.noneToDelete"));
        return;
      }
      const selected = deps.snapshotHistorySelect.value;
      const next = snapshots.filter((item) => item.savedAt !== selected);
      deps.setSnapshots(next);
      deps.renderAll();
      deps.showToast(next.length === snapshots.length ? deps.t("snapshot.notFound") : deps.t("snapshot.selectedDeleted"));
    },
    clearSnapshotHistory(): void {
      const snapshots = deps.getSnapshots();
      if (!snapshots.length) {
        deps.showToast(deps.t("snapshot.historyEmpty"));
        return;
      }
      const confirmed = window.confirm(deps.t("snapshot.confirmClearAll"));
      if (!confirmed) return;
      localStorage.removeItem(deps.snapshotStorageKey);
      deps.renderAll();
      deps.showToast(deps.t("snapshot.historyCleared"));
    }
  };
}
