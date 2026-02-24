# AI Audit Sandbox â€” Implementation Handoff

> **Status:** MVP + demo showcase live; Gemini-backed generation/analysis integrated with mock-safe fallback paths
> **Codebase:** `C:\Users\heela\Downloads\auditsandbox`
> **Stack:** Next.js 16 (App Router + Turbopack), TypeScript, Prisma 6, PostgreSQL (Supabase), CSS Modules, pnpm
> **Language:** Hebrew RTL (`dir="rtl"` on root `<html>`)

---

## Latest Session Update (2026-02-24)

- Instructor create flow UX upgrade (real app, not showcase):
  - Added a 4-step wizard shell in `src/app/instructor/create/page.tsx`:
    - Step chips (`1. פתיחה`, `2. בניית המטלה`, `3. טיוב פרומפט`, `4. יצירה`)
    - progress counter, previous/next controls, and direct step jump buttons
    - per-step auto-focus/scroll to existing section targets
    - active-step highlight integrated with existing tour highlights
  - Existing generation, presets, templates, and guided-builder logic remain unchanged; this is a UX-layer enhancement for navigability and reduced cognitive load.
  - Validation: `pnpm.cmd exec tsc --noEmit` passed after the change.
- Follow-up UX refinement:
  - Converted the same create flow into a true staged experience:
    - non-active sections are hidden (by wizard step)
    - Step 2 focuses on guided pedagogical builder
    - Step 3 focuses on prompt/template refinement and advanced fields
    - Step 4 focuses on student count + final creation
  - Added RTL-friendly sticky right-side "spine" panel (desktop) with step status, progress, and jump controls.
  - Added responsive fallback so the spine moves above content on narrow screens.
- Visual semantics pass (redesign alignment):
  - Restyled the spine to use semantic states:
    - `done` -> Sage
    - `active` -> Amber
    - `pending` -> neutral
  - Added vertical connector line + node markers and a compact progress bar in the spine panel.
- Stage card semantics alignment:
  - Applied the same semantic state palette to the main stage content cards:
    - Step card `done` -> Sage surface
    - Step card `active` -> Amber surface + subtle focus ring
    - Step card `pending` -> neutral card
  - Added stage headers in each visible step area (`שלב X מתוך 4`) for clearer orientation during creation.
- Accessibility polish (contrast + typography tokens):
  - Added shared semantic tokens in `src/styles/tokens.css` (`--sage-*`, `--amber-*`, `--neutral-*`) plus UI sizing tokens (`--ui-label-size`, `--ui-input-size`, `--ui-button-size`) with mobile overrides.
  - Updated `src/components/ui/Input.module.css`, `src/components/ui/Textarea.module.css`, and `src/components/ui/Button.module.css`:
    - stronger default text sizing/weight
    - improved focus-visible ring
    - improved tap target sizing on buttons
  - Updated `src/app/instructor/create/page.tsx` to consume semantic tokens instead of hardcoded state colors.
- QA handoff artifact:
  - Added `QA-CHECKLIST-CREATE-WIZARD-2026-02-24.md` with targeted desktop/mobile/focus validation steps and pass criteria.
  - Automated check snapshot:
    - `pnpm.cmd exec tsc --noEmit`: pass
    - `pnpm.cmd run lint`: blocked by `next lint` script incompatibility on current Next.js 16 setup
    - `pnpm.cmd run build`: compile succeeded, then exited with local `spawn EPERM` (environment/process issue)

### Claude Browser QA Handoff (2026-02-24)

Objective for Claude:
- Run browser-based QA on the real instructor create flow (`/instructor/create`) after the staged wizard + accessibility redesign work.

What changed (must be validated in UI):
1. 4-step staged wizard is now real (non-active stages hidden):
   - Step 1: Basics (title)
   - Step 2: Guided pedagogical builder
   - Step 3: Prompt/template refinement
   - Step 4: Final creation (student count + submit)
2. Right-side RTL sticky "spine" on desktop:
   - semantic states: done=Sage, active=Amber, pending=Neutral
   - connector line + step nodes + progress bar
3. Stage content cards now follow same semantic states as spine.
4. Accessibility/typography token pass:
   - stronger contrast semantic tokens
   - responsive UI font size tokens (mobile bump)
   - visible focus rings for input/textarea/button
   - improved button touch targets

Primary files touched:
- `src/app/instructor/create/page.tsx`
- `src/styles/tokens.css`
- `src/components/ui/Input.module.css`
- `src/components/ui/Textarea.module.css`
- `src/components/ui/Button.module.css`
- `QA-CHECKLIST-CREATE-WIZARD-2026-02-24.md`

