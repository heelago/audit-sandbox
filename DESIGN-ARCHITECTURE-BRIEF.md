# Audit Sandbox: Architecture + UX Structure Brief

## 1) What this document is for
This file describes the current platform structure and interaction model so a design tool can accurately mock a cleaner UX redesign without guessing the product logic.

Scope:
- Current information architecture (pages/routes)
- UI structure and component patterns
- Backend/API + data model coupling that affects UX
- Known design debt and constraints

Date context:
- Codebase state: current repository snapshot
- Primary language direction: Hebrew RTL

---

## 2) Product in one paragraph
Audit Sandbox is a teaching platform where instructors create AI-generated assignments and students audit those texts for errors, gaps, missing nuance, and verification quality. Instructors define assignment intent, generate multiple texts, run AI audit agents for draft findings, calibrate/approve findings, then release to students. Students annotate text spans, attach evidence, and submit. Instructors then review scoring and submissions.

---

## 2.1) Latest update (2026-02-24)
- Instructor authoring now includes a seeded-error flow with explicit "planted signals" for AI-isms and pedagogical faults.
- Planted signals are encoded in `knownPitfalls` using a metadata block:
  - `[PLANTED_SIGNALS] ... [/PLANTED_SIGNALS]`
- Instructor can choose from discipline presets:
  - General Academic, Anthropology/Qualitative, Ancient Medicine History, Critical Theory, Law Case Method, Medical/Clinical Reasoning.
- Create page now includes:
  - signal tag chooser
  - preset selector + apply action
  - automatic preset suggestion from assignment context text
  - brainstorming-prompt generator for instructors ("help me design mistakes to bake in")
- Generation prompts now explicitly enforce planted-signal inclusion when configured.
- Audit prompts now explicitly target planted signals first, then continue with general critical review.
- Analyze fallback improved:
  - if Gemini returns zero findings, the server attempts planted-signal heuristic findings before generic manual-review placeholder.

---

## 3) Tech stack and runtime architecture
- Framework: Next.js 16 App Router (React 19, TypeScript)
- Styling: mix of CSS Modules, global CSS tokens, and heavy inline styles on several screens
- Data: Prisma ORM + PostgreSQL
- Auth/session: custom code-based login, signed cookie session
- AI backend: server-side Gemini integration
- Deployment target: Firebase App Hosting
- Email workflow: Firebase Admin + Firestore mail queue (Trigger Email extension pattern)

---

## 4) Top-level route map (current IA)

Public:
- `/` login + access request form + platform philosophy modal
- `/showcase` guided demo (instructor + student simulation)

Instructor:
- `/instructor` dashboard + access request admin panel
- `/instructor/create` assignment creation (guided builder + prompt editor + templates + guided tour)
- `/instructor/[assignmentId]` assignment operations (generate/analyze/import/edit/reanalyze/regenerate)
- `/instructor/[assignmentId]/calibrate` text-by-text calibration and release
- `/instructor/[assignmentId]/submissions` submission list and scoring controls
- `/instructor/[assignmentId]/submissions/[studentId]` per-student detailed review

Student:
- `/student/[assignmentId]` assignment landing
- `/student/[assignmentId]/workspace` annotation workspace
- `/student/[assignmentId]/report` submission report/summary

---

## 5) User flow structure (current behavior)

Instructor flow:
1. Login with code
2. Dashboard: choose existing assignment or create new
3. Create page: define assignment + optional advanced fields
4. Assignment detail: generate texts, analyze with agents, review reports
5. Calibrate page: confirm/dismiss/add findings, edit/regenerate texts
6. Release assignment to students
7. Review submissions and scoring

Student flow:
1. Login with student code
2. Assignment landing
3. Workspace: select text span, classify finding type, add rationale/evidence
4. Submit and view report

Public evaluator flow:
1. Open landing/showcase
2. Run guided tour to understand lecturer + student experience
3. Optional instructor access request submission

---

## 6) Current frontend structure and design language

Global foundation:
- Root HTML is `lang="he"` and `dir="rtl"`
- Warm neutral palette via CSS variables (`src/styles/tokens.css`)
- Font stack centered on Heebo

Design token set includes:
- Background/card/border/ink color roles
- Semantic roles: error/success/warn/info/gap
- Radius scale and font variables

