# Firebase App Hosting (Path A)

Last updated: 2026-02-22

## Current state

- Project: `h2eapps-unified`
- Backend ID: `auditsandbox`
- Region: `us-central1`
- URL: `https://auditsandbox--h2eapps-unified.us-central1.hosted.app`

## Repo config

- `firebase.json` includes:
  - `apphosting.backendId = "auditsandbox"`
  - `apphosting.rootDir = "."`
- `apphosting.yaml` exists in repo root.

## Deploy command

Use:

```bash
npm run deploy:apphosting
```

Debug:

```bash
npm run deploy:apphosting:debug
```

## Required secrets before production use

Set secrets:

```bash
firebase apphosting:secrets:set DATABASE_URL --project h2eapps-unified
firebase apphosting:secrets:set SESSION_SECRET --project h2eapps-unified
```

Grant backend access:

```bash
firebase apphosting:secrets:grantaccess DATABASE_URL,SESSION_SECRET --backend auditsandbox --project h2eapps-unified
```

Then uncomment the `env` block in `apphosting.yaml` to bind runtime variables.

## Notes

- App Hosting local-source deploys use `firebase deploy --only apphosting`.
- This avoids the Windows Frameworks Hosting packaging issues seen in this environment.