How Claude should evaluate:
1. Follow `QA-CHECKLIST-CREATE-WIZARD-2026-02-24.md` exactly.
2. Validate desktop + mobile widths (390/430/768) and keyboard focus flow.
3. Report only concrete findings first (severity ordered), each with:
   - screen/path
   - reproduction steps
   - expected vs actual
   - screenshot reference if possible
4. If no issues found, explicitly state "No findings" and list any residual risks.

Known local tooling caveats (not product UX bugs):
- `pnpm run lint` currently fails due script compatibility (`next lint` behavior in this setup).
- `pnpm run build` compiles but can end with local `spawn EPERM`.

- Showcase + onboarding clarity improvements:
  - Added explicit lecturer-process explainer panel in `src/app/showcase/page.tsx` (step flow, statuses, and jump-to-section controls).
  - Added landing-page pedagogy modal in `src/app/page.tsx` explaining philosophy, teaching goals, and what lecturers do post-login.
- Access-request security hardening + operational rollback path:
  - Added bot-resistance layers to `/api/access-requests`: honeypot trap, minimum fill-time check, per-email limiter, optional reCAPTCHA verification.
  - Added runtime site-key endpoint: `src/app/api/access-requests/site-key/route.ts`.
  - Added temporary disable switch (`ACCESS_REQUEST_RECAPTCHA_DISABLED`) so registrations continue while reCAPTCHA domain allowlist is fixed.
- Deployment blocker found and fixed:
  - App Hosting build failed with `invalid apphosting.yaml`; root cause was malformed trailing secret block.
  - Replaced `apphosting.yaml` and `apphosting.demo.yaml` with valid configurations and preserved current safe mode (`ACCESS_REQUEST_RECAPTCHA_DISABLED=1`).
- Current expected state:
  - Registration flow works without CAPTCHA challenge while all other anti-bot controls remain active.
  - ReCAPTCHA can be re-enabled by domain allowlist + flipping env toggle.

- Decision and memory hygiene:
  - Added stable decision register: `DECISION-LOG.md` (pedagogical + architecture + security + deferred decisions).
  - Added cross-links in `WORK-TRACKER.md` so future sessions start from decision context, not only task context.
- Production onboarding email readiness confirmed:
  - Existing Firebase Trigger Email extension in `h2eapps-unified` is reused (no SMTP reconfiguration required for this app).
  - Confirmed extension collection path alignment: `mail`.
  - Confirmed manual admin-secret setup completed for approval authority: `ACCESS_ADMIN_CODES`.
  - Operational policy now:
    1) approve request -> create code + queue onboarding email automatically
    2) optional manual resend/status check remains available in dashboard
- Onboarding UX upgrade (in real instructor app):
  - Added global instructor onboarding hub with first-login welcome screen + floating help center:
    - `src/components/onboarding/InstructorOnboardingHub.tsx`
    - `src/components/onboarding/InstructorOnboardingHub.module.css`
    - mounted in `src/app/instructor/layout.tsx`
  - Welcome flow now includes Hebrew RTL privacy/data-sharing summary + explicit acceptance checkbox (browser-local persistence for now).
  - Help center tabs: quick-start, FAQ, privacy/data-sharing; includes CTA to open create-page tour directly.
- Instructor create-page walkthrough (non-showcase):
  - Added step-by-step guided tour in `src/app/instructor/create/page.tsx`, with section highlighting and auto-scroll.
  - Tour can auto-start from onboarding/help via localStorage handoff (`h2eapps.instructor.create-tour.autostart.v1`) and `?tour=1`.
  - Rewrote guided-builder Hebrew copy and cleaned prior encoding artifacts in user-facing create flow labels/messages.
- Approval email quality and branding refresh:
  - Updated onboarding approval email wording + HTML layout and signature to `H2eApps` in `src/lib/onboarding-email.ts`.

- Security hardening pass completed (baseline):
  - Added global API middleware guardrails (`middleware.ts`):
    - per-IP rate limiting by route class (auth, AI-heavy, mutate, read)
    - origin validation for mutating methods
    - request body size limit (2MB)
  - Added shared input/prompt sanitation helpers (`src/lib/security.ts`).
  - Hardened prompt templates against injection-like payloads:
    - all assignment/text inputs wrapped as untrusted prompt blocks
    - explicit model instruction to ignore embedded instructions in untrusted fields
    - updated in `src/lib/ai/prompt-config.ts`
  - Sanitized custom audit agent templates in `src/lib/ai/gemini.ts`.
  - Student prompt privacy:
    - student APIs no longer expose internal generation prompt internals
    - student receives public-facing assignment prompt derived from requirements/title
    - updated in `src/app/api/assignments/[id]/route.ts` and `src/app/api/texts/[id]/route.ts`
