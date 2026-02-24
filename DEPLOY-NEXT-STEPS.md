# Deploy Next Steps

Last updated: 2026-02-22

## Current status

- Scoped hosting target is configured correctly.
- Path A selected: App Hosting.
- App Hosting backend `auditsandbox` created in `us-central1`.
- App Hosting rollout completed successfully.
- Live URL: `https://auditsandbox--h2eapps-unified.us-central1.hosted.app`.

## Legacy blockers (Frameworks Hosting path only)

1. Windows `EPERM` symlink while packaging `.firebase/.../functions/.next/node_modules/@prisma/client-*`.
2. Firebase CLI tries `npx which esbuild` and fails with `'node-which' is not recognized`.
3. CLI then attempts `npm install esbuild --no-save`, which fails in this dependency tree.

## Active path now (Path A)

1. Deploy via App Hosting only:
   - `npm run deploy:apphosting`
2. Configure runtime secrets for `DATABASE_URL` and `SESSION_SECRET`.
3. Ensure Prisma datasource is `postgresql` (done in repo).
4. Bootstrap Postgres schema/data on first-time DB:
   - `pnpm prisma db push`
   - `pnpm prisma db seed`
5. Redeploy App Hosting after bootstrap.

## Demo path (separate backend)

1. Deploy demo backend:
   - `npm run deploy:apphosting:demo`
2. Demo URL:
   - `https://auditsandbox-demo--h2eapps-unified.us-central1.hosted.app`
3. Demo backend is read-only at API write layer.
4. Optional later: map demo backend to a dedicated DB secret and redeploy.

## Decision gate

Decision complete: `Path A` selected and backend created.
