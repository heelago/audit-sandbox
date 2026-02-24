# Firebase Deploy Notes (Isolated)

This repo is configured to use Firebase project `h2eapps-unified` with an **isolated hosting target** named `auditSandbox`.

## Why this is safe

- Deploys run with `--only hosting:auditSandbox`.
- That means this app deploys only to the dedicated target for this repo.
- It does not touch any other hosting target unless you run a broader deploy command.

## One-time setup in your Firebase project

1. Create a new Hosting site in Firebase Console (same project):  
   pick a unique site id, for example: `h2eapps-audit-sandbox`.
2. Map that site to this repo's target:

```bash
firebase target:apply hosting auditSandbox YOUR_SITE_ID
```

3. Confirm mapping was written into `.firebaserc`.

## Deploy command for this repo

```bash
firebase deploy --only hosting:auditSandbox
```

or:

```bash
npm run deploy:firebase
```

Recommended on Windows:

```bash
npm run deploy:firebase:sandbox
```

Debug mode:

```bash
npm run deploy:firebase:sandbox:debug
```

## Windows execution notes

- Run deploy from a normal PowerShell terminal (not restricted sandbox shells).
- If you hit symlink permission errors during framework packaging, enable Windows Developer Mode or run PowerShell as Administrator.
- Keep `next.config.mjs` in repo root. Firebase framework detection can fail with `next.config.ts`.

## Known blockers seen in this repo

1. `Unable to detect the web framework in use`
Cause: unsupported Next config filename for Firebase detection.
Fix: use `next.config.mjs`.

2. `EPERM` under `.config` / configstore writes
Cause: restricted profile permissions.
Fix: run deploy in normal shell and keep CLI authenticated.

3. `EPERM` symlink while packaging `.firebase/.../functions/.next/node_modules`
Cause: Windows symlink policy/permissions.
Fix: Developer Mode or elevated PowerShell.

4. `'node-which' is not recognized` during esbuild lookup
Cause: Firebase CLI packaging path lookup issue in this environment.
Status: if this recurs, pin firebase-tools version and/or use App Hosting fallback.

## Important constraints for this codebase

- Current backend uses local SQLite (`prisma/dev.db`), which is not production-safe for shared hosted runtime.
- Hosting this app publicly should be treated as demo-only until DB is moved to managed infrastructure.