- Added security verification runbook:
  - `SECURITY-HARDENING.md` (includes manual checks for `h2eapps-unified` Firestore/Secret Manager/App Hosting).
- Added local security smoke-check command:
  - `pnpm.cmd run security:check:local`
- Applied "Safe Artifact" generation alignment:
  - Updated generation strategy language in `src/lib/ai/prompt-config.ts` to favor ToS-safe pedagogical flaws for `balanced_errors`.
  - Added explicit prohibition on fabricated legal cases/books/journals/citation metadata in balanced generation mode.
  - Added quick-fill safe flaw template button in `src/app/instructor/create/page.tsx` to populate structured pitfalls.
  - Aligned showcase intro narrative in `src/lib/showcase-intro.ts` to present dual modes: natural text or intentional pedagogical flaws.
- Showcase UX refinement for clarity:
  - Replaced inline long pedagogy block with click-to-open modal in `src/app/showcase/page.tsx`.
  - Added rich in-panel instructor generation flow demo with up-to-3 question planning, per-section flaw targets, generation mode toggle, and preview run controls in `src/app/showcase/page.tsx`.
  - Removed sticky walkthrough panel behavior to reduce distraction while scrolling (`src/app/showcase/showcase.module.css`).
- Access control expansion for real lecturer testing:
  - Added public lecturer request intake endpoint + admin list endpoint: `src/app/api/access-requests/route.ts`.
  - Added admin approve/reject endpoint with secure invite-code generation: `src/app/api/access-requests/[id]/route.ts`.
  - Added request form on login page (`src/app/page.tsx`) so lecturers can submit details without exposing personal email.
  - Added admin processing panel in instructor dashboard (`src/app/instructor/page.tsx`) with approve/reject actions and code copy-on-approve.
  - Added allowlist-backed instructor login support in auth route (`src/app/api/auth/route.ts`) via new Prisma model `InstructorAccess`.
  - Added admin-code helper (`src/lib/admin-access.ts`) using `ACCESS_ADMIN_CODES` env for approval permissions.
- Onboarding email delivery (post-approval):
  - Added Firebase-backed email queue helper (`src/lib/firebase-admin.ts`, `src/lib/onboarding-email.ts`).
  - Approve action now queues onboarding email automatically in `src/app/api/access-requests/[id]/route.ts`.
  - Extended access-review API action set with `send_email` and `refresh_email_status` for resend/status checks.
  - Added per-request email delivery tracking fields on `AccessRequest` in `prisma/schema.prisma` (`inviteEmailStatus`, attempted/sent timestamps, provider message id, last error).
  - Updated instructor admin panel (`src/app/instructor/page.tsx`) so approval creates code + queues mail, while resend remains available.
  - Added setup runbook: `ACCESS-EMAIL-SETUP.md`.

- Added calibration-stage control features for instructors:
  - Selection-based manual markers (`flag_new`) with saved span and snippet.
  - Manual text editing before release (`PATCH /api/texts/[id]`), with analysis reset safety.
  - Per-text regenerate endpoint (`POST /api/texts/[id]/regenerate`) with status guards.
  - Per-text targeted reanalysis from UI (`textIds + forceReanalyze`).
- Expanded instructor assignment table actions:
  - Row-level `Edit`, `Regenerate`, `Reanalyze`, and quick `Calibration` actions.
  - Inline text editor per row to avoid navigation friction.
- Added safety confirmation dialogs before regenerate actions on both:
  - Assignment table row actions.
  - Calibration page per-text actions.
- Validation completed:
  - `pnpm.cmd exec tsc --noEmit` passed after changes.

- Added richer instructor-controlled assignment spec fields end-to-end:
  - `referenceMaterial`
  - `sectionBlueprint`
  - `evaluationCriteria`
  - `exemplarNotes`
  - `generationStrategy` (`natural` | `balanced_errors` | `strict_truth`)
- Added assignment-level edit UI so lecturer can update prompt and all above fields directly from assignment detail.
- Gemini generation prompt now consumes these fields and strategy, so generated texts reflect pedagogical constraints.
- Gemini multi-agent audit prompt now also consumes these fields for criteria-aware findings.
- Instructor text table now shows generation source per text (`Gemini` / `דמו` / `ייבוא`) using `generationMeta`.
- Generation feedback message now includes backend `generationMode` for immediate fallback visibility.
- Type errors after schema extension were resolved by regenerating Prisma client (`pnpm.cmd prisma generate`).

---

## What This Is

