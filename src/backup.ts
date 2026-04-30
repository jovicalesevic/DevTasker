import type { AppState, DiffMode, SnapshotEntry } from "./types.js";

export function exportBackupJson(
  state: AppState,
  showToast: (message: string) => void,
  tf: (key: string, vars: Record<string, string | number>) => string
): void {
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
  showToast(tf("backup.exported", { filename }));
}

interface ImportBackupDeps {
  state: AppState;
  file: File;
  importMode: DiffMode;
  normalizeAppState: (input: Partial<AppState>) => AppState;
  buildDiffPreview: (current: AppState, incoming: AppState, mode: DiffMode, detailLevel: "compact" | "detailed") => string;
  showDiffModal: (title: string, description: string, preview: { compact: string; detailed: string }) => Promise<boolean>;
  snapshotCurrentState: (reason: string) => void;
  mergeState: (next: AppState) => void;
  replaceState: (next: AppState) => void;
  saveState: () => void;
  renderAll: () => void;
  showToast: (message: string) => void;
  t: (key: string) => string;
  tf: (key: string, vars: Record<string, string | number>) => string;
}

export async function importBackupFromFile(deps: ImportBackupDeps): Promise<void> {
  try {
    const text = await deps.file.text();
    const raw = JSON.parse(text) as unknown;
    const payload = raw as { version?: number; data?: Partial<AppState> };
    const candidate = payload && typeof payload === "object" && payload.data ? payload.data : (raw as Partial<AppState>);
    const next = deps.normalizeAppState(candidate);
    const preview = {
      compact: deps.buildDiffPreview(deps.state, next, deps.importMode, "compact"),
      detailed: deps.buildDiffPreview(deps.state, next, deps.importMode, "detailed")
    };
    const modeNote = deps.importMode === "merge" ? deps.t("backup.modeMergeNote") : deps.t("backup.modeReplaceNote");
    const confirmed = await deps.showDiffModal(
      deps.t("backup.confirmImportTitle"),
      deps.tf("backup.confirmImportDesc", { mode: deps.importMode, note: modeNote }),
      preview
    );
    if (!confirmed) {
      deps.showToast(deps.t("backup.importCancelled"));
      return;
    }

    deps.snapshotCurrentState(`import:${deps.importMode}`);
    if (deps.importMode === "merge") deps.mergeState(next);
    else deps.replaceState(next);
    deps.saveState();
    deps.renderAll();
    deps.showToast(deps.tf("backup.imported", { mode: deps.importMode }));
  } catch {
    deps.showToast(deps.t("backup.invalidFile"));
  }
}

interface ResetAppDataDeps {
  snapshotCurrentState: (reason: string) => void;
  replaceState: (next: AppState) => void;
  saveState: () => void;
  renderAll: () => void;
  showToast: (message: string) => void;
  t: (key: string) => string;
}

export function resetAppData(deps: ResetAppDataDeps): void {
  const confirmed = window.confirm(deps.t("backup.confirmResetAppData"));
  if (!confirmed) return;
  deps.snapshotCurrentState("reset");
  deps.replaceState({
    projects: [],
    tasks: [],
    sessions: [],
    pendingSessions: [],
    reminders: [],
    weeklySummaries: []
  });
  deps.saveState();
  deps.renderAll();
  deps.showToast(deps.t("backup.appDataReset"));
}

interface UndoDeps {
  state: AppState;
  selectedSnapshot: string;
  getSnapshots: () => SnapshotEntry[];
  normalizeAppState: (input: Partial<AppState>) => AppState;
  buildDiffPreview: (current: AppState, incoming: AppState, mode: DiffMode, detailLevel: "compact" | "detailed") => string;
  showDiffModal: (title: string, description: string, preview: { compact: string; detailed: string }) => Promise<boolean>;
  replaceState: (next: AppState) => void;
  saveState: () => void;
  renderAll: () => void;
  showToast: (message: string) => void;
  t: (key: string) => string;
  tf: (key: string, vars: Record<string, string | number>) => string;
}

export async function undoLastDestructiveAction(deps: UndoDeps): Promise<void> {
  const snapshots = deps.getSnapshots();
  const snapshot = snapshots.find((item) => item.savedAt === deps.selectedSnapshot) ?? snapshots[0];
  if (!snapshot) {
    deps.showToast(deps.t("backup.noSnapshot"));
    return;
  }

  const target = deps.normalizeAppState(snapshot.data);
  const preview = {
    compact: deps.buildDiffPreview(deps.state, target, "replace", "compact"),
    detailed: deps.buildDiffPreview(deps.state, target, "replace", "detailed")
  };
  const confirmed = await deps.showDiffModal(
    deps.t("backup.confirmUndoTitle"),
    deps.tf("backup.confirmUndoDesc", { reason: snapshot.reason }),
    preview
  );
  if (!confirmed) {
    deps.showToast(deps.t("backup.undoCancelled"));
    return;
  }
  deps.replaceState(target);
  deps.saveState();
  deps.renderAll();
  deps.showToast(deps.tf("backup.undoApplied", { reason: snapshot.reason }));
}
