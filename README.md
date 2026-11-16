# Workout Tracker

At-home workout tracker (training weeks, mobility weeks, cycle phase notes). Runs in the browser and installs to the iPhone Home Screen.

## Install on iPhone
1. Open the site link in **Safari**.
2. Tap Share, then **Add to Home Screen**.

Your logs are saved on that phone. Use the **Settings** tab (cog icon) to download a backup (JSON) and **Restore from backup** to load it on another device.

## Code layout
No build step: `index.html` loads plain scripts in order, and they share one global scope.

| Path | What's in it |
| --- | --- |
| `css/base.css` | Theme colours, layout, tab bar, buttons, cards, modal |
| `css/today.css`, `css/month.css`, `css/progress.css` | Styles used only by that page |
| `js/data/` | The plan, demo video links, mobility routines, cycle phase text |
| `js/core/` | Logic with no page of its own: helpers, state, program access, storage, stats, mobility, cycle |
| `js/ui/shell.js` | Page registry, render loop, tab bar, toast, shared modals |
| `js/ui/plan-editor.js` | Edit-a-day and new-month dialogs (used from several pages) |
| `js/pages/today.js`, `month.js`, `progress.js`, `settings.js` | One file per page: its view plus its own click (`ACTIONS`), input (`INPUTS`/`CHANGES`) handlers and modals (`MODALS`) |
| `js/app.js` | Boot: load data, wire events, register the service worker |

To add a page: create `js/pages/<name>.js` that sets `PAGES.<name>={label,view}`, add its id to `TABS` in `js/ui/shell.js` and an icon to `ICON` in `js/core/state.js`, then add the `<script>` to `index.html` and the file to `SHELL` in `sw.js`.

## Updating
Push the changed files to GitHub. Change `VERSION` in `sw.js` (for example `v4` to `v5`) so phones pick up the new copy. If you add a file, also add it to `SHELL` in `sw.js`.

## Backend (Firebase: Auth + Firestore, free Spark plan)
Data is stored per user at `users/{uid}/data/{meta | log-<month>}` and cached in `localStorage` so the app still works offline. If Firebase is not configured, the app falls back to on-device storage.

### One-time setup
1. Create a project at https://console.firebase.google.com (no credit card needed).
2. **Build > Authentication > Sign-in method**: enable **Email/Password**.
3. **Build > Firestore Database**: create a database (production mode).
4. **Project settings > Your apps > Web (`</>`)**: register an app and copy the config into `firebase-config.js`.
5. Deploy the security rules: `npx firebase login && npx firebase deploy --only firestore:rules --project <your-project-id>`
6. Hosting: the app can stay on GitHub Pages. Add that domain under **Authentication > Settings > Authorized domains**.

### Local development and tests
```bash
npm install
npm run test:rules      # security-rules tests against the Firestore emulator (needs Java 11+)
npm run emulators       # Auth + Firestore + app on http://127.0.0.1:5000/?emulator=1
```

### Unit tests
```bash
npm run test:unit       # no emulator needed; loads the app's js/ files into a Node sandbox
npm test                # unit tests + Firestore rules tests
```

### End-to-end tests
```bash
npx playwright install chromium   # first time only
npm run test:e2e                  # drives the real app in a phone-sized browser
```
Tests live in `tests/e2e/`. They run in "device only" mode (Firebase and font CDNs are blocked) with a frozen clock (Wed 11 Mar 2026), so they need no network or emulator. Import `test` from `tests/e2e/fixtures.js` and use the `app` fixture. To start with past workouts or settings, use `test.use({ seed: { logs, meta } })` with the `pastSession()` helper (see the comment above it in `fixtures.js`).

Sign-in and sync tests (`tests/e2e/*.emu.spec.js`) run against the Auth and Firestore emulators (needs Java 11+):
```bash
npm run test:e2e:emulator
```
They serve the Firebase SDK from `node_modules` and open the app with `?emulator=1`; use `tests/e2e/emulator-fixtures.js`.
