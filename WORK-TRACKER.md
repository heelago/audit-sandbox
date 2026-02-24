# Work Tracker

Last updated: 2026-02-24

## Current Objective
Stabilize instructor onboarding and first-use experience (email + welcome + guided creation flow) before next backend/security phase.

## Memory Pointers
- Decision register: `DECISION-LOG.md`
- Session handoff: `HANDOFF.md`
- Incident log: `ERROR-LOG.md`

## Task Board

| ID | Task | Status | Notes |
|---|---|---|---|
| T1 | Confirm Firebase project and hosting target mapping | done | `.firebaserc` maps `auditSandbox -> h2eapps-auditsandbox` under `h2eapps-unified`. |
| T2 | Create ongoing tracker and error log in repo | done | Added `WORK-TRACKER.md` and `ERROR-LOG.md`. |
| T3 | Stabilize Windows scoped deploy workflow | done | Added `scripts/deploy/firebase-deploy-sandbox.ps1`, package scripts, and runbook updates. |
| T4 | Postgres migration groundwork | done | Added SQLite export script and `POSTGRES-CUTOVER-CHECKLIST.md`. |
| T5 | Execute first Postgres migration prep commands | done | Ran `npm run db:export:sqlite`; created `backups/sqlite-export-20260222-185205.json`. |
| T6 | Run scripted scoped deploy and capture real blocker state | done | Deploy reaches build but fails in Firebase framework packaging on Windows (`EPERM` symlink + `node-which`/esbuild chain). |
| T7 | Switch to App Hosting path and create backend | done | Backend `auditsandbox` created (`us-central1`) in `h2eapps-unified`. |
| T8 | Wire repo for App Hosting deploy | done | Added `firebase.json` `apphosting` block, `apphosting.yaml`, deploy scripts, and App Hosting runbook. |
| T9 | Validate first successful App Hosting rollout | done | Rollout completed. Live URL: `https://auditsandbox--h2eapps-unified.us-central1.hosted.app`. |
| T10 | Diagnose `/api/auth` 500 on new production DB | done | Root cause: Prisma datasource still `sqlite` while runtime secret uses Postgres; no schema/data in fresh DB. |
| T11 | Apply Postgres provider and auth error guard | done | Switched `prisma/schema.prisma` to `postgresql` and added guarded auth DB error handling. |
| T12 | Fix App Hosting runtime DB secret binding and IAM | done | Added `DATABASE_URL` env mapping in `apphosting.yaml`, granted secret access, and completed rollout. |
| T13 | Add demo read-only mode for shareable environment | done | Added centralized demo-mode guard and wired all mutating API routes. |
| T14 | Add separate demo App Hosting deploy path | done | Added `firebase.demo.json`, demo deploy script, and package scripts. |
| T15 | Create and deploy `auditsandbox-demo` backend | done | Backend created and live at `https://auditsandbox-demo--h2eapps-unified.us-central1.hosted.app`. |
| T16 | Harden deploy scripts for Firebase CLI false-failure exit codes | done | Scripts now detect successful rollout text and continue when exit code is noisy. |
| T17 | Add open demo landing quick toggles | done | Added `/api/demo/config` and one-click instructor/student access panel on `/`. |
| T18 | Add demo-specific database split capability | done | Added `DEMO_DATABASE_URL` runtime switch and `apphosting.demo.yaml` secret mapping via demo deploy script swap. |
| T19 | Build static showcase experience for stakeholder walkthroughs | done | Added `/showcase` static carousel with 3 scenarios and suggested tags from user prompts. |
| T20 | Expand showcase into full role simulation UX | done | Added instructor/student simulation flows with preloaded course prompts, criteria, and workflow panels. |
| T21 | Add student annotation workbench simulation | done | Student can select text, tag issues, add rationale, fix proposal, verification method, and evidence note (frontend-only). |
| T22 | Add instructor controls simulation | done | Added criteria selection, demo agent run controls, issue weight sliders, and manual follow-up tagging flow. |
| T23 | Reveal pre-audited findings after demo run | done | `Run Demo Agents` now reveals expected student findings and highlights corresponding text spans in model response. |
| T24 | Add guided walkthrough with visual focus | done | Added 60-second guided tour with step navigation, auto-scroll, role switching, focused highlight, and floating tooltip. |
| T25 | Localize showcase UX copy and improve first-run onboarding | done | Localized visible copy to Hebrew, added first-visit auto-tour, value proposition strip, and quick jump demo buttons. |
| T26 | Localize remaining login/showcase entry copy | done | Replaced remaining English strings on `/` showcase/login entry with Hebrew. |
| T27 | Add server-side Gemini orchestration layer | done | Added `src/lib/ai/gemini.ts` with secure API integration, model config, generation helper, agent templates, and multi-agent aggregation. |
| T28 | Refactor text generation API to Gemini-first with safe fallback | done | Updated `/api/assignments/[id]/generate` to support Gemini generation, pilot-stage batching, incremental code generation, and explicit error handling. |
| T29 | Refactor analysis API to multi-agent Gemini flow | done | Updated `/api/assignments/[id]/analyze` to support custom agents, force reanalysis, aggregation logging, and mock fallback when needed. |
| T30 | Wire runtime env placeholders for Gemini in hosting configs | done | Updated `.env.example`, `apphosting.yaml`, and `apphosting.demo.yaml` (demo pinned to `USE_MOCK_AI=1`). |
| T31 | Set assignment model version from configured generation model | done | `/api/assignments` POST now stores `modelVersion` from Gemini generation model config. |
| T32 | Add Gemini setup runbook for secrets and local env | done | Added `GEMINI-SETUP.md` with exact PowerShell commands and placeholder notes. |
| T33 | Enforce strict Gemini behavior in analysis path | done | Removed silent mock fallback when Gemini mode is enabled; route now returns clear 502 with details if no findings are produced. |
| T34 | Add instructor import/upload flow for existing generated texts | done | Added `/api/assignments/[id]/import-texts` + instructor UI upload/paste panel with anonymization pass and assignment status update to `analyzing`. |
| T35 | Persist assignment roster in DB and remove generate placeholders | done | Added `Assignment.plannedStudentCount/plannedStudentCodes`, new roster helper, generate/import routes now sync roster from DB, and instructor page now uses pilot/full generation based on stored roster. |
| T36 | Introduce structured agent analysis report tables + read API | done | Added `AgentAnalysisReport` / `AgentAnalysisAgentRun` / `AgentAnalysisFinding`, writes from analyze route, new `GET /api/assignments/[id]/analysis-reports`, and instructor preview card. |
| T37 | Remove single-assignment-per-instructor DB constraint | done | `Assignment.instructorCode` is no longer unique; added index and removed obsolete API conflict handling. |
| T38 | Add editable instructor generation spec + strategy-driven AI prompts | done | Instructor can edit prompt/context/criteria/exemplars/section blueprint on assignment page; Gemini generation+analysis now consume these fields and generation strategy (`natural`, `balanced_errors`, `strict_truth`). |
| T39 | Expose per-text generation source on instructor page | done | Text table now shows source (`Gemini` / `דמו` / `ייבוא`) parsed from `generationMeta`; generation success toast shows returned `generationMode`. |
| T40 | Add create-page prompt editor toggle + reusable templates | done | Instructor create flow now includes `Edit Prompt` toggle, local template save/load/delete, and quick prompt summary while collapsed. |
| T41 | Add template export/import JSON in create flow | done | Added one-click export and file-based import with merge-by-template-name, preserving local template library across sessions/devices. |
| T42 | Enforce Gemini-required generation to avoid silent mock fallback | done | `/api/assignments/[id]/generate` now accepts `requireGemini` (default true) and returns 503 with clear config reason if Gemini is unavailable. |
| T43 | Add guided question-based prompt builder for lecturers | done | Create flow now asks for task, criteria, sections, obstacles, sources, and word limit, then auto-builds structured behind-the-scenes prompt and maps fields. |
| T44 | Improve analyze resiliency when Gemini returns empty findings | done | Added rescue pass in Gemini analyzer and non-blocking manual-review placeholder fallback in analyze API to prevent long-run 502 empty-result failures. |
| T45 | Add assignment activity logging UX with wait-state animation | done | Instructor assignment page now shows live activity timeline and animated in-progress status for generation and analysis actions. |
| T46 | Add calibration controls for precise manual markers, text edit, regenerate, targeted reanalysis | done | Added selection-based `flag_new`, `PATCH /api/texts/[id]`, `POST /api/texts/[id]/regenerate`, and upgraded calibration page UX with per-text controls. |
| T47 | Add per-text row actions on instructor assignment table | done | Added inline row actions: `Edit`, `Regenerate`, `Reanalyze`, and quick `Calibration` navigation with inline editor. |
| T48 | Add regenerate safety confirmation dialogs | done | Added confirm dialogs before regenerate on both assignment table and calibration page to prevent accidental overwrite/reset. |
| T49 | Add API security middleware baseline | done | Added `middleware.ts` for per-IP rate limits, mutating-origin validation, and request body size limits on `/api/*`. |
| T50 | Prevent student exposure of internal generation prompts | done | Student assignment/text APIs now return public-facing prompt text from requirements/title only. |
| T51 | Harden LLM prompt builder against prompt injection patterns | done | Assignment/text fields now pass through sanitized untrusted-data blocks in prompt templates; custom agent fields are sanitized and length-capped. |
| T52 | Add security hardening runbook | done | Added `SECURITY-HARDENING.md` with implemented controls and `h2eapps-unified` manual verification checklist. |
| T53 | Add local security smoke-check script | done | Added `scripts/security/check-local-security.ps1` + `pnpm run security:check:local` for quick pre-deploy scans. |
| T54 | Align generation architecture to Safe Artifact prompt philosophy | done | Updated generation prompt strategy/rules, added safe flaw quick-fill template in instructor create flow, and aligned showcase intro copy to dual-mode narrative. |
| T55 | Improve showcase pedagogy UX and professor preview fidelity | done | Replaced always-on pedagogy block with click-to-open modal, removed sticky walkthrough behavior, and added richer mock professor dashboard + calibration question preview. |
| T56 | Add explicit professor assignment-generation flow to showcase walkthrough | done | Added in-panel instructor generator demo with up-to-3 sections, per-section embedded flaw planning, generation mode toggle, preview run versioning, and walkthrough target integration. |
| T57 | Deploy updated showcase to live demo backend | blocked | Local deploy attempt hit expired Firebase auth in non-interactive agent shell (`E-024`). Pending user reauth in local PowerShell and rerun deploy script. |
| T58 | Build lecturer access-request intake + allowlist code issuance | done | Added public request form (`/`), request APIs, admin review/approve flow in instructor dashboard, and secure invite-code generation. |
| T59 | Allow approved invite codes to login as instructor | done | Auth route now accepts active `InstructorAccess` codes and records `lastLoginAt`. |
| T60 | Add post-approval onboarding email delivery via Firebase | done | Approval now creates code and queues onboarding mail automatically; dashboard keeps manual resend + status checks via Firebase (`mail` collection). |
| T61 | Record key pedagogical + architectural decisions in persistent memory | done | Added `DECISION-LOG.md` and linked it from tracker/handoff for continuity across sessions. |
| T62 | Validate extension reuse and admin-secret setup in production | done | Confirmed Trigger Email extension was already configured (`mail` collection) and `ACCESS_ADMIN_CODES` setup completed. |
| T63 | Upgrade approval onboarding email copy and branding | done | Updated onboarding approval email text/HTML tone and signature to `H2eApps` in `src/lib/onboarding-email.ts`. |
| T64 | Add first-login instructor onboarding experience | done | Added global onboarding/welcome/help hub with privacy section in `src/components/onboarding/InstructorOnboardingHub.tsx` and mounted via `src/app/instructor/layout.tsx`. |
| T65 | Add instructor help center modal with Hebrew RTL guidance | done | Added quick-start + FAQ + privacy/data-sharing tabs and CTA into create-flow tour from help modal. |
| T66 | Add real create-page walkthrough (non-showcase) | done | Added step-by-step guided tour, section highlights, and autostart handoff (`?tour=1` / localStorage) in `src/app/instructor/create/page.tsx`. |
| T67 | Add inline field tooltips to prompt builder/editor | done | Added reusable `helpTooltip` support to `Input`/`Textarea` and wired Hebrew guidance hints across instructor create form fields. |
| T68 | Harden access-request form against bot abuse | done | Added honeypot + minimum fill-time checks + per-email rate limit + optional reCAPTCHA verification for `/api/access-requests`; wired hidden trap and token/timestamp payload in landing form. |
| T69 | Clarify lecturer-side showcase flow and landing philosophy modal | done | Added explicit lecturer process panel in showcase and a front-page modal describing pedagogy + post-login lecturer flow. |
| T70 | Stabilize access request flow after reCAPTCHA domain failure | done | Added runtime site-key endpoint, fixed malformed `apphosting.yaml`, and introduced `ACCESS_REQUEST_RECAPTCHA_DISABLED=1` toggle so registration stays functional while domain allowlist is pending. |
| T71 | Add staged wizard shell for real lecturer create flow | done | `src/app/instructor/create/page.tsx` now includes 4-step creation path, progress chips, next/prev controls, auto-focus/scroll, and section highlighting aligned to existing form targets. |
| T72 | Convert create flow to true staged layout + puzzle spine | done | `src/app/instructor/create/page.tsx` now renders only active-stage content (Basics/Builder/Prompt/Final) and adds sticky right-side RTL step spine with direct jump + progress states. |
| T73 | Apply redesign semantic styling to wizard spine | done | Right-side spine now uses Sage/Amber semantic states (`done/active`), vertical connector line, step nodes, and progress bar aligned to redesign guidance. |
| T74 | Apply semantic stage styling to content cards | done | Stage content sections now mirror spine semantics: active Amber, done Sage, pending neutral, with explicit stage headers (שלב X מתוך 4) to improve orientation. |
| T75 | Accessibility token pass for contrast + mobile typography | done | Added semantic color tokens + UI text-size tokens in `src/styles/tokens.css`, updated `Input`/`Textarea`/`Button` components for stronger readable defaults and focus ring, and migrated create-page step semantics to tokenized colors. |
| T76 | Create targeted manual QA checklist for wizard UX | done | Added `QA-CHECKLIST-CREATE-WIZARD-2026-02-24.md` with desktop/mobile/focus checks, pass criteria, and known tooling blockers (`lint`, local `build` EPERM). |
| T77 | Switch lecturer registration to auto-approved beta access | done | `/api/access-requests` now auto-approves, issues/reuses instructor code immediately, queues onboarding email immediately, and logs request as `approved` with `AUTO_BETA`. |
| T78 | Beta framing and assignment cap messaging | done | Updated registration form + onboarding email with beta framing, feedback request, stable-contact email (`contact@h2eapps.com`), and implemented backend assignment cap (default 5) in `/api/assignments`. |
| T79 | Audit Claude refactor and close functional regressions | done | Fixed create-flow validation looseness, restored section-level criteria/pitfall editing, synced tour behavior text/flow, and improved student-code generation scalability in assignment create API. |
| T80 | Make lint check reliable for current Next.js setup | done | `lint` script now runs `tsc --noEmit` to provide stable local CI signal. |
| T81 | Prune App Hosting deploy payload (prod+demo alignment) | done | Synced `firebase.demo.json` ignore rules with prod baseline and added excludes for `prisma/dev.db`, `prisma/dev.db-journal`, `*.pdf` across deploy ignore files. |
| T82 | Add commit-aware smart App Hosting deploy wrapper | done | Added `scripts/deploy/firebase-deploy-apphosting-smart.ps1` + package scripts; supports skip-on-no-runtime-change, `-DryRun`, and `-Force`. |
| T83 | Seed smart deploy state with first successful live rollout | done | Ran `deploy:apphosting:smart`; rollout complete at `2625ed6`; state file seeded and re-run correctly skips. |
| T84 | Sage color migration + Frank Ruhl Libre typography | in-progress | `tokens.css`: accent→#85A88B, info→sage, focus-ring→sage, font-display→Frank Ruhl Libre. `tokens.ts` synced. `globals.css` added font import + sage selection color. Onboarding hub CSS migrated from blue to sage. |
| T85 | Create wizard "dating app" sub-step flow | done | Replaced 4-step wizard with 11 sub-step conversational flow. New components: WizardStepCard, DisciplinePresetGrid, StrategyCards. Hidden prompt with auto-build on submit. Advanced toggle for power users. |

## Next Actions
1. Commit sage color migration files (`tokens.css`, `tokens.ts`, `globals.css`) and deploy.
2. Execute the manual checklist in `QA-CHECKLIST-CREATE-WIZARD-2026-02-24.md` and capture any remaining UI regressions.
3. Validate end-to-end auto-registration flow in production: submit form -> receive code email -> login works without admin action.
4. Confirm the beta cap UX in create-flow messaging and API error handling under both default and env override (`BETA_ASSIGNMENT_LIMIT`).
5. Re-test `pnpm run build` in a clean local shell to confirm whether `spawn EPERM` is environmental.
