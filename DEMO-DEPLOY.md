# Demo Deployment Guide

Last updated: 2026-02-22

## What this gives you

- A separate App Hosting backend: `auditsandbox-demo`
- Separate public URL:
  - `https://auditsandbox-demo--h2eapps-unified.us-central1.hosted.app`
- Demo write protection:
  - All API write operations return `403` with `Demo mode is read-only.`
  - Enabled automatically when running on a backend/service name containing `demo`

## Current status

- Backend `auditsandbox-demo` created in `h2eapps-unified` (`us-central1`).
- Secrets access granted for demo backend:
  - `DATABASE_URL`
  - `SESSION_SECRET`
- First demo rollout completed successfully.

## Deploy commands

Demo deploy:

```bash
npm run deploy:apphosting:demo
```

Demo deploy (debug):

```bash
npm run deploy:apphosting:demo:debug
```

Main backend deploy remains:

```bash
npm run deploy:apphosting
```

## Notes

- This project currently uses mocked generation/analysis (no external LLM API calls).
- Demo backend currently uses the same `DATABASE_URL` secret as main backend.

## Separate demo database (optional, later)

1. Create or choose a dedicated demo Postgres database.
2. Create a new secret (example: `DATABASE_URL_DEMO`) and paste the dedicated demo DB URL:

```bash
firebase apphosting:secrets:set DATABASE_URL_DEMO --project h2eapps-unified
```

3. Grant secret access to demo backend:

```bash
firebase apphosting:secrets:grantaccess DATABASE_URL_DEMO,SESSION_SECRET --backend auditsandbox-demo --project h2eapps-unified
```

4. Update `apphosting.demo.yaml` to map `DATABASE_URL` to `DATABASE_URL_DEMO`, then deploy:

```bash
npm run deploy:apphosting:demo
```

How it works:
- `scripts/deploy/firebase-deploy-apphosting-demo.ps1` temporarily swaps `apphosting.demo.yaml` into place for demo deploy only.
- Demo backend always reads:
  - `DEMO_READ_ONLY=1`
  - `DEMO_OPEN_LANDING=1`
- Database mapping is controlled by the secret name in `apphosting.demo.yaml`.
- Main backend remains on `apphosting.yaml`.