An academic assessment platform where **students audit AI-generated text**. The instructor provides a prompt, the system generates essay variations (currently mocked), analyzes them for issues, and creates a rubric. Students then read the AI-generated text and annotate it â€” marking errors, verifying claims, noting gaps, suggesting alternatives. Their annotations are scored against the rubric using a 3-tier scoring engine.

### 6-Layer Pipeline

```
1. GENERATE  â†’ Instructor creates assignment, system generates text variations (mock)
2. ANALYZE   â†’ System identifies issues and builds rubric items (mock)
3. CALIBRATE â†’ Instructor reviews rubric: confirm, dismiss, or add findings
4. AUDIT     â†’ Students read text, create annotations, attach evidence
5. SCORE     â†’ System matches annotations to rubric, calculates 3-tier score
6. REVIEW    â†’ Instructor reviews submissions, can override scores, release grades
```

---

## Quick Start

```bash
cd C:\Users\heela\Downloads\auditsandbox
pnpm dev          # starts at localhost:3000
```

No `.env` changes needed â€” SQLite database is local at `prisma/dev.db`.

### Demo Login Codes

| Code | Role | Notes |
|------|------|-------|
| `PROF01` | Instructor | Full access to dashboard, calibration, submissions |
| `STU001` | Student (×“× ×” ×œ×•×™) | Only works after assignment is released (status = `active`) |
| `STU002` | Student (×™×•×¡×™ ×›×”×Ÿ) | Same â€” must release from instructor calibration first |
| `STU003` | Student (×ž×™×¨×‘ ××‘×¨×”×) | Same |

### Demo Flow
1. Login as `PROF01` â†’ instructor dashboard
2. Click the assignment â†’ calibrate â†’ confirm/dismiss rubric items â†’ "Release to students"
3. Logout (or open incognito), enter `STU001` â†’ student landing â†’ "Begin audit"
4. Select text passages, tag annotation type, write analysis, attach evidence
5. Click "Generate Report" â†’ summary view, auto-submits
6. Back as `PROF01` â†’ submissions â†’ "Score All" â†’ click student â†’ review 3-tier breakdown â†’ release grade

---

## Directory Structure

