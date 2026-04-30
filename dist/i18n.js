const LANGUAGE_KEY = "devtasker_language_v1";
const messages = {
    en: {
        "header.subtitle": "Developer worklog + planning assistant",
        "tab.active": "Active",
        "tab.worklog": "Worklog",
        "tab.archive": "Archive",
        "tab.weekly": "Weekly",
        "btn.help": "Help",
        "btn.applyTemplate": "Apply template",
        "btn.addTask": "Add task",
        "btn.syncNow": "Sync now",
        "btn.addSession": "Add session note",
        "btn.clearDismissed": "Clear dismissed reminders",
        "btn.exportWeekly": "Export weekly report",
        "btn.exportBackup": "Export JSON backup",
        "btn.importBackup": "Import JSON backup",
        "btn.resetAppData": "Reset app data",
        "btn.resetPreferences": "Reset preferences",
        "btn.undoLast": "Undo last destructive action",
        "btn.deleteSnapshot": "Delete selected snapshot",
        "btn.clearSnapshots": "Clear snapshot history",
        "label.nextUpByProject": "Next up by project",
        "label.dailyWorklog": "Daily worklog",
        "label.standupMode": "Standup mode",
        "label.weeklySummary": "Weekly summary",
        "label.lightAnalytics": "Light analytics",
        "label.smartReminders": "Smart reminders",
        "label.diagnostics": "Diagnostics",
        "empty.active": "No active tasks.",
        "empty.worklog": "No sessions recorded yet.",
        "empty.archive": "Archive is empty.",
        "input.templateOptional": "Template (optional)",
        "input.taskTitle": "Task title",
        "input.taskDescription": "Task description",
        "input.taskProject": "Project (e.g. DevTasker)",
        "input.archiveSearch": "Search by title/description",
        "input.durationMin": "Duration (min)",
        "input.whatDone": "What was done?",
        "input.blockedBecause": "Blocked because...",
        "input.nextStep": "Next step",
        "input.selectTask": "Select task",
        "select.importReplace": "Import mode: Replace",
        "select.importMerge": "Import mode: Merge",
        "help.title": "How to use DevTasker",
        "help.step1": "1) Active: add tasks, choose priority/project, and due date if needed.",
        "help.step2": "2) Worklog: add sessions for tasks (minutes, notes, blocker, next step).",
        "help.step3": "3) Weekly: review standup, analytics, reminders, backup/import/undo.",
        "help.step4": "4) Safety: import/undo always shows a diff preview (compact/detailed).",
        "help.step5": "5) Offline: sessions are queued and synced when network returns.",
        "help.gotIt": "Got it",
        "filter.allProjects": "All projects",
        "common.noDescription": "No description.",
        "common.duePrefix": "Due:",
        "common.noDueDate": "No due date",
        "common.unknownTask": "Unknown task",
        "common.noNotes": "No notes.",
        "worklog.blocker": "Blocker",
        "worklog.next": "Next",
        "archive.created": "Created",
        "archive.done": "Done",
        "nextup.empty": "No next-up candidates.",
        "nextup.top": "Top",
        "standup.emptyYesterday": "No completed sessions yesterday.",
        "standup.emptyToday": "No suggestions for today.",
        "standup.emptyBlockers": "No blockers.",
        "analytics.avgLeadTime": "Avg lead time",
        "analytics.worklogStreak": "Worklog streak",
        "analytics.weeklyTrend": "Weekly trend",
        "analytics.days": "days",
        "reminder.due": "Due",
        "reminder.stale": "Stale",
        "reminder.trigger": "Trigger",
        "btn.dismiss": "Dismiss",
        "btn.markDone": "Mark done",
        "btn.archive": "Archive",
        "sync.sync": "Sync",
        "sync.queue": "Queue",
        "sync.online": "online",
        "sync.offline": "offline",
        "progress.done": "done",
        "diag.schema": "Schema",
        "diag.snapshots": "Snapshots",
        "diag.queue": "Queue",
        "diag.network": "Network",
        "toast.offlineQueued": "Offline mode: sessions will be queued.",
        "toast.taskInvalid": "Task form has invalid data.",
        "toast.taskAdded": "Task added.",
        "toast.templateApplied": "Template applied.",
        "toast.selectValidTask": "Select a valid task.",
        "toast.sessionInvalid": "Session input has invalid data.",
        "toast.sessionSaved": "Session saved.",
        "toast.sessionQueued": "Offline: session queued for sync.",
        "toast.cannotSyncOffline": "Cannot sync while offline.",
        "toast.queueEmpty": "Queue is already empty.",
        "toast.preferencesReset": "Preferences reset.",
        "confirm.resetPreferences": "Reset UI preferences to default values?",
        "diff.viewDetailed": "View: Detailed",
        "diff.viewCompact": "View: Compact",
        "backup.exported": "Backup exported: {filename}",
        "backup.modeMergeNote": "Merge mode keeps existing items by id (removed count stays 0 by design).",
        "backup.modeReplaceNote": "Replace mode can remove items missing from imported backup.",
        "backup.confirmImportTitle": "Confirm import",
        "backup.confirmImportDesc": "Mode: {mode}. {note}",
        "backup.importCancelled": "Import cancelled.",
        "backup.imported": "Backup imported ({mode}).",
        "backup.invalidFile": "Invalid backup file.",
        "backup.confirmResetAppData": "This will remove all local DevTasker data. Continue?",
        "backup.appDataReset": "App data reset.",
        "backup.noSnapshot": "No snapshot available.",
        "backup.confirmUndoTitle": "Confirm undo",
        "backup.confirmUndoDesc": "Snapshot reason: {reason}. This will replace current local state.",
        "backup.undoCancelled": "Undo cancelled.",
        "backup.undoApplied": "Undo applied ({reason}).",
        "snapshot.none": "No snapshot available.",
        "snapshot.notFound": "Snapshot not found.",
        "snapshot.selectedDeleted": "Selected snapshot deleted.",
        "snapshot.noneToDelete": "No snapshots to delete.",
        "snapshot.historyEmpty": "Snapshot history already empty.",
        "snapshot.confirmClearAll": "Delete all stored snapshots?",
        "snapshot.historyCleared": "Snapshot history cleared.",
        "snapshot.latestMeta": "Latest snapshot: {reason} @ {when} - {projects} projects / {tasks} tasks / {sessions} sessions (stored: {count}/3)",
        "report.generated": "Generated: {value}",
        "report.weekStart": "Week start: {value}",
        "report.noBlockers": "No blockers",
        "report.noSuggestions": "No suggestions for today.",
        "report.exported": "Report exported: {filename}"
    },
    sr: {
        "header.subtitle": "Pomocnik za developerski worklog i planiranje",
        "tab.active": "Aktivno",
        "tab.worklog": "Worklog",
        "tab.archive": "Arhiva",
        "tab.weekly": "Nedeljno",
        "btn.help": "Uputstvo",
        "btn.applyTemplate": "Primeni template",
        "btn.addTask": "Dodaj task",
        "btn.syncNow": "Sync sada",
        "btn.addSession": "Dodaj session belesku",
        "btn.clearDismissed": "Ocisti odbacene podsetnike",
        "btn.exportWeekly": "Izvezi nedeljni izvestaj",
        "btn.exportBackup": "Izvezi JSON backup",
        "btn.importBackup": "Uvezi JSON backup",
        "btn.resetAppData": "Resetuj app podatke",
        "btn.resetPreferences": "Resetuj preference",
        "btn.undoLast": "Ponisti poslednju destruktivnu akciju",
        "btn.deleteSnapshot": "Obrisi izabrani snapshot",
        "btn.clearSnapshots": "Ocisti snapshot istoriju",
        "label.nextUpByProject": "Sledece po projektu",
        "label.dailyWorklog": "Dnevni worklog",
        "label.standupMode": "Standup mode",
        "label.weeklySummary": "Nedeljni rezime",
        "label.lightAnalytics": "Laka analitika",
        "label.smartReminders": "Pametni podsetnici",
        "label.diagnostics": "Dijagnostika",
        "empty.active": "Nema aktivnih taskova.",
        "empty.worklog": "Jos nema evidentiranih sesija.",
        "empty.archive": "Arhiva je prazna.",
        "input.templateOptional": "Template (opciono)",
        "input.taskTitle": "Naziv taska",
        "input.taskDescription": "Opis taska",
        "input.taskProject": "Projekat (npr. DevTasker)",
        "input.archiveSearch": "Pretrazi po nazivu/opisu",
        "input.durationMin": "Trajanje (min)",
        "input.whatDone": "Sta je uradjeno?",
        "input.blockedBecause": "Blokirano zbog...",
        "input.nextStep": "Sledeci korak",
        "input.selectTask": "Izaberi task",
        "select.importReplace": "Import mode: Replace",
        "select.importMerge": "Import mode: Merge",
        "help.title": "Kako koristiti DevTasker",
        "help.step1": "1) Aktivno: dodaj taskove, izaberi prioritet/projekat i rok po potrebi.",
        "help.step2": "2) Worklog: dodaj sesije po tasku (minuti, beleske, bloker, sledeci korak).",
        "help.step3": "3) Nedeljno: pregled standup-a, analitike, podsetnika, backup/import/undo.",
        "help.step4": "4) Bezbednost: import/undo uvek prikazuje diff preview (compact/detailed).",
        "help.step5": "5) Offline: sesije se redaju u queue i sync-uju kad se mreza vrati.",
        "help.gotIt": "Razumem",
        "filter.allProjects": "Svi projekti",
        "common.noDescription": "Nema opisa.",
        "common.duePrefix": "Rok:",
        "common.noDueDate": "Bez roka",
        "common.unknownTask": "Nepoznat task",
        "common.noNotes": "Nema beleski.",
        "worklog.blocker": "Bloker",
        "worklog.next": "Sledece",
        "archive.created": "Kreirano",
        "archive.done": "Zavrseno",
        "nextup.empty": "Nema predloga za sledece korake.",
        "nextup.top": "Top",
        "standup.emptyYesterday": "Nema zavrsenih sesija juce.",
        "standup.emptyToday": "Nema predloga za danas.",
        "standup.emptyBlockers": "Nema blokera.",
        "analytics.avgLeadTime": "Prosecno vreme do zavrsetka",
        "analytics.worklogStreak": "Worklog streak",
        "analytics.weeklyTrend": "Nedeljni trend",
        "analytics.days": "dana",
        "reminder.due": "Rok",
        "reminder.stale": "Zastarelo",
        "reminder.trigger": "Okidac",
        "btn.dismiss": "Odbaci",
        "btn.markDone": "Oznaci kao gotovo",
        "btn.archive": "Arhiviraj",
        "sync.sync": "Sync",
        "sync.queue": "Queue",
        "sync.online": "online",
        "sync.offline": "offline",
        "progress.done": "zavrseno",
        "diag.schema": "Schema",
        "diag.snapshots": "Snapshoti",
        "diag.queue": "Queue",
        "diag.network": "Mreza",
        "toast.offlineQueued": "Offline rezim: sesije ce biti redjane u queue.",
        "toast.taskInvalid": "Forma taska ima neispravne podatke.",
        "toast.taskAdded": "Task dodat.",
        "toast.templateApplied": "Template primenjen.",
        "toast.selectValidTask": "Izaberi validan task.",
        "toast.sessionInvalid": "Unos sesije ima neispravne podatke.",
        "toast.sessionSaved": "Sesija sacuvana.",
        "toast.sessionQueued": "Offline: sesija je dodata u queue za sync.",
        "toast.cannotSyncOffline": "Sync nije moguc dok si offline.",
        "toast.queueEmpty": "Queue je vec prazan.",
        "toast.preferencesReset": "Preference resetovane.",
        "confirm.resetPreferences": "Resetovati UI preference na podrazumevane vrednosti?",
        "diff.viewDetailed": "Prikaz: Detaljno",
        "diff.viewCompact": "Prikaz: Kompaktno",
        "backup.exported": "Backup izvezen: {filename}",
        "backup.modeMergeNote": "Merge mode zadrzava postojece stavke po id-u (removed broj ostaje 0).",
        "backup.modeReplaceNote": "Replace mode moze ukloniti stavke koje ne postoje u importovanom backup-u.",
        "backup.confirmImportTitle": "Potvrdi import",
        "backup.confirmImportDesc": "Mode: {mode}. {note}",
        "backup.importCancelled": "Import otkazan.",
        "backup.imported": "Backup importovan ({mode}).",
        "backup.invalidFile": "Neispravan backup fajl.",
        "backup.confirmResetAppData": "Ovo ce obrisati sve lokalne DevTasker podatke. Nastaviti?",
        "backup.appDataReset": "Podaci aplikacije su resetovani.",
        "backup.noSnapshot": "Nema dostupnih snapshota.",
        "backup.confirmUndoTitle": "Potvrdi undo",
        "backup.confirmUndoDesc": "Razlog snapshota: {reason}. Ovo ce zameniti trenutno lokalno stanje.",
        "backup.undoCancelled": "Undo otkazan.",
        "backup.undoApplied": "Undo primenjen ({reason}).",
        "snapshot.none": "Nema dostupnih snapshota.",
        "snapshot.notFound": "Snapshot nije pronadjen.",
        "snapshot.selectedDeleted": "Izabrani snapshot je obrisan.",
        "snapshot.noneToDelete": "Nema snapshot-a za brisanje.",
        "snapshot.historyEmpty": "Istorija snapshota je vec prazna.",
        "snapshot.confirmClearAll": "Obrisati sve sacuvane snapshot-e?",
        "snapshot.historyCleared": "Istorija snapshota je obrisana.",
        "snapshot.latestMeta": "Poslednji snapshot: {reason} @ {when} - {projects} projects / {tasks} tasks / {sessions} sessions (sacuvano: {count}/3)",
        "report.generated": "Generisano: {value}",
        "report.weekStart": "Pocetak nedelje: {value}",
        "report.noBlockers": "Nema blokera",
        "report.noSuggestions": "Nema predloga za danas.",
        "report.exported": "Izvestaj izvezen: {filename}"
    }
};
let currentLanguage = loadLanguage();
function loadLanguage() {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return saved === "sr" ? "sr" : "en";
}
export function getLanguage() {
    return currentLanguage;
}
export function setLanguage(language) {
    currentLanguage = language;
    localStorage.setItem(LANGUAGE_KEY, language);
}
export function t(key) {
    return messages[currentLanguage][key] ?? messages.en[key] ?? key;
}
export function tf(key, vars) {
    let text = t(key);
    Object.entries(vars).forEach(([name, value]) => {
        text = text.split(`{${name}}`).join(String(value));
    });
    return text;
}
function setText(selector, key) {
    const el = document.querySelector(selector);
    if (el)
        el.textContent = t(key);
}
function setPlaceholder(selector, key) {
    const el = document.querySelector(selector);
    if (el)
        el.placeholder = t(key);
}
export function applyStaticTranslations() {
    document.documentElement.lang = currentLanguage;
    setText("#helpBtn", "btn.help");
    setText(".subtitle", "header.subtitle");
    setText('[data-tab="active"]', "tab.active");
    setText('[data-tab="worklog"]', "tab.worklog");
    setText('[data-tab="archive"]', "tab.archive");
    setText('[data-tab="weekly"]', "tab.weekly");
    setText("#applyTemplateBtn", "btn.applyTemplate");
    setText("#taskForm .add-btn", "btn.addTask");
    setText("#syncNowBtn", "btn.syncNow");
    setText("#sessionForm .add-btn", "btn.addSession");
    setText("#clearDismissedRemindersBtn", "btn.clearDismissed");
    setText("#exportWeeklyReportBtn", "btn.exportWeekly");
    setText("#exportBackupBtn", "btn.exportBackup");
    setText("#importBackupBtn", "btn.importBackup");
    setText("#resetAppDataBtn", "btn.resetAppData");
    setText("#resetPreferencesBtn", "btn.resetPreferences");
    setText("#undoLastChangeBtn", "btn.undoLast");
    setText("#deleteSelectedSnapshotBtn", "btn.deleteSnapshot");
    setText("#clearSnapshotHistoryBtn", "btn.clearSnapshots");
    setText('[data-panel="active"] .section-title', "label.nextUpByProject");
    setText('[data-panel="worklog"] .section-title', "label.dailyWorklog");
    setText('[data-panel="weekly"] .section-title:nth-of-type(1)', "label.standupMode");
    setText('[data-panel="weekly"] .section-title:nth-of-type(2)', "label.weeklySummary");
    setText('[data-panel="weekly"] .section-title:nth-of-type(3)', "label.lightAnalytics");
    setText('[data-panel="weekly"] .section-title:nth-of-type(4)', "label.smartReminders");
    setText("#diagnosticsPanel h4", "label.diagnostics");
    setText("#emptyActiveState p", "empty.active");
    setText("#emptyWorklogState p", "empty.worklog");
    setText("#emptyArchiveState p", "empty.archive");
    setText('#taskTemplate option[value=""]', "input.templateOptional");
    setPlaceholder("#taskTitle", "input.taskTitle");
    setPlaceholder("#taskDescription", "input.taskDescription");
    setPlaceholder("#taskProject", "input.taskProject");
    setPlaceholder("#archiveSearch", "input.archiveSearch");
    setPlaceholder("#sessionMinutes", "input.durationMin");
    setPlaceholder("#sessionNotes", "input.whatDone");
    setPlaceholder("#sessionBlocker", "input.blockedBecause");
    setPlaceholder("#sessionNextStep", "input.nextStep");
    setText('#sessionTaskId option[value=""]', "input.selectTask");
    setText('#importModeSelect option[value="replace"]', "select.importReplace");
    setText('#importModeSelect option[value="merge"]', "select.importMerge");
    setText("#helpModalTitle", "help.title");
    setText("#helpStep1", "help.step1");
    setText("#helpStep2", "help.step2");
    setText("#helpStep3", "help.step3");
    setText("#helpStep4", "help.step4");
    setText("#helpStep5", "help.step5");
    setText("#helpModalCloseBtn", "help.gotIt");
}