Implementation pattern today:
- Some reusable UI primitives exist (`Button`, `Card`, `Badge`, `Input`, `Textarea`, `Tabs`, `StatCard`)
- Many major pages are still large monoliths with direct inline layout/styles and local state
- Design consistency is partial: primitives are available, but not uniformly adopted

Large page modules (approximate complexity signal):
- `src/app/showcase/page.tsx`: ~1584 lines
- `src/app/student/[assignmentId]/workspace/page.tsx`: ~1318 lines
- `src/app/instructor/create/page.tsx`: ~1206 lines
- `src/app/instructor/[assignmentId]/page.tsx`: ~1103 lines
- `src/app/page.tsx`: ~801 lines

---

## 7) Screen-by-screen UX structure (important for redesign)

Landing (`/`):
- Login input (code-based)
- Access request form (name/email/institution/role/message)
- Philosophy modal
- Showcase entry CTA
- Mixed responsibilities on one screen (auth + lead generation + education)

Instructor dashboard (`/instructor`):
- Assignment cards list
- Access request moderation panel (approve/reject/send email/check delivery)
- Action-heavy admin table within same page as teaching dashboard

Create assignment (`/instructor/create`):
- Guided question-based builder
- Advanced prompt editor fields
- Up to 3 section planning
- Generation strategy selector
- Seeded-error controls:
  - planted signal tags
  - discipline presets
  - automatic preset suggestion
  - brainstorming prompt builder for "mistakes to bake in"
- Local template save/load/export/import
- Inline walkthrough/tour logic
- High feature density, long scroll, many decisions in one step

Assignment detail (`/instructor/[assignmentId]`):
- Assignment metadata and settings edit
- Generation controls (pilot/full)
- Analyze controls (agents/findings)
- Import external texts
- Per-text row actions (edit/regenerate/reanalyze)
- Activity log + report summary
- Complex control center view

Calibration (`/instructor/[assignmentId]/calibrate`):
- Active text + rubric findings
- Confirm/dismiss findings
- Add manual finding from text selection
- Edit text, regenerate text, rerun analyze
- Release action

Student workspace (`/student/[assignmentId]/workspace`):
- Custom text viewer with span selection
- Annotation cards with type, note, evidence
- Category taxonomy
- Guided prompts per annotation type
- Dense single-screen workflow

Showcase (`/showcase`):
- Interactive simulation of both roles
- Walkthrough steps and instructor process preview
- Not connected to live assignment state by default

---

## 8) Data and API coupling that shapes UX

Primary state machine for `Assignment.status`:
- `draft -> generating -> analyzing -> calibrating -> active -> grading -> closed`

Key APIs:
- Auth/session:
  - `POST /api/auth`
  - `GET /api/auth/session`
- Instructor assignment lifecycle:
  - `GET/POST /api/assignments`
  - `GET/PATCH /api/assignments/[id]`
  - `POST /api/assignments/[id]/generate`
  - `POST /api/assignments/[id]/analyze`
  - `POST /api/assignments/[id]/calibrate`
  - `POST /api/assignments/[id]/release`
  - `GET /api/assignments/[id]/analysis-reports`
  - `POST /api/assignments/[id]/import-texts`
- Text-level operations:
  - `GET/PATCH /api/texts/[id]`
  - `POST /api/texts/[id]/regenerate`
  - `GET /api/texts/[id]/rubric`
  - `POST /api/texts/[id]/submit`
- Student annotation/scoring:
  - `POST /api/annotations`
  - `PUT/DELETE /api/annotations/[id]`
  - `POST /api/annotations/[id]/evidence`
  - `POST/GET/PUT /api/scoring/[textId]`
- Access request workflow:
  - `GET/POST /api/access-requests`
  - `PATCH /api/access-requests/[id]`
  - `GET /api/access-requests/site-key`

Frontend data handling:
- Mostly direct `fetch` in page components
- Mostly local `useState`/`useEffect` orchestration
- No centralized client state/query cache layer
- Authoring metadata convention:
  - seeded-signal IDs are persisted in `knownPitfalls` via marker block so generation and audit routes can coordinate without adding new DB columns yet.

---

## 9) Data model summary (Prisma)

Core teaching models:
- `Assignment`
- `GeneratedText`
- `RubricItem`
- `CalibrationLog`
- `Annotation`
- `Evidence`
- `Score`
- `RubricMatch`
- `BeyondRubricFinding`