```
auditsandbox/
â”œâ”€â”€ prisma/
â”‚   â”œâ”€â”€ schema.prisma          # 9 models (see Database section)
â”‚   â”œâ”€â”€ seed.ts                # Seeds 1 assignment, 3 texts, 10 rubric items
â”‚   â””â”€â”€ dev.db                 # SQLite database file
â”‚
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ layout.tsx         # Root layout: <html lang="he" dir="rtl">, Heebo font
â”‚   â”‚   â”œâ”€â”€ page.tsx           # Login page (code entry)
â”‚   â”‚   â”œâ”€â”€ globals.css        # CSS reset, font import, token import
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ api/
â”‚   â”‚   â”‚   â”œâ”€â”€ auth/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ route.ts           # POST: login/logout (code lookup â†’ cookie)
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ session/route.ts   # GET: current session
â”‚   â”‚   â”‚   â”œâ”€â”€ assignments/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ route.ts           # GET list, POST create
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ [id]/
â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ route.ts       # GET detail (with texts, rubric, annotations, scores)
â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ generate/route.ts   # POST: Gemini-first text generation (mock fallback)
â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ analyze/route.ts    # POST: multi-agent Gemini analysis (mock fallback)
â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ calibrate/route.ts  # POST: confirm/dismiss/flag_new
â”‚   â”‚   â”‚   â”‚       â””â”€â”€ release/route.ts    # POST: release to students
â”‚   â”‚   â”‚   â”œâ”€â”€ annotations/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ route.ts           # POST: create annotation
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ [id]/
â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ route.ts       # PUT: update note, DELETE
â”‚   â”‚   â”‚   â”‚       â””â”€â”€ evidence/route.ts  # POST: attach evidence
â”‚   â”‚   â”‚   â”œâ”€â”€ scoring/
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ [textId]/route.ts  # POST: run scoring, GET: results, PUT: override
â”‚   â”‚   â”‚   â””â”€â”€ texts/
â”‚   â”‚   â”‚       â””â”€â”€ [id]/
â”‚   â”‚   â”‚           â”œâ”€â”€ route.ts       # GET: text with annotations
â”‚   â”‚   â”‚           â”œâ”€â”€ rubric/route.ts # GET: rubric items (instructor only)
â”‚   â”‚   â”‚           â””â”€â”€ submit/route.ts # POST: mark as submitted
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ instructor/
â”‚   â”‚   â”‚   â”œâ”€â”€ layout.tsx             # Auth guard (redirects non-instructors)
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx               # Dashboard: assignment list
â”‚   â”‚   â”‚   â”œâ”€â”€ create/page.tsx        # Create assignment form
â”‚   â”‚   â”‚   â””â”€â”€ [assignmentId]/
â”‚   â”‚   â”‚       â”œâ”€â”€ page.tsx           # Assignment detail + action buttons
â”‚   â”‚   â”‚       â”œâ”€â”€ calibrate/page.tsx # Side-by-side: highlighted text + rubric cards
â”‚   â”‚   â”‚       â””â”€â”€ submissions/
â”‚   â”‚   â”‚           â”œâ”€â”€ page.tsx       # Submissions table: scores, coverage, status
â”‚   â”‚   â”‚           â””â”€â”€ [studentId]/page.tsx  # Per-student: 3-tier review + override
â”‚   â”‚   â”‚
â”‚   â”‚   â””â”€â”€ student/
â”‚   â”‚       â”œâ”€â”€ layout.tsx             # Auth guard (redirects non-students)
â”‚   â”‚       â””â”€â”€ [assignmentId]/
â”‚   â”‚           â”œâ”€â”€ page.tsx           # Landing: prompt, text preview, process steps
â”‚   â”‚           â”œâ”€â”€ workspace/page.tsx # Main workspace: DocViewer + sidebar + toolbar
â”‚   â”‚           â””â”€â”€ report/page.tsx    # Submission report: stats, breakdown, annotations
â”‚   â”‚
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ icons/index.tsx    # 14 SVG icons + annotationIcons/evidenceIcons maps
â”‚   â”‚   â””â”€â”€ ui/
â”‚   â”‚       â”œâ”€â”€ Button.tsx + .module.css    # primary/secondary, small variant
â”‚   â”‚       â”œâ”€â”€ Badge.tsx + .module.css     # StatusBadge + AnnotationBadge
â”‚   â”‚       â”œâ”€â”€ Card.tsx + .module.css      # with optional borderAccent
â”‚   â”‚       â”œâ”€â”€ Input.tsx + .module.css     # extends InputHTMLAttributes
â”‚   â”‚       â”œâ”€â”€ Textarea.tsx + .module.css  # extends TextareaHTMLAttributes
â”‚   â”‚       â”œâ”€â”€ Tabs.tsx + .module.css      # tab bar with active state
â”‚   â”‚       â””â”€â”€ StatCard.tsx + .module.css  # value + label + optional sub
â”‚   â”‚
â”‚   â”œâ”€â”€ lib/
â”‚   â”‚   â”œâ”€â”€ auth.ts            # Cookie-based sessions (httpOnly, 24h)
â”‚   â”‚   â”œâ”€â”€ db.ts              # Prisma client singleton
â”‚   â”‚   â”œâ”€â”€ matching.ts        # Annotationâ†”rubric matching (Jaccard + location overlap)
â”‚   â”‚   â”œâ”€â”€ scoring.ts         # 3-tier scoring engine
â”‚   â”‚   â”œâ”€â”€ mock-data.ts       # 3 sample texts + prompt + rubric item generator
â”‚   â”‚   â””â”€â”€ utils.ts           # generateCode, countWords, calculateCoverage
â”‚   â”‚
â”‚   â”œâ”€â”€ locale/
â”‚   â”‚   â””â”€â”€ he.ts              # All Hebrew UI strings (app, auth, workspace, sidebar, etc.)
â”‚   â”‚
â”‚   â””â”€â”€ styles/
â”‚       â”œâ”€â”€ tokens.css         # CSS custom properties (colors, fonts, radii)
â”‚       â””â”€â”€ tokens.ts          # Same tokens as JS exports
â”‚
â”œâ”€â”€ package.json
â”œâ”€â”€ tsconfig.json
â”œâ”€â”€ next.config.ts
â””â”€â”€ .env                       # DATABASE_URL=file:./prisma/dev.db
```

---

## Database Schema (9 Models)

```
Assignment â”€â”€â”¬â”€â”€ GeneratedText â”€â”€â”¬â”€â”€ RubricItem â”€â”€â”€â”€ RubricMatch
             â”‚                   â”œâ”€â”€ Annotation â”€â”€â”¬â”€â”€ Evidence
             â”‚                   â”‚                â”œâ”€â”€ RubricMatch
             â”‚                   â”‚                â””â”€â”€ BeyondRubricFinding
             â”‚                   â””â”€â”€ Score
             â””â”€â”€ CalibrationLog
```

### Key Fields

**Assignment**: title, promptText, courseContext, requirements, knownPitfalls, instructorCode (unique), status (draft â†’ generating â†’ analyzing â†’ calibrating â†’ active â†’ grading â†’ closed)

**GeneratedText**: studentCode, studentName, textContent, wordCount, status (generated â†’ analyzed â†’ active â†’ submitted â†’ scored)

