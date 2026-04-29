# DevTasker Release Checklist

Use this checklist after push/deploy to quickly validate release health.

## Quick Smoke Test (2-3 min)

- Start
  - Open the app and hard refresh (`Ctrl+Shift+R`)
  - Confirm there are no console errors

- Active tab
  - Add one task (for example `Feature: smoke test`)
  - Verify progress shows `0/1`

- Worklog tab
  - Add one session for that task
  - Verify session appears in `Daily worklog`

- Weekly tab
  - Verify `Standup`, `Weekly summary`, `Analytics`, and `Diagnostics` render

- Backup + diff modal
  - Export JSON backup
  - Import the same backup
  - Verify colored `+ / - / ~` diff tokens and `Compact/Detailed` toggle
  - Test both `Cancel` and `Apply`

- Undo and snapshots
  - Perform a destructive change (for test state)
  - Run `Undo last destructive action`
  - Confirm state restores

- Offline queue + sync
  - Go offline, add a session, confirm queue increases
  - Go online, click `Sync now`, confirm queue returns to 0

- Preferences
  - Switch diff modal view mode
  - Refresh and verify mode persists
  - Click `Reset preferences` and verify default mode is restored

## Pre-release sanity checks

- `npm run build` passes
- No new lint issues in edited files
- App assets load without `404` (`dist/main.js`, `manifest.webmanifest`, `sw.js`)