Agent analysis models:
- `AgentAnalysisReport`
- `AgentAnalysisAgentRun`
- `AgentAnalysisFinding`

Access control models:
- `AccessRequest`
- `InstructorAccess`

Implication for UX:
- The backend supports richer instructor review views than currently surfaced in a clean, composable way.

---

## 10) Security and trust controls (relevant to UX decisions)

Implemented controls:
- Server-side API key usage only (Gemini keys not exposed to client)
- Input sanitization and prompt untrusted-block wrapping
- Middleware rate limiting + mutating-origin checks + body-size limits
- Access request abuse controls (honeypot, fill-time checks, rate limit, optional reCAPTCHA)
- Student-facing APIs hide internal generation prompt internals

UX implication:
- Any redesign can safely expose more transparency about process steps, but should still avoid exposing internal hidden prompt instructions and secret-backed internals.

---

## 11) Current UX debt and structural pain points

Information architecture debt:
- Landing page mixes too many jobs (auth, marketing, request funnel, explainer)
- Instructor dashboard mixes teaching operations with access administration

Interaction debt:
- Create page is powerful but cognitively heavy for first-time lecturers
- Assignment detail page has many advanced actions competing for attention
- Some workflows are linear in concept but presented as dense tool surfaces

UI consistency debt:
- Mixed styling approaches cause visual drift
- Reusable components exist but many screens bypass them with inline styles

Code structure debt:
- Several very large page components with state/UI/business logic mixed together
- Harder to iterate on UX variants because concerns are not split into smaller composable blocks

Localization debt:
- Hebrew-first localization exists, but some text still comes from inline strings and not all copy is centrally managed

---

## 12) Redesign constraints you should preserve

Must keep:
- RTL-first layout and Hebrew UX
- Instructor and student role separation
- Assignment lifecycle states
- Ability to handle up to 3 assignment sections
- Multi-agent analysis concept (even if visually simplified)
- Instructor calibration before release
- Student annotation + evidence as core interaction
- Access request + approval path for instructor onboarding

Must not expose:
- Secret keys
- Internal hidden prompt instructions
- Sensitive backend-only config

---

## 13) Recommended redesign direction (from current architecture)

IA simplification:
- Split landing into cleaner pathways:
  - Login
  - Try showcase
  - Request instructor access
  - Read methodology

Instructor UX reframe:
- Convert current create + detail complexity into a staged wizard:
  - Stage 1: course + objective
  - Stage 2: sections + criteria + pitfalls
  - Stage 3: generate + inspect sample
  - Stage 4: agent review + calibration + release

Dashboard clarity:
- Separate "teaching operations" and "admin access requests" into distinct tabs/screens

Student workspace refinement:
- Keep text-selection interaction
- Improve annotation panel hierarchy and progressive disclosure
- Keep evidence attachment close to each annotation context

Technical maintainability target:
- Break monolith pages into domain components (builder, generation console, calibration panel, annotation editor, onboarding shell)

---

## 14) File pointers for reference

Core app shell:
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/styles/tokens.css`

Key pages:
- `src/app/page.tsx`
- `src/app/showcase/page.tsx`
- `src/app/instructor/page.tsx`
- `src/app/instructor/create/page.tsx`
- `src/app/instructor/[assignmentId]/page.tsx`
- `src/app/instructor/[assignmentId]/calibrate/page.tsx`
- `src/app/student/[assignmentId]/workspace/page.tsx`

Core backend routes:
- `src/app/api/assignments/route.ts`
- `src/app/api/assignments/[id]/generate/route.ts`
- `src/app/api/assignments/[id]/analyze/route.ts`
- `src/app/api/assignments/[id]/calibrate/route.ts`
- `src/app/api/access-requests/route.ts`
- `src/app/api/access-requests/[id]/route.ts`

Data model:
- `prisma/schema.prisma`

---

## 15) Short prompt you can paste into a design tool

"Redesign an RTL Hebrew-first academic platform called Audit Sandbox. Two roles: instructor and student. Instructors create AI-generated assignments, define criteria/pitfalls (up to 3 sections), run agent analysis, calibrate findings, and release to students. Students annotate text spans, classify issues, add evidence, and submit. Keep secure/serious academic tone, modern but warm UI, reduce cognitive load with staged flows, preserve complex capability under progressive disclosure. Use clear IA separation between login/showcase/access request, instructor operations, and admin request moderation."