**RubricItem**: passSource, severity (critical/moderate/minor), category, locationStart/End, description, idealResponse, flaggedText, confirmed (boolean)

**Annotation**: type (error/verified/alternative/gap/nuance/accepted), locationStart/End, selectedText, note

**Evidence**: type (conversation/source/note), content

**Score**: tier1Raw, tier2Deductions, tier3Bonus, coverageScore, compositeRaw, normalizedFinal, professorOverride, professorNotes, releasedAt

---

## Auth System

- Code-based entry (no passwords)
- Cookie: `audit-session` â€” JSON with `{ role, code, assignmentId, textId? }`
- httpOnly, 24-hour expiry, sameSite: lax
- Server-side guards: `instructor/layout.tsx` and `student/layout.tsx` check session role
- Students can only login when assignment status is `active`, `grading`, or `closed`

---

## Scoring Engine

### 3-Tier Model

| Tier | What | Max Points |
|------|------|-----------|
| **Tier 1** â€” Rubric matches | Annotations that match confirmed rubric items | 60 |
| **Tier 2** â€” Misses (deductions) | Confirmed rubric items the student didn't find | -20 |
| **Tier 3** â€” Beyond rubric (bonus) | Good annotations that go beyond the rubric | +20 |

### Matching Algorithm (`lib/matching.ts`)
- **Location overlap**: Character range overlap (threshold: 0.3)
- **Semantic similarity**: Jaccard keyword overlap with Hebrew/English stopwords (threshold: 0.15)
- **Type alignment**: Annotation type maps to expected rubric categories
- **Deduplication**: Each annotation matches at most 1 rubric item, and vice versa
- **Quality score**: 0-10 based on correct identification (+3), note depth (+3), evidence (+2), reasoning (+2)

### Severity Weights
- critical = 3x
- moderate = 2x
- minor = 1x

### Coverage Modifier
- If text coverage < 40%, Tier 1 is multiplied by 0.8

---

## 6 Annotation Types

| Type | Hebrew | Color | Purpose |
|------|--------|-------|---------|
| `error` | ××™-×“×™×•×§ | `#B54D4D` | Factual/logical errors |
| `verified` | ××•×ž×ª ×›×ž×“×•×™×§ | `#4D8B6A` | Claims verified against sources |
| `alternative` | ×—×œ×•×¤×” ×¢×“×™×¤×” | `#A68A2B` | Better framing/source exists |
| `gap` | ×¨×›×™×‘ ×—×¡×¨ | `#9B6B42` | Important missing content |
| `nuance` | × ×™×•×× ×¡ ×“×™×¡×¦×™×¤×œ×™× ×¨×™ | `#4A6F8B` | Oversimplification caught |
| `accepted` | ××•×©×¨ â€” ×¢× × ×™×ž×•×§ | `#7A7568` | Confirmed as-is with reasoning |

---

## Design System

### Color Palette (CSS Custom Properties)
- `--bg: #F3F1EC` â€” warm off-white background
- `--card: #FAFAF6` â€” card surface
- `--ink: #2C2924` â€” primary text (NOT pure black)
- `--ink-soft: #5E574B` â€” secondary text
- `--ink-faint: #9E9688` â€” tertiary text
- `--accent: #8B5E3C` â€” warm brown primary action
- Semantic: `--error`, `--success`, `--warn`, `--gap`, `--info`, `--neutral` (each with `-soft` variant)

### Typography
- Font: Heebo (Google Fonts), weights 300-700
- Display + body both use Heebo

### RTL
- `<html lang="he" dir="rtl">` on root
- All layouts respect RTL: `borderInlineStart`, `text-align: start`, etc.

---

## Seed Data

The seed (`prisma/seed.ts`) creates:

- **1 Assignment**: "×ž×‘×•× ×œ×¡×•×¦×™×•×œ×•×’×™×” â€” ×ž×¢×ž×“ ×—×‘×¨×ª×™ ×•×”×™×©×’×™× ×œ×™×ž×•×“×™×™×"
  - instructor code: `PROF01`
  - status: `calibrating`
  - 3 generated texts (Hebrew sociology essays, ~390 words each)

- **10 Rubric Items** across 3 texts:
  - Text 1 (STU001): 5 items â€” unverifiable OECD stat, Bernstein/Bourdieu misattribution, western-centric framing, missing intersectionality, Finland oversimplification
  - Text 2 (STU002): 3 items â€” Bernstein as "extension" of Bourdieu, unverifiable 42% stat, missing digital divide
  - Text 3 (STU003): 2 items â€” unverifiable 35% stat, oversimplified SES vs intelligence claim

- **3 Calibration logs**: generation, analysis, professor review

