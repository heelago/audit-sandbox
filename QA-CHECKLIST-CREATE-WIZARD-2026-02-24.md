# QA Checklist - Instructor Create Wizard

Date: 2026-02-24
Scope: `src/app/instructor/create/page.tsx` staged wizard + semantic accessibility pass

## 1) Automated Checks

1. `pnpm.cmd exec tsc --noEmit`
- Status: PASS

2. `pnpm.cmd run lint`
- Status: BLOCKED
- Result: script currently runs `next lint`, which is not valid in this Next.js 16 setup and fails with:
  - `Invalid project directory provided, no such directory: ...\\lint`

3. `pnpm.cmd run build`
- Status: PARTIAL
- Result: app compiles successfully, then build exits with:
  - `Error: spawn EPERM`
- Notes: this appears to be an environment/process permission issue, not a TypeScript compile issue.

## 2) Manual UX QA (Desktop)

Use Chrome desktop first, then Edge.

1. Open `http://localhost:3000/instructor/create`.
- Expect: right-side RTL spine is visible and sticky.

2. Verify staged disclosure.
- Click step `1. פתיחה` in spine.
- Expect: only title stage content is shown.
- Click step `2. בניית המטלה`.
- Expect: guided builder content appears; prompt refinement fields are not visible yet.
- Click step `3. טיוב פרומפט`.
- Expect: prompt/templates/advanced fields appear.
- Click step `4. יצירה`.
- Expect: student count + submit only.

3. Verify semantic colors.
- Expect: active step uses amber styling.
- Mark a step complete by filling required fields.
- Expect: completed step turns sage.
- Pending steps should remain neutral.

4. Keyboard navigation and focus.
- Press `Tab` through step buttons and form fields.
- Expect: visible focus ring on buttons/inputs/textareas.
- Press `Shift+Tab` to reverse.
- Expect: focus order remains logical and no traps.

5. Stage progress behavior.
- Click `הבא` / `הקודם`.
- Expect: step changes and content switches immediately.
- Expect: progress counter updates.

## 3) Manual UX QA (Mobile)

Use Chrome DevTools responsive mode, widths: `390`, `430`, `768`.

1. Layout stacking.
- Expect: spine moves above form (not sticky right column).
- Expect: no horizontal scroll.

2. Readability.
- Check labels, helper text, step statuses.
- Expect: text is readable without zoom; line-height remains comfortable.

3. Touch targets.
- Tap step buttons and next/prev buttons.
- Expect: easy to tap, no overlapping controls.

4. Form field behavior.
- Focus input/textarea.
- Expect: focus ring visible and not clipped.

## 4) Pass Criteria

1. No broken flow between the 4 steps.
2. Focus ring visible on keyboard navigation.
3. Semantic state language is consistent between spine and content cards.
4. Mobile stacked layout remains readable and tappable without overflow.

## 5) Known Follow-up

1. Update lint script for Next.js 16 compatibility (replace `next lint`).
2. Investigate `spawn EPERM` build environment issue separately (process lock/permission).
