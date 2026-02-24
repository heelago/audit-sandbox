# Database Setup (Plain Terms)

This app is now configured for PostgreSQL:

- `DATABASE_URL=postgresql://...`
- suitable for production hosting
- supports Prisma relational flows already used by this codebase

For production, keep Firebase Hosting/App Hosting and move the database to **PostgreSQL**.

## Firestore or Postgres?

Use **Postgres** for this codebase.

Why:

- The app uses Prisma with relational models (linked tables, joins, constraints).
- Firestore is document-based and would require a major backend rewrite.

So yes: this should be outside Firestore for now.

## Safe Migration Path

## 1) Keep local dev on Postgres

Use the same Postgres engine locally and in production to avoid environment drift.

- `.env` should point to a Postgres URL.
- Prisma schema reads `DATABASE_URL` from env.

## 2) Create a production Postgres database

Recommended in your current Google/Firebase project:

- Cloud SQL for PostgreSQL
- Create:
  - one instance
  - one database (for this app only)
  - one database user (for this app only)

You can also use an external managed Postgres (Neon/Supabase/etc.) if preferred.

## 3) Prepare production secrets

Set at least:

- `DATABASE_URL` (postgres connection string)
- `SESSION_SECRET` (long random value, 32+ chars)

Important:

- Do not commit production secrets to git.
- Do not reuse one broad service-account key across unrelated apps if avoidable.

## 4) Switch Prisma provider when ready

When you are ready to cut over from SQLite to Postgres:

1. In `prisma/schema.prisma`, change:
   - `provider = "sqlite"` to `provider = "postgresql"`
2. Point `DATABASE_URL` to your Postgres DB.
3. Run:

```bash
pnpm prisma:generate
pnpm prisma:migrate:dev --name init_postgres
```

For deployment pipeline:

```bash
pnpm prisma:migrate:deploy
```

## 5) Data migration from SQLite to Postgres

You have two choices:

- Demo reset (simple): start fresh in Postgres and reseed.
- Preserve existing test data (recommended): write a one-time migration script that reads from SQLite and inserts into Postgres in dependency order.

Before either path, create a local snapshot:

```bash
npm run db:export:sqlite
```

This writes a timestamped JSON export into `backups/`.

Suggested order:

1. `Assignment`
2. `GeneratedText`
3. `RubricItem`
4. `CalibrationLog`
5. `Annotation`
6. `Evidence`
7. `Score`
8. `RubricMatch`
9. `BeyondRubricFinding`

## 6) Verify before go-live

- Instructor login works
- Student login works
- Create assignment works
- Generate/analyze/calibrate works
- Student annotations persist
- Scoring works
- No `file:` sqlite URL in production env

## Current repo scripts

- `pnpm prisma:generate`
- `pnpm prisma:migrate:dev`
- `pnpm prisma:migrate:deploy`
- `pnpm prisma:push`
- `pnpm prisma:seed`
- `pnpm prisma:studio`
- `npm run db:export:sqlite`

For an execution checklist, see: `POSTGRES-CUTOVER-CHECKLIST.md`.