### Reseed Command
```bash
npx tsx prisma/seed.ts
```

---

## What's Mock vs Real

| Component | Current State | To Make Real |
|-----------|--------------|--------------|
| Text generation | Gemini-first on backend (`gemini-3-flash-preview`) with mock fallback if not configured | Add instructor UI controls for pilot vs full batches and explicit roster persistence |
| Rubric analysis | Multi-agent Gemini analysis (`gemini-3-pro-preview`) with aggregation + mock fallback | Expose agent-template editing and preliminary-report visualization in calibration UI |
| Scoring engine | REAL â€” fully functional keyword matching | Could add embedding-based matching later |
| Auth | REAL â€” code-based, cookie sessions | Could add Firebase Auth or similar |
| Database | REAL â€” SQLite via Prisma | Could swap to Postgres for production |
| All UI pages | REAL â€” fully functional | Polish, accessibility audit |

---

## Known Limitations / Future Work

1. **No real AI generation** â€” the generate/analyze endpoints just return mock data or pre-seeded DB content
2. **No tests** â€” no unit tests, integration tests, or e2e tests exist
3. **No accessibility audit** â€” needs screen reader testing, keyboard navigation review
4. **Bundle not optimized** â€” no code splitting, lazy loading
5. **Scoring uses keyword matching** â€” could be upgraded to embedding-based semantic matching
6. **No real-time updates** â€” polling-based, no WebSockets
7. **SQLite** â€” fine for demo, needs Postgres for multi-user production
8. **No file uploads** â€” evidence is text-only, no image/PDF attachment
9. **Student workspace** â€” the DocViewer handles overlapping annotations naively (sorted by start position, later annotations may occlude earlier ones)

---

## Changelog

### 2026-02-23 â€” Gemini Backend Foundation (Phase 2 prep)
- Localized remaining English login/showcase entry copy on `/` to Hebrew.
- Added new AI orchestration module: `src/lib/ai/gemini.ts`
  - Server-side Gemini API integration (no client-side key exposure)
  - Configurable models:
    - generation default: `gemini-3-flash-preview`
    - audit default: `gemini-3-pro-preview`
  - Default specialized audit agents (factual verification, citation integrity, disciplinary nuance, argument structure)
  - Multi-agent aggregation + de-duplication + severity normalization
- Refactored `POST /api/assignments/[id]/generate`:
  - Gemini-first generation when key is configured
  - Mock fallback when Gemini is not configured
  - Incremental generation for new codes only (no hard stop after first generation)
  - Added pilot controls (`generationStage`, `pilotCount`) for 2-text first-pass workflow
  - Explicit Gemini error surfacing (403 restrictions now returned clearly)
- Refactored `POST /api/assignments/[id]/analyze`:
  - Multi-agent Gemini analysis path with optional custom agent templates
  - Optional `forceReanalyze` and `textIds` targeting
  - Writes structured preliminary reports to dedicated tables (`AgentAnalysisReport`, `AgentAnalysisAgentRun`, `AgentAnalysisFinding`)
  - Strict Gemini behavior: when Gemini mode is enabled and no findings are returned, route stops with explicit error (no silent mock fallback)
- Updated assignment creation route to persist `modelVersion` from generation model config.
- Added instructor import flow for existing generated texts:
  - New route: `POST /api/assignments/[id]/import-texts`
  - Supports JSON/text import payloads
  - Applies automatic anonymization redactions before persistence
  - Logs import action and sets assignment status to `analyzing`
- Implemented persistent assignment roster:
  - Added DB fields on `Assignment`: `plannedStudentCount`, `plannedStudentCodes` (JSON string)
  - Added `src/lib/assignment-roster.ts` helper for normalization/parse/merge
  - `POST /api/assignments` now stores planned roster at creation
  - `POST /api/assignments/[id]/generate` now defaults to stored roster (no placeholder codes)
  - `POST /api/assignments/[id]/import-texts` now merges imported codes into stored roster
  - Instructor assignment page now shows roster stats and uses pilot/full generation from persisted roster
- Removed old instructor-code uniqueness restriction:
  - `Assignment.instructorCode` is no longer unique
  - Instructor can create multiple assignments under one instructor code
  - Added index `@@index([instructorCode, createdAt])` for dashboard query performance
- Added structured report read path:
  - New route: `GET /api/assignments/[id]/analysis-reports`
  - Supports query params: `latest=1`, `textId`, `limit`
  - Instructor assignment detail page now shows latest report summary per text
- Added runtime config placeholders:
  - `.env.example` now includes Gemini key/model vars
  - `apphosting.yaml` now maps `GEMINI_API_KEY` secret
  - `apphosting.demo.yaml` now pins `USE_MOCK_AI=1` (intentional demo safeguard)
