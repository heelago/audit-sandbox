# Redesign Plan Review (Designer Input -> Build Plan)

Source reviewed: `redesign plan.md`

## Overall verdict
Strong direction. The proposal matches product goals and is compatible with current architecture. It should be implemented with staged rollout so we improve UX without destabilizing production flows.

## Adopt As-Is (High confidence)
- Hebrew RTL-first rules and mirrored layout logic.
- Clear separation of pedagogy vs admin tasks.
- Wizard-style lecturer flow instead of one giant form.
- Student two-pane workspace (text + inspector) with focused tagging flow.
- Process transparency for lifecycle states (not just a spinner).
- Consistent semantic coloring:
  - Sage for verified/progression
  - Amber for critical attention/flaws

## Adopt With Adjustments (Important)
- Typography:
  - Body/UI can stay Heebo/Rubik.
  - Add serif headings selectively (Frank Ruhl Libre / David Libre) only where readability remains strong in long RTL interfaces.
- “Puzzle spine” metaphor:
  - Good concept, but keep it subtle and functional (stepper first, decoration second).
- AI transparency strings:
  - Keep human-readable statuses, but never expose internal prompts or seeded-signal internals to students.
- Glow/blur effects:
  - Use sparingly; prioritize accessibility contrast and performance on mobile.

## Defer / Phase Later
- Complex animated “connection node” visuals across all AI states.
- Full visual metaphor system (puzzle/connection) everywhere.
- Heavy motion behavior in student workspace while annotation core is still evolving.

## Key architecture alignment with current system
- Current assignment lifecycle already supports this UX:
  - `draft -> generating -> analyzing -> calibrating -> active -> grading -> closed`
- New seeded-signal system already exists and fits Step 2 (“Planted Signals & Brainstorming”):
  - Signal tags
  - Discipline presets
  - Auto preset suggestion
  - Brainstorm prompt builder
- Multi-agent analysis pipeline already exists and can power Step 3 process view.

## Proposed rollout (implementation order)

### Phase 1: Information Architecture cleanup
- Split instructor dashboard into:
  - `Pedagogy` (assignments)
  - `Admin` (access requests/settings)
- Reduce mixed responsibilities on `/instructor`.

### Phase 2: Lecturer wizard shell
- Refactor `/instructor/create` into explicit staged stepper:
  1. Context + preset
  2. Planted signals + brainstorming
  3. Generation + agent run progress
  4. Calibration handoff
- Keep existing backend payloads unchanged to avoid migration risk.

### Phase 3: Student workspace UX rebuild
- Two-pane desktop layout:
  - Right: text document
  - Left: fixed inspector
- Mobile bottom-sheet inspector for selection actions.
- Improved tag chips and evidence flow hierarchy.

### Phase 4: Visual polish + motion
- Introduce subtle status animations.
- Add connection-line micro-interactions between selected text and inspector.
- Tune color/typography system after core UX stabilizes.

## Risk controls
- Preserve all current API contracts during UI refactor.
- Keep server-only prompt/security constraints.
- Add visual regression checks for RTL layout and mobile breakpoints.
- Add accessibility checks for contrast/focus states with Sage/Amber palette.

## Immediate next build slice (recommended)
1. Instructor dashboard split (Pedagogy/Admin tabs).
2. Wizard step shell in create page (without changing payload semantics).
3. Student inspector panel hierarchy cleanup before advanced animation.

