# Postgres Cutover Checklist

Last updated: 2026-02-22

## Goal
Move from local SQLite to production Postgres with low risk and rollback options.

## Phase A: Preflight

- [ ] Confirm Firebase hosting target remains isolated (`hosting:auditSandbox`).
- [ ] Create Postgres instance and database for this app only.
- [ ] Create least-privilege DB user for this app only.
- [ ] Set strong `SESSION_SECRET` and keep it out of git.
- [ ] Capture SQLite snapshot:
  - Run `npm run db:export:sqlite`
  - Verify output in `backups/`.

## Phase B: Schema Cutover

- [x] Update `prisma/schema.prisma` datasource provider from `sqlite` to `postgresql`.
- [ ] Set `.env` `DATABASE_URL` to Postgres connection string.
- [ ] Run `pnpm prisma:generate`.
- [ ] Run `pnpm prisma:migrate:dev --name init_postgres` in local/staging.
- [ ] Run app smoke tests locally.

## Phase C: Data Migration

- [ ] Import exported SQLite JSON into Postgres (script to be added when DB is provisioned).
- [ ] Validate record counts match expected totals.
- [ ] Validate referential integrity for key relations:
  - `GeneratedText.assignmentId -> Assignment.id`
  - `RubricItem.textId -> GeneratedText.id`
  - `Annotation.textId -> GeneratedText.id`
  - `Evidence.annotationId -> Annotation.id`
  - `Score.textId -> GeneratedText.id`

## Phase D: Release

- [ ] Deploy with Postgres `DATABASE_URL` set in runtime environment.
- [ ] Run `pnpm prisma:migrate:deploy` in deployment pipeline/startup.
- [ ] Verify auth/session flows for instructor and student roles.
- [ ] Verify creation/submission/scoring flows.

## Rollback Plan

1. Keep last known-good SQLite env values.
2. If production issue appears, revert runtime `DATABASE_URL` to prior value and redeploy.
3. Restore from latest SQLite export snapshot for analysis and reconciliation.
