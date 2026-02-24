# Status Snapshot (2026-02-23)

## Completed

1. App Hosting main backend deployed and live:
   - `https://auditsandbox--h2eapps-unified.us-central1.hosted.app`
2. Postgres cutover completed for main app:
   - Prisma datasource now `postgresql`.
   - New DB bootstrapped and seeded successfully.
3. Secrets and runtime wiring fixed for main backend:
   - `DATABASE_URL`, `SESSION_SECRET`
   - App Hosting secret access grants validated.
4. Demo backend created and deployed:
   - `https://auditsandbox-demo--h2eapps-unified.us-central1.hosted.app`
5. Demo safety layer added:
   - Write endpoints are read-only in demo mode.
6. Demo UX groundwork added:
   - Quick-access landing panel with role toggles (instructor/students).
7. Deployment tooling hardened:
   - App Hosting scripts now tolerate Firebase CLI false-failure exit noise when rollout actually succeeded.
8. Static showcase route created:
   - `/showcase` includes carousel-style scenario navigation, role toggle (instructor/student), and prompt-based tag scaffolding.
9. Calibration and instructor controls hardened for demo/prototyping:
   - Per-text manual edit, regenerate, and targeted reanalysis available from calibration and instructor table.
   - Manual markers can now capture precise selected text spans.
   - Regenerate actions now require confirmation to prevent accidental overwrite.
10. Security baseline hardening shipped in app code:
   - API middleware rate limiting + origin validation + body-size guards (`middleware.ts`).
   - Student prompt privacy enforced in student APIs (internal generation prompt no longer exposed).
   - Prompt pipeline now sanitizes and wraps untrusted fields to reduce prompt-injection risk.
   - Security runbook added: `SECURITY-HARDENING.md`.
11. Safe Artifact prompt philosophy aligned with current architecture:
   - Generation strategy instructions now emphasize ToS-safe pedagogical flaw patterns (misapplied source, outdated data, empty-fluent paragraph, false universal, causal leap).
   - Balanced mode now explicitly blocks fabricated citation/case metadata behavior.
   - Instructor create flow has a one-click safe flaw template for pitfalls fields.
   - Showcase intro copy now reflects dual mode: natural text or intentional pedagogical flaws.

## Current Decision Point

Next security sprint scope:

1. Verify `h2eapps-unified` Firestore/App Hosting rules + secret bindings are server-only (no key leakage).
2. Confirm internal generation/audit prompts are not exposed to instructor/student payloads or UI.
3. Add backend schema validation + security event logging (beyond current baseline protections).
4. Define DDoS posture (WAF/rate limits/monitoring) for production path.
