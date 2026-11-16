# Workout Tracker

At-home workout tracker (training weeks, mobility weeks, cycle phase notes). Runs in the browser and installs to the iPhone Home Screen.

## Install on iPhone
1. Open the site link in **Safari**.
2. Tap Share, then **Add to Home Screen**.

Your logs are saved on that phone. Use the **Data** tab to download a backup (JSON) and **Restore from backup** to load it on another device.

## Updating
Replace `index.html` on GitHub. Change `VERSION` in `sw.js` (for example `v1` to `v2`) so phones pick up the new copy.

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
npm run test:unit       # no emulator needed; loads index.html's script into a Node sandbox
npm test                # unit tests + Firestore rules tests
```
