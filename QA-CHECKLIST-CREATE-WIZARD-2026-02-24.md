# QA Checklist - Instructor Create Wizard (v2 — 11 Sub-Step Flow)

Date: 2026-02-24 (updated)
Scope: `src/app/instructor/create/page.tsx` conversational wizard + components

## 1) Automated Checks

1. `pnpm.cmd exec tsc --noEmit`
- Status: PASS

2. `pnpm.cmd run lint`
- Status: PASS (script now runs `tsc --noEmit`)

3. `pnpm.cmd run build`
- Status: PASS (compile succeeds; previous `spawn EPERM` resolved)

## 2) Code-Level QA (Completed)

1. **RTL back arrow** — Fixed `&larr;` → `&rarr;` for correct RTL "back" direction.
2. **Summary truncation** — Fixed criteria/sources always appending "..." even for short values.
3. **Section rendering** — Changed to use `activeSections` memo for defensive consistency.
4. **Beta config duplication** — Extracted `getBetaAssignmentLimit()` to `src/lib/beta-config.ts`.
5. **Dead import** — `PLANTED_SIGNAL_PRESETS` removed from page.tsx (only used in DisciplinePresetGrid).
6. **RTL slide animation** — Fixed `cardSlideIn` direction from `translateX(-24px)` to `translateX(24px)`.
7. **Sage checkmark SVG** — Added to WizardSidebar for completed steps (replaces dot marker).

## 3) Manual UX QA (Desktop)

Use Chrome desktop first, then Edge.

1. Open `http://localhost:3000/instructor/create`.
- Expect: right-side RTL sidebar is visible and sticky (280px wide).
- Expect: sage-themed sidebar with 4 main steps listed.

2. Walk through all 11 sub-steps in order.
- **Sub-step 1**: Title input. Type a title → "הבא" enables.
- **Sub-step 2**: Discipline preset grid (6 cards, 2-col). Click one → sage border on selected.
- **Sub-step 3**: Task description textarea. Type text → "הבא" enables.
- **Sub-step 4**: Planted signals (amber chips). Toggle chips → expandable detail below.
- **Sub-step 5**: Section count (1/2/3 cards) + per-section inputs (title, task, criteria, pitfalls).
- **Sub-step 6**: Evaluation criteria textarea.
- **Sub-step 7**: Strategy cards (3-col). "מומלץ" label when planted signals exist.
- **Sub-step 8**: Sources textarea (optional).
- **Sub-step 9**: Word limit number input with range labels (150—1200).
- **Sub-step 10**: Version count number input.
- **Sub-step 11**: Summary cards with "עריכה" buttons. Advanced toggle collapsed.

3. Verify sidebar tracks progress.
- Active main step: amber styling.
- Completed main step: sage with checkmark SVG animation.
- Pending: neutral.
- Sub-step dots show within each main step.
- Progress bar fills proportionally.

4. Verify "הבא" / "הקודם" navigation.
- Prev disabled on first sub-step.
- Next disabled when required field empty (title on step 1, task on step 3, sections on step 5, criteria on step 6, count on step 10).
- Enter key advances (except in textareas).
- Last step shows "יצירת מטלה" instead of "הבא".

5. Verify keyboard navigation and focus.
- Tab through sidebar step buttons and card inputs.
- Expect: visible sage focus ring on all interactive elements.
- Shift+Tab reverses. No focus traps.
- Auto-focus lands on first input when sub-step changes.

6. Verify semantic colors.
- No blue anywhere — sage for primary/progress, amber for signals/warnings.
- Frank Ruhl Libre on headings (question text).
- Back arrow `→` points right (correct for RTL "back").

7. Verify summary step.
- All 10 summary cards display correct values.
- "עריכה" buttons navigate to correct sub-step.
- Short criteria/sources display without "..." truncation.
- Advanced toggle opens TemplatePanel + AdvancedPromptFields.

8. Verify slide transitions.
- Card content slides in from right (RTL-aware `translateX(24px)`).
- Smooth opacity + translate animation (~220ms).

## 4) Manual UX QA (Mobile)

Use Chrome DevTools responsive mode, widths: `390`, `430`, `768`.

1. Layout stacking.
- Expect: sidebar moves above form (full-width, not sticky).
- Expect: no horizontal scroll.

2. Readability.
- Labels, helper text, step statuses readable without zoom.
- Discipline preset grid stacks to 1-col below 640px.
- Strategy cards stack to 1-col below 640px.

3. Touch targets.
- Sidebar step buttons and card buttons easy to tap.
- Signal chips tappable without overlap.

4. Form field behavior.
- Focus ring visible and not clipped on mobile.

## 5) Pass Criteria

1. All 11 sub-steps navigate correctly forward and back.
2. Focus ring visible on keyboard navigation.
3. Sidebar state matches card content (amber=active, sage=done, neutral=pending).
4. Summary edit buttons return to correct sub-step.
5. Submit builds prompt automatically and POSTs to `/api/assignments`.
6. Mobile layout stacks without overflow.

## 6) Known Follow-up

1. Visual browser verification needed (code-level QA complete, manual browser test pending).
2. End-to-end submit test with live API requires active DB session.