- Added `GEMINI-SETUP.md` with exact secret commands and local env setup steps.
- Validation:
  - `pnpm.cmd exec tsc --noEmit` passes after route refactor.
  - `prisma db push` was not completed in this shell due missing Postgres `DATABASE_URL` env injection.

### 2026-02-22 â€” Showcase Demo Expansion (Stakeholder UX pass)
- Expanded `/showcase` from static preview into a full frontend simulation of two roles:
  - **Instructor flow**: criteria setup, demo agent runs, weighted issue controls, follow-up tags
  - **Student flow**: mission/progress, text selection, tagging, rationale, fix, verification, evidence
- Added **pre-audited reveal behavior**:
  - Clicking `Run Demo Agents` now reveals expected findings and highlighted source spans in the model text
- Added **guided 60-second walkthrough**:
  - Step-by-step tour with auto-scroll, role switching, active section focus, and floating tooltip controls
- Added **onboarding/value UX improvements**:
  - First-visit auto-start tour (browser-local)
  - Value proposition strip (`×œ×ž×” ×›×“××™ ×œ××ž×¥ ××ª ×”×ž×¢×¨×›×ª`)
  - Quick jump buttons (`×”×“×’×ž×ª ×ž×¨×¦×”`, `×”×“×’×ž×ª ×¡×˜×•×“× ×˜`)
- Localized showcase-facing UI copy in the newly added components to Hebrew for consistency.

### 2025-02-22 â€” Initial MVP Build
- Built entire application from scratch in a single session
- All 12 implementation tasks completed:
  - Task 0: Project scaffolding (Next.js 16, Prisma 6, pnpm)
  - Task 1: Database schema (9 models) + seed data (3 texts, 10 rubric items)
  - Task 2: UI component library (7 components with CSS Modules)
  - Task 3: Auth system (code-based, cookie sessions)
  - Task 4: Instructor create assignment page
  - Task 5: Mock text generation + analysis API routes
  - Task 6: Instructor calibration page (side-by-side text + rubric review)
  - Task 7: Student audit workspace (DocViewer, annotation toolbar, sidebar with 3 tabs)
  - Task 8: Student report page (stats, breakdown, grouped annotations)
  - Task 9: Scoring engine (3-tier, Jaccard matching, severity weights)
  - Task 10: Instructor submission review (submissions table + per-student 3-tier view)
  - Task 11: Integration testing + polish
- Fixed route conflict: `texts/[id]` vs `texts/[textId]` â€” consolidated under `[id]`
- Fixed severity mismatch: seed used `"major"` but UI/scoring expected `"critical"` â€” updated seed and re-seeded
- Downgraded Prisma 7 â†’ 6 due to Node.js 20 `ERR_REQUIRE_ESM` incompatibility

---

## API Quick Reference

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth` | Login (code) / Logout |
| GET | `/api/auth/session` | Current session |
| GET | `/api/assignments` | List assignments |
| POST | `/api/assignments` | Create assignment |
| GET | `/api/assignments/[id]` | Assignment detail (includes texts, rubric, annotations, scores) |
| PATCH | `/api/assignments/[id]` | Update assignment |
| POST | `/api/assignments/[id]/generate` | Generate texts (Gemini-first, mock fallback) |
| POST | `/api/assignments/[id]/analyze` | Analyze texts (multi-agent Gemini strict mode; writes structured reports) |
| GET | `/api/assignments/[id]/analysis-reports` | Get structured analysis reports (latest/history) |
| POST | `/api/assignments/[id]/import-texts` | Import existing texts with anonymization |
| POST | `/api/assignments/[id]/calibrate` | Confirm/dismiss/flag rubric items |
| POST | `/api/assignments/[id]/release` | Release to students |
| POST | `/api/annotations` | Create annotation |
| PUT | `/api/annotations/[id]` | Update annotation note |
| DELETE | `/api/annotations/[id]` | Delete annotation |
| POST | `/api/annotations/[id]/evidence` | Attach evidence |
| POST | `/api/scoring/[textId]` | Run scoring |
| GET | `/api/scoring/[textId]` | Get score |
| PUT | `/api/scoring/[textId]` | Override score / release |
| GET | `/api/texts/[id]` | Get text with annotations |
| PATCH | `/api/texts/[id]` | Instructor manual text edit (pre-release only; optional analysis reset) |
| GET | `/api/texts/[id]/rubric` | Get rubric items |
| POST | `/api/texts/[id]/regenerate` | Instructor regenerate one text (pre-release only; resets analysis artifacts) |
| POST | `/api/texts/[id]/submit` | Submit student work |

