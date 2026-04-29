# DevTasker

DevTasker is a browser-first developer task and worklog app. It combines task planning, session logging, standup summaries, reminders, backups, and safe destructive actions (snapshots + undo) in one lightweight PWA-style frontend.

## Core Features

- **Task + session workflow**: tasks with priority/status/project metadata and session notes with blockers/next steps.
- **Daily worklog + archive**: timeline by day, done archive, search/filter by project/text.
- **Standup + analytics**: yesterday/today/blockers, lead-time average, streak, weekly trend.
- **Offline queue + sync**: session entries are queued while offline and synced when online.
- **Backup and restore**: export/import JSON backups in `replace` or `merge` mode.
- **Snapshot safety**: destructive actions create snapshots; undo supports snapshot selection.
- **Diff preview modal**: import/undo shows compact or detailed change preview with colored add/remove/update counts.

## Data Safety Model

- **State storage**: persisted in `localStorage` under `devtasker_state_v2`.
- **Snapshot storage**: up to 3 snapshots under `devtasker_last_snapshot_v1`.
- **Schema-aware load/save**: persisted envelope includes `schemaVersion`.
- **Normalization and validation**: imported/loaded data is sanitized before it reaches runtime state.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Markup | HTML5 |
| Styles | CSS3 |
| Logic | TypeScript (compiled to `dist/main.js`) |

Fonts: [Outfit](https://fonts.google.com/specimen/Outfit) via Google Fonts.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build TypeScript:

   ```bash
   npm run build
   ```

3. Open `index.html` in a browser (or use any static server).

## Manual QA Checklist

- **Import replace**
  - import a backup in `replace` mode
  - verify diff modal shows potential removals
  - confirm state matches imported payload
- **Import merge**
  - import a backup in `merge` mode
  - verify diff modal message explains `removed = 0` by design
  - confirm existing records stay, incoming ids overwrite/extend
- **Undo**
  - trigger destructive action (reset/import)
  - select different snapshot in history and undo
  - verify expected restore and counts
- **Offline sync**
  - go offline, add session, confirm queue increments
  - go online, confirm queued sessions flush
- **Preferences**
  - switch diff modal between compact/detailed
  - refresh page and verify mode persists
  - reset preferences and verify default mode is restored

## License

This project is licensed under the [MIT License](LICENSE).
