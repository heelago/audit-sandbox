# Decision Log

Last updated: 2026-02-24

This file records stable product decisions so future sessions do not re-open already agreed choices.

## Pedagogical Decisions

1. The platform is framed as an experiment in critical reading with AI, not as automated grading replacement.
2. Core learning goal: students must verify claims and justify their reasoning; form quality must not be mistaken for content validity.
3. Demo experience is intentionally open and guided (walkthrough-first) to reduce onboarding friction for first-time evaluators.
4. Instructor authoring supports up to 3 assignment sections to reflect real multi-part academic tasks.
5. Instructor can define expected criteria, section-specific pitfalls, and target misconceptions before generation.
6. Generation modes are pedagogically distinct:
   - `natural`: no intentional flaw injection
   - `balanced_errors`: controlled and realistic pedagogical flaws
   - `strict_truth`: strongest factual precision intent
7. Prompting policy for pedagogical flaws avoids fabricated legal cases/books/journals/citation metadata.
8. Demo environment remains mock-focused for safety and clarity unless explicitly switched.

## Architecture Decisions

1. Deployment path is Firebase App Hosting (Path A), not classic Firebase Hosting frameworks path.
2. Canonical live URL family is `*.hosted.app` for App Hosting rollouts.
3. Firebase project is `h2eapps-unified`; app backend target is `auditsandbox`.
4. Data layer is Prisma + PostgreSQL (Supabase), with explicit migration away from SQLite-only assumptions.
5. AI calls are server-side only; no model keys exposed to browser clients.
6. Generation model target: `gemini-3-flash-preview`.
7. Audit model target: `gemini-3-pro-preview`.
8. Multi-agent analysis is retained (default 4 agents) with aggregation into preliminary reports.
9. Instructor access control flow is open-beta auto-approval:
   - submit request -> auto-generate/reuse invite code + queue onboarding email immediately
   - dashboard still supports explicit resend + delivery status checks
10. Access requests + allowlist are first-class database entities (`AccessRequest`, `InstructorAccess`) with audit fields.
11. Instructor first-login onboarding is now productized inside the real instructor area (not only showcase), including welcome modal and contextual help center.
12. Instructor creation-page walkthrough is step-based and anchored to actual form sections, with optional autostart from onboarding/help.
13. Instructor creation page now also includes a persistent 4-step wizard shell (progress + jump + next/prev), layered on top of the existing form so guidance remains available even outside the timed tour.
14. Instructor creation flow now uses true staged disclosure: non-active steps are hidden, and the primary navigation is a right-side RTL "spine" to reduce cognitive load in first-time setup.
15. Wizard spine visual semantics follow redesign mapping: completed steps are Sage, active step is Amber, with a connector line and progress bar to reinforce staged flow.
16. Main stage content cards follow the same semantic progression colors as the spine, ensuring a consistent visual language between navigation and active working area.
17. Accessibility baseline for form-heavy flows uses tokenized semantic colors and responsive UI typography sizes, with explicit focus-visible rings on core controls.
18. App Hosting deploys are expected to take minutes (build + rollout), unlike static Hosting deploys; deploy UX should be improved via payload pruning and smart-skip automation, not by expecting seconds-level rollout.

## Security and Operations Decisions

1. Secrets remain in Firebase Secret Manager; no API keys in client bundle or source.
2. API middleware guardrails stay enabled (rate limits, mutating-origin checks, body-size caps).
3. Internal generation prompt structure should not be exposed to student-facing APIs.
4. Access onboarding email delivery is queued through Firebase/Firestore `mail` collection on signup (auto-approval path).
5. `ACCESS_ADMIN_CODES` remains for admin dashboard operations/support flows, not as a mandatory gate for beta signup.
6. Approval email voice/signature uses product branding (`H2eApps`) instead of internal team signature.
7. Access-request endpoint keeps layered abuse protection even if CAPTCHA is disabled (honeypot, minimum fill-time, per-IP and per-email limits).
8. reCAPTCHA is treated as optional/enhancement control and can be toggled operationally via `ACCESS_REQUEST_RECAPTCHA_DISABLED`.
9. reCAPTCHA site key is served at runtime from server env (`ACCESS_REQUEST_RECAPTCHA_SITE_KEY`) through a dedicated API route, reducing build-time env coupling.
10. Open beta currently caps non-admin instructors to 5 assignments (configurable via `BETA_ASSIGNMENT_LIMIT`).
11. Commit-aware smart deploy wrapper (`deploy:apphosting:smart`) is the default production deploy path to skip unnecessary App Hosting rollouts when no runtime-relevant changes exist.

## Confirmed Operational State (2026-02-23)

1. Trigger Email extension exists and is configured with `mail` collection in `h2eapps-unified`.
2. SMTP reconfiguration was not required for this app because existing project-level extension settings are reusable.
3. Production admin secret setup completed (`ACCESS_ADMIN_CODES`).

## Open Decisions (Explicitly Deferred)

1. When to switch demo from mock mode to live model-backed generation for external testers.
2. Final production auth posture (code-only vs Firebase Auth + allowlist hybrid).
3. Whether to add auto-email templates with branding variants per institution.
4. Whether privacy/data-sharing acceptance should be persisted per instructor in DB (auditable) instead of local browser storage.
5. Exact reCAPTCHA enforcement posture after domain allowlist stabilizes (strict required vs adaptive/optional fallback).
