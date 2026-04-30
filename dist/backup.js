export function exportBackupJson(state, showToast) {
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
export async function importBackupFromFile(deps) {
    try {
        const text = await deps.file.text();
        const raw = JSON.parse(text);
        const payload = raw;
        const candidate = payload && typeof payload === "object" && payload.data ? payload.data : raw;
        const next = deps.normalizeAppState(candidate);
        const preview = {
            compact: deps.buildDiffPreview(deps.state, next, deps.importMode, "compact"),
            detailed: deps.buildDiffPreview(deps.state, next, deps.importMode, "detailed")
        };
        const modeNote = deps.importMode === "merge"
            ? "Merge mode keeps existing items by id (removed count stays 0 by design)."
            : "Replace mode can remove items missing from imported backup.";
        const confirmed = await deps.showDiffModal("Confirm import", `Mode: ${deps.importMode}. ${modeNote}`, preview);
        if (!confirmed) {
            deps.showToast("Import cancelled.");
            return;
        }
        deps.snapshotCurrentState(`import:${deps.importMode}`);
        if (deps.importMode === "merge")
            deps.mergeState(next);
        else
            deps.replaceState(next);
        deps.saveState();
        deps.renderAll();
        deps.showToast(`Backup imported (${deps.importMode}).`);
    }
    catch {
        deps.showToast("Invalid backup file.");
    }
}
export function resetAppData(deps) {
    const confirmed = window.confirm("This will remove all local DevTasker data. Continue?");
    if (!confirmed)
        return;
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
    deps.showToast("App data reset.");
}
export async function undoLastDestructiveAction(deps) {
    const snapshots = deps.getSnapshots();
    const snapshot = snapshots.find((item) => item.savedAt === deps.selectedSnapshot) ?? snapshots[0];
    if (!snapshot) {
        deps.showToast("No snapshot available.");
        return;
    }
    const target = deps.normalizeAppState(snapshot.data);
    const preview = {
        compact: deps.buildDiffPreview(deps.state, target, "replace", "compact"),
        detailed: deps.buildDiffPreview(deps.state, target, "replace", "detailed")
    };
    const confirmed = await deps.showDiffModal("Confirm undo", `Snapshot reason: ${snapshot.reason}. This will replace current local state.`, preview);
    if (!confirmed) {
        deps.showToast("Undo cancelled.");
        return;
    }
    deps.replaceState(target);
    deps.saveState();
    deps.renderAll();
    deps.showToast(`Undo applied (${snapshot.reason}).`);
}
