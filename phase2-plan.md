# AI Audit Sandbox — Phase 2 Implementation Plan

## Persistence, Immutability & Cross-Cycle Infrastructure

**Depends on:** Phase 1 MVP (claude-code-plan.md) — must be fully built and working  
**Reference:** `audit-sandbox-spec.md`, `PROJECT.md`, Phase 1 schema in `prisma/schema.prisma`  
**Primary language:** Hebrew (RTL) — no changes to locale strategy  
**Target:** Transform the MVP from a single-assignment grading tool into persistent epistemic infrastructure that improves over time

---

## 1. Phase 2 Scope

### What we're building

Phase 1 delivers a working audit tool: instructor creates an assignment, AI generates texts, system builds a hidden rubric, students audit, scoring compares annotations against rubric, instructor reviews and releases grades.

Phase 2 makes that tool **durable and compounding**. Specifically:

1. **Calibration becomes versioned.** Every calibration round creates a new immutable version. Student audits are pinned to the version they were scored against. Calibration history is preserved, never overwritten.

2. **Submissions become frozen.** After a student submits, their annotations, evidence, and notes are immutable. Post-submission changes by instructors are stored as separate records, not mutations.

3. **Scoring becomes snapshotted.** Match results are locked once computed. Rescoring against a new calibration version creates new records — it never silently overwrites.

4. **Unmatched annotations get a lifecycle.** Beyond-rubric findings flow from flagged → professor-reviewed → confirmed/rejected → optionally promoted into the next calibration version. This is the feedback loop that makes the system smarter over time.

5. **Findings become reusable.** Recurring findings (e.g., "AI misattributes Bernstein to Bourdieu") can be tagged and stored in a course-level library. Instructors can seed new calibrations from the library.

6. **The audit session becomes a first-class object.** An explicit `AuditSession` record wraps the student's work — start time, submission time, calibration version reference, text reference. This is the unit of analysis for research export.

### What we're deferring (Phase 3+)

- Cross-semester comparison dashboards and visualizations
- Cohort blind-spot analysis (which findings do students systematically miss?)
- Model training on instructor-verified findings
- Difficulty normalization using calibration version history
- English locale
- Mobile responsive layout
- Dark mode

### Design principles (from audit infrastructure review)

These principles guide every decision in Phase 2. They originate from an architectural review focused on long-term epistemic value:

1. **Never overwrite findings.** Findings represent epistemic truth at a moment in time. Overwriting destroys history. Always create new findings instead.
2. **Never overwrite calibration versions.** Calibration evolves. Versioning preserves stability. Student audits must always reference the calibration version used at the time.
3. **Never mutate student annotations after submission.** Annotations represent student cognition. Modifying them destroys evidence.
4. **Always store unmatched annotations.** They represent student originality, student misunderstanding, model blind spots, and rubric incompleteness — all of which are valuable.
5. **Never silently recompute scores.** Matching results must be stored explicitly and locked. If rescoring is needed, create new records.
6. **The audit is the primary assessment unit. The finding is the primary epistemic unit. The calibration version is the primary fairness unit.** They serve different purposes — don't collapse the hierarchy.

---

## 2. Schema Changes

Phase 2 modifies the Phase 1 Prisma schema. All changes are additive or migratory — no tables are dropped, no columns are removed. Existing data from Phase 1 testing remains valid.

### New models

```prisma
model CalibrationVersion {
  id              String   @id @default(cuid())
  assignmentId    String
  version         Int      @default(1)        // auto-incremented per assignment
  status          String   @default("active")  // active | archived
  createdBy       String                       // instructor code or "system"
  notes           String?                      // instructor notes on what changed
  createdAt       DateTime @default(now())

  assignment      Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  rubricItems     RubricItem[]
  auditSessions   AuditSession[]
  scoreSnapshots  ScoreSnapshot[]

  @@unique([assignmentId, version])
}

model AuditSession {
  id                    String    @id @default(cuid())
  textId                String
  studentCode           String
  calibrationVersionId  String
  startedAt             DateTime  @default(now())
  submittedAt           DateTime?
  frozen                Boolean   @default(false)  // true after submission

  text                  GeneratedText       @relation(fields: [textId], references: [id], onDelete: Cascade)
  calibrationVersion    CalibrationVersion   @relation(fields: [calibrationVersionId], references: [id])
  annotations           Annotation[]
  scoreSnapshots        ScoreSnapshot[]

  @@unique([textId, studentCode, calibrationVersionId])
}

model ScoreSnapshot {
  id                    String   @id @default(cuid())
  auditSessionId        String
  calibrationVersionId  String
  tier1Raw              Float    @default(0)
  tier2Deductions       Float    @default(0)
  tier3Bonus            Float    @default(0)
  coverageScore         Float    @default(0)
  compositeRaw          Float    @default(0)
  normalizedFinal       Float    @default(0)
  scoringMethod         String   @default("keyword_overlap_v1")  // track algorithm version
  createdAt             DateTime @default(now())

  auditSession          AuditSession       @relation(fields: [auditSessionId], references: [id], onDelete: Cascade)
  calibrationVersion    CalibrationVersion @relation(fields: [calibrationVersionId], references: [id])
  rubricMatches         RubricMatch[]
  professorReview       ProfessorReview?
}

model ProfessorReview {
  id                String    @id @default(cuid())
  scoreSnapshotId   String    @unique
  overrideScore     Float?
  notes             String?
  reviewedAt        DateTime  @default(now())
  releasedAt        DateTime?

  scoreSnapshot     ScoreSnapshot @relation(fields: [scoreSnapshotId], references: [id], onDelete: Cascade)
}

model FindingLibraryItem {
  id              String   @id @default(cuid())
  courseContext    String?              // e.g., "sociology", "political science"
  title           String
  description     String
  keywords        String               // JSON array of keywords
  severity        String               // critical / moderate / minor
  category        String               // e.g., "misattribution", "western_centric_framing"
  sourceType      String               // "recurring_ai_failure" | "instructor_expertise" | "promoted_student_finding"
  sourceId        String?              // original finding/annotation id if promoted
  usageCount      Int      @default(0) // how many calibrations have used this
  createdBy       String               // instructor code
  createdAt       DateTime @default(now())
}
```

### Modified models (changes from Phase 1)

```prisma
// RubricItem — add calibration version link, remove direct text link
model RubricItem {
  id                    String   @id @default(cuid())
  calibrationVersionId  String                // NEW: replaces implicit assignment-level grouping
  textId                String                // kept for location reference
  passSource            String
  severity              String
  category              String
  locationStart         Int
  locationEnd           Int
  description           String
  idealResponse         String?
  flaggedText           String?
  confirmed             Boolean  @default(true)
  sourceLibraryItemId   String?              // NEW: if seeded from library
  createdAt             DateTime @default(now())

  calibrationVersion    CalibrationVersion @relation(fields: [calibrationVersionId], references: [id], onDelete: Cascade)
  text                  GeneratedText      @relation(fields: [textId], references: [id], onDelete: Cascade)
  matches               RubricMatch[]
}

// Annotation — add audit session link, add frozen flag
model Annotation {
  id                String   @id @default(cuid())
  auditSessionId    String                   // NEW: replaces direct textId link
  textId            String                   // kept for convenience / backward compat
  type              String
  locationStart     Int
  locationEnd       Int
  selectedText      String
  note              String   @default("")
  frozen            Boolean  @default(false)  // NEW: set true on submission
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  auditSession      AuditSession  @relation(fields: [auditSessionId], references: [id], onDelete: Cascade)
  text              GeneratedText @relation(fields: [textId], references: [id], onDelete: Cascade)
  evidence          Evidence[]
  rubricMatches     RubricMatch[]
  beyondRubric      BeyondRubricFinding?
}

// RubricMatch — add score snapshot link
model RubricMatch {
  id                String   @id @default(cuid())
  scoreSnapshotId   String                   // NEW: ties match to specific scoring run
  annotationId      String
  rubricItemId      String
  matchConfidence   String
  matchQuality      Float    @default(0)
  createdAt         DateTime @default(now())

  scoreSnapshot     ScoreSnapshot @relation(fields: [scoreSnapshotId], references: [id], onDelete: Cascade)
  annotation        Annotation    @relation(fields: [annotationId], references: [id], onDelete: Cascade)
  rubricItem        RubricItem    @relation(fields: [rubricItemId], references: [id], onDelete: Cascade)
}

// BeyondRubricFinding — add promotion lifecycle fields
model BeyondRubricFinding {
  id                      String   @id @default(cuid())
  annotationId            String   @unique
  aiLegitimacyAssessment  String?
  aiQualityAssessment     String?
  professorConfirmed      Boolean?
  professorNotes          String?
  promotedToLibrary       Boolean  @default(false)   // NEW
  libraryItemId           String?                     // NEW: if promoted
  createdAt               DateTime @default(now())

  annotation              Annotation @relation(fields: [annotationId], references: [id], onDelete: Cascade)
}
```

### Models removed / replaced

| Phase 1 model | Phase 2 status |
|---|---|
| `Score` | Replaced by `ScoreSnapshot` (immutable, versioned) + `ProfessorReview` (separate record for overrides) |
| `CalibrationLog` | Kept as-is for audit trail, but calibration state now lives in `CalibrationVersion` |

---

## 3. Migration Strategy

Since Phase 1 uses SQLite and is in testing (not production), the migration approach is:

1. **Add new models first** (CalibrationVersion, AuditSession, ScoreSnapshot, ProfessorReview, FindingLibraryItem) — these are pure additions, no conflicts
2. **Add new columns to existing models** (Annotation.auditSessionId, Annotation.frozen, RubricItem.calibrationVersionId, etc.)
3. **Write a migration script** that:
   - Creates a CalibrationVersion v1 for each existing Assignment
   - Links existing RubricItems to their assignment's CalibrationVersion v1
   - Creates an AuditSession for each student who has annotations
   - Links existing Annotations to their AuditSession
   - Converts existing Score records to ScoreSnapshot + ProfessorReview records
4. **Run `prisma migrate dev`** to apply

This is a one-time migration for test data. If there's no test data worth preserving, a clean `prisma db push --force-reset` with the new schema is also acceptable.

---

## 4. Locale Additions

Add to `src/locale/he.ts`:

```typescript
// Add to existing locale object:

calibration: {
  versionLabel: 'גרסת כיול',
  currentVersion: 'גרסה נוכחית',
  archivedVersions: 'גרסאות קודמות',
  createNewVersion: 'צור גרסת כיול חדשה',
  versionNotes: 'הערות על השינויים...',
  compareVersions: 'השווה גרסאות',
  archiveWarning: 'גרסה קודמת תישמר אך לא תשמש לדירוג חדש.',
  findingsCount: 'ממצאים',
  versionHistory: 'היסטוריית כיול',
},

submission: {
  frozen: 'הוגש — לא ניתן לעריכה',
  frozenExplanation: 'הביקורת שלך הוגשה ואינה ניתנת עוד לעריכה. המרצה יבחן את עבודתך.',
  confirmSubmit: 'לאחר ההגשה לא ניתן יהיה לערוך הערות או ראיות. להמשיך?',
  submit: 'הגש ביקורת',
  submitted: 'הוגש',
  inProgress: 'בתהליך',
},

library: {
  title: 'ספריית ממצאים',
  description: 'ממצאים חוזרים שניתן לשלב בכיולים עתידיים',
  addToLibrary: 'הוסף לספרייה',
  useInCalibration: 'השתמש בכיול',
  source: 'מקור',
  sourceTypes: {
    recurring_ai_failure: 'כשל חוזר של AI',
    instructor_expertise: 'מומחיות מרצה',
    promoted_student_finding: 'ממצא סטודנט שאושר',
  },
  usageCount: 'שימושים',
  category: 'קטגוריה',
  keywords: 'מילות מפתח',
  promoteToLibrary: 'קדם לספרייה',
  promoted: 'הועבר לספרייה',
},

auditSession: {
  sessionInfo: 'מידע על סשן הביקורת',
  startedAt: 'התחיל',
  duration: 'משך',
  calibrationVersion: 'גרסת כיול',
},

scoring: {
  // Add to existing scoring section:
  snapshotInfo: 'תמונת ציון',
  scoredAgainst: 'נוקד מול גרסת כיול',
  rescoreAvailable: 'ניתן לנקד מחדש מול גרסת כיול חדשה',
  rescore: 'נקד מחדש',
  rescoreWarning: 'הניקוד המקורי יישמר. ייווצר ניקוד חדש מול הכיול העדכני.',
  previousScores: 'ניקודים קודמים',
  scoringMethod: 'שיטת ניקוד',
},
```

---

## 5. Build Order

Build in this sequence. Each task must be fully working before moving to the next. All Phase 1 functionality must continue working throughout — no regressions.

### Task P2-0: Schema Migration

```
Action:
  1. Update prisma/schema.prisma with all new and modified models from Section 2
  2. Write migration script (prisma/migrations/ or a standalone script)
     that backfills:
     - CalibrationVersion v1 for each existing Assignment
     - Links existing RubricItems to the new CalibrationVersion
     - Creates AuditSession records for existing student work
     - Links existing Annotations to AuditSessions
     - Converts Score → ScoreSnapshot + ProfessorReview
  3. Run prisma migrate dev
  4. Update src/lib/db.ts if needed (Prisma client regenerates automatically)
  5. Update seed.ts to create Phase 2 objects

Test: prisma studio shows all new tables. Existing Phase 1 data is
      correctly linked to new structures. All Phase 1 pages still load
      without errors.

Files: prisma/schema.prisma, prisma/seed.ts, migration script
```

### Task P2-1: Audit Session Lifecycle

```
Action:
  1. Update student workspace flow:
     - When a student first opens the workspace, create an AuditSession
       record (or retrieve existing one for this student + text + active calibration)
     - AuditSession.calibrationVersionId = assignment's active calibration version
     - All new annotations link to this AuditSession

  2. Add explicit "Submit Audit" action:
     - Replace the implicit "viewing report = submitted" from Phase 1
     - New button in workspace: "הגש ביקורת" (Submit Audit)
     - Confirmation dialog with he.submission.confirmSubmit text
     - On submit:
       a. Set AuditSession.submittedAt = now()
       b. Set AuditSession.frozen = true
       c. Set all linked Annotation.frozen = true
       d. Set all linked Evidence records as immutable (add frozen field)
     - After submission: workspace becomes read-only
       (annotations visible but not editable, no new annotations allowed)

  3. Update all annotation API routes to check frozen status:
     - PUT /api/annotations/[id] → 403 if annotation.frozen
     - DELETE /api/annotations/[id] → 403 if annotation.frozen
     - POST /api/annotations/[id]/evidence → 403 if parent annotation.frozen
     - POST /api/annotations (create new) → 403 if auditSession.frozen

  4. Update workspace UI:
     - If session is frozen: show banner with he.submission.frozenExplanation
     - Disable text selection (no new annotations)
     - Disable edit/delete on existing annotation cards
     - Show submission timestamp

  5. Update instructor submissions list:
     - Show "הוגש" / "בתהליך" status per student based on AuditSession.submittedAt

Test: Create annotations → submit → try to edit annotation via UI (blocked) →
      try to edit via API directly (403). Refresh page → still frozen.
      Instructor sees correct submission status.

Files: api/annotations/*, student/[assignmentId]/workspace/page.tsx,
       components/audit/AuditSidebar.tsx, components/audit/AnnotationCard.tsx,
       components/audit/DocumentViewer.tsx, lib/auth.ts (session helpers)
```

### Task P2-2: Calibration Versioning

```
Action:
  1. Update calibration flow:
     - When an assignment is first analyzed (Phase 1 Task 6),
       create CalibrationVersion v1 with status "active"
     - All RubricItems from automated analysis link to this version
     - Professor calibration actions (confirm/dismiss/flag) operate on
       the active version's items

  2. Add "Create New Calibration Version" action for instructor:
     - Available on the assignment page after initial calibration
     - Creates a new CalibrationVersion (version = previous + 1)
     - Copies all confirmed RubricItems from previous version to new version
       as new records (immutability — originals stay linked to old version)
     - Previous version status → "archived"
     - New version status → "active"
     - Assignment.activeCalibrationVersionId → new version's id

  3. Add calibration version indicator to instructor UI:
     - Show "גרסת כיול: v{N}" on assignment page
     - Show version history (collapsible list of archived versions
       with timestamps and notes)
     - When creating new version: text field for notes on what changed

  4. Update all scoring-related code to use calibrationVersionId:
     - Scoring engine reads RubricItems through the calibration version,
       not directly from the text
     - Score is always tied to a specific calibration version

  5. Update the calibration page to work with versions:
     - Always shows the active version's items
     - Can view (read-only) archived versions for reference

  6. Add field to Assignment model:
     - activeCalibrationVersionId: String?

Test: Analyze assignment → CalibrationVersion v1 created with rubric items.
      Calibrate → items confirmed/dismissed on v1. Create new version →
      v2 created with copied items, v1 archived. Modify v2 items →
      v1 items remain unchanged. Score a student → score links to v2.

Files: prisma/schema.prisma (Assignment field addition),
       api/assignments/[id]/calibrate/route.ts,
       api/assignments/[id]/analyze/route.ts,
       instructor/[assignmentId]/page.tsx,
       instructor/[assignmentId]/calibrate/page.tsx,
       lib/analysis.ts, lib/scoring.ts
```

### Task P2-3: Score Snapshots

```
Action:
  1. Replace Score model usage with ScoreSnapshot:
     - Scoring engine creates ScoreSnapshot records (immutable)
     - Each ScoreSnapshot links to an AuditSession + CalibrationVersion
     - Multiple snapshots can exist for the same audit session
       (one per scoring run / calibration version)

  2. Separate professor actions into ProfessorReview:
     - Override score, notes, release timestamp live here
     - Linked to a specific ScoreSnapshot
     - This means professor reviews a specific scoring result,
       not a mutable score record

  3. Update scoring API:
     - POST /api/scoring/[textId] → creates new ScoreSnapshot
       (never overwrites existing ones)
     - GET /api/scoring/[textId] → returns latest ScoreSnapshot
       + ProfessorReview if exists
     - GET /api/scoring/[textId]/history → returns all ScoreSnapshots
       for this text (for version comparison)
     - PUT /api/scoring/[textId]/review → creates/updates ProfessorReview
       on the latest ScoreSnapshot

  4. Add rescore capability:
     - If calibration version has changed since last scoring,
       show "ניתן לנקד מחדש" indicator on instructor submission view
     - "Rescore" button creates new ScoreSnapshot against current
       calibration version — old snapshot remains
     - Instructor can compare old vs new scores

  5. Update instructor per-student view:
     - Show which calibration version the score was computed against
     - Show scoring method version
     - If multiple snapshots exist, show history

  6. Track scoring algorithm version:
     - ScoreSnapshot.scoringMethod = "keyword_overlap_v1"
     - When we later switch to embeddings, this becomes "embedding_v1"
     - Allows comparison of scoring methods on the same data

Test: Score student → ScoreSnapshot created. Change calibration →
      rescore → new ScoreSnapshot created, old one still exists.
      Professor reviews latest → ProfessorReview created.
      API returns correct latest score. History endpoint returns both.

Files: lib/scoring.ts, lib/matching.ts,
       api/scoring/[textId]/route.ts (major refactor),
       instructor/[assignmentId]/submissions/[studentId]/page.tsx,
       components/instructor/ScoringBreakdown.tsx
```

### Task P2-4: Beyond-Rubric Promotion Lifecycle

```
Action:
  1. Extend BeyondRubricFinding with promotion lifecycle:
     - After professor confirms a beyond-rubric finding,
       show "קדם לספרייה" (Promote to Library) button
     - On promotion:
       a. Create FindingLibraryItem from the annotation data
       b. Set BeyondRubricFinding.promotedToLibrary = true
       c. Set BeyondRubricFinding.libraryItemId = new library item's id
       d. Extract keywords from annotation note + evidence
          (simple: split on spaces, filter stopwords, take top 5-8 significant words)

  2. Build the promotion UI:
     - On the instructor per-student review page (Tier 3 section)
     - After confirming a beyond-rubric finding, a new "Promote" button appears
     - Clicking opens a form pre-filled with:
       - Title (from annotation excerpt or auto-generated)
       - Description (from annotation note)
       - Keywords (auto-extracted, editable)
       - Severity (auto-suggested, editable)
       - Category (dropdown, from existing categories + "other")
       - Course context (from assignment)
     - Instructor can edit all fields before saving

  3. Build API route:
     - POST /api/library → create FindingLibraryItem
     - GET /api/library?courseContext=... → list library items, filterable
     - PUT /api/library/[id] → update (only usageCount and metadata)

Test: Student submits annotation not in rubric → instructor confirms as
      beyond-rubric → clicks promote → fills form → library item created.
      Library API returns the item. BeyondRubricFinding shows "הועבר לספרייה".

Files: api/library/route.ts, api/library/[id]/route.ts,
       instructor/[assignmentId]/submissions/[studentId]/page.tsx,
       components/instructor/ScoringBreakdown.tsx (Tier 3 section update)
```

### Task P2-5: Finding Library UI

```
Action:
  1. Build /instructor/library/page.tsx — the Finding Library view
     - Filterable list of all FindingLibraryItems
     - Filters: courseContext, category, severity, sourceType
     - Search by keywords
     - Each item shows: title, description, severity badge,
       category, source type, usage count, keywords as chips
     - Click to expand: full description, source annotation reference

  2. Add library seeding to calibration:
     - On the calibration page, add a "שלב מספרייה" (Import from Library)
       button
     - Opens a modal/panel showing library items
       filtered to relevant courseContext
     - Instructor selects items → they become RubricItems in the
       current calibration version
     - The RubricItem.sourceLibraryItemId is set
     - FindingLibraryItem.usageCount increments
     - Location (start/end) must be set manually by instructor
       (since library items are generic, not text-specific):
       show the text, let instructor highlight the relevant passage
       to set the location

  3. Add library link to instructor navigation:
     - In instructor dashboard, add "ספריית ממצאים" link
     - Show library item count badge

  4. Add "Add to Library" from calibration page:
     - During calibration, each rubric item card gets a small
       "הוסף לספרייה" action
     - Quick way to manually promote confirmed findings to the library
       without waiting for the student promotion lifecycle

Test: Create library items via promotion (P2-4) and manual add.
      Library page shows items with correct filters.
      Import library item into a new calibration → RubricItem created
      with sourceLibraryItemId. Usage count increments.

Files: instructor/library/page.tsx,
       instructor/[assignmentId]/calibrate/page.tsx (import UI),
       components/instructor/CalibrationViewer.tsx (add-to-library action),
       api/library/route.ts (update for seeding flow)
```

### Task P2-6: Research Export Foundation

```
Action:
  1. Build /api/export/[assignmentId]/route.ts
     - GET with query param: format=json
     - Returns anonymized dataset:
       a. Assignment metadata (title, prompt, model version — no instructor info)
       b. CalibrationVersion history (all versions with findings)
       c. Per-student audit sessions (anonymized student IDs):
          - Annotation count, types, coverage
          - Evidence count by type
          - Time spent (if tracked)
          - Score snapshots (all versions)
          - Matched finding IDs
          - Unmatched annotation IDs (with anonymous text)
       d. Aggregate statistics:
          - Most frequently caught findings
          - Most frequently missed findings
          - Beyond-rubric finding rate
          - Score distribution

  2. Anonymization rules:
     - Student codes → sequential anonymous IDs (student_001, student_002...)
     - Instructor code → removed entirely
     - Student names → removed
     - Annotation notes → included (they are analytical, not personal)
     - Evidence content → included with student names stripped if detected

  3. Add export button to instructor assignment page:
     - "ייצא נתוני מחקר" (Export Research Data)
     - Downloads JSON file

  4. This is a minimal export — no CSV, no PDF, no visualization.
     The JSON is structured enough that researchers can work with it.

Test: Complete a full assignment cycle → export → JSON contains all
      expected data. Student codes are anonymized. No instructor
      identifying info. All calibration versions present.
      All score snapshots present.

Files: api/export/[assignmentId]/route.ts,
       instructor/[assignmentId]/page.tsx (export button)
```

### Task P2-7: Integration Testing & Polish

```
Action:
  Run through the complete Phase 2 lifecycle:

  1. Instructor creates assignment → texts generated → analysis runs →
     CalibrationVersion v1 created automatically

  2. Instructor calibrates v1 → confirms/dismisses items →
     manually adds a finding → adds one item to library

  3. Release to students

  4. Student opens workspace → AuditSession created →
     completes audit → submits → workspace becomes read-only

  5. Instructor scores → ScoreSnapshot created against v1 →
     reviews per-student → confirms beyond-rubric finding →
     promotes to library

  6. Instructor creates CalibrationVersion v2 (adding a library item) →
     rescores one student → new ScoreSnapshot against v2 →
     compares old vs new scores

  7. Instructor reviews, overrides, releases grades

  8. Export research data → verify completeness

  Polish:
  - Frozen state indicators are visually clear (muted colors, lock icon)
  - Version indicators are unobtrusive but always visible
  - Library UI is minimal and functional (no over-design)
  - All new Hebrew strings are in locale file (zero hardcoded text)
  - All new UI uses CSS logical properties
  - Error handling on all new API routes
  - Loading states on version creation, rescoring, export

Files: Fixes across all files as needed
```

---

## 6. API Routes Summary (New & Modified)

| Route | Method | Purpose | Phase 2 change |
|---|---|---|---|
| `/api/assignments/[id]/analyze` | POST | Run baseline analysis | Now creates CalibrationVersion v1 |
| `/api/assignments/[id]/calibrate` | POST | Professor calibration actions | Now operates on active CalibrationVersion |
| `/api/assignments/[id]/calibrate/version` | POST | **NEW** — Create new calibration version |
| `/api/assignments/[id]/calibrate/version/[v]` | GET | **NEW** — Get specific version (read-only for archived) |
| `/api/annotations` | POST | Create annotation | Now links to AuditSession; blocked if frozen |
| `/api/annotations/[id]` | PUT, DELETE | Update/delete annotation | Blocked if frozen |
| `/api/annotations/[id]/evidence` | POST | Attach evidence | Blocked if frozen |
| `/api/audit-session` | POST | **NEW** — Create/retrieve audit session |
| `/api/audit-session/[id]/submit` | POST | **NEW** — Freeze audit session |
| `/api/scoring/[textId]` | POST | Run scoring | Now creates ScoreSnapshot (immutable) |
| `/api/scoring/[textId]` | GET | Get score | Returns latest ScoreSnapshot + ProfessorReview |
| `/api/scoring/[textId]/history` | GET | **NEW** — All score snapshots for a text |
| `/api/scoring/[textId]/review` | PUT | Professor override | Now creates ProfessorReview record |
| `/api/library` | GET, POST | **NEW** — Finding library CRUD |
| `/api/library/[id]` | GET, PUT | **NEW** — Single library item |
| `/api/export/[assignmentId]` | GET | **NEW** — Research data export |

---

## 7. Key Implementation Notes

### Backward Compatibility

Phase 2 must not break Phase 1 workflows. If Claude Code has built Phase 1 with working routes that use the `Score` model, the migration should:
1. Keep the old routes working during migration
2. Update them one by one to use the new models
3. Remove deprecated routes only after all references are updated

### Immutability Enforcement

Frozen state must be enforced at the **API layer**, not just the UI. A determined student could call the API directly. Every mutation endpoint for annotations and evidence must check:

```typescript
// In every annotation/evidence mutation route:
const session = await getAuditSession(annotationId);
if (session.frozen) {
  return NextResponse.json(
    { error: 'Audit submitted — modifications not allowed' },
    { status: 403 }
  );
}
```

### CalibrationVersion Creation Flow

Creating a new calibration version is a copy operation:

```typescript
async function createNewCalibrationVersion(assignmentId: string, notes: string) {
  const current = await getCurrentCalibrationVersion(assignmentId);

  // Archive current
  await prisma.calibrationVersion.update({
    where: { id: current.id },
    data: { status: 'archived' },
  });

  // Create new version
  const newVersion = await prisma.calibrationVersion.create({
    data: {
      assignmentId,
      version: current.version + 1,
      status: 'active',
      createdBy: /* instructor code from session */,
      notes,
    },
  });

  // Copy confirmed rubric items (as new records)
  const confirmedItems = await prisma.rubricItem.findMany({
    where: { calibrationVersionId: current.id, confirmed: true },
  });

  for (const item of confirmedItems) {
    await prisma.rubricItem.create({
      data: {
        calibrationVersionId: newVersion.id,
        textId: item.textId,
        passSource: item.passSource,
        severity: item.severity,
        category: item.category,
        locationStart: item.locationStart,
        locationEnd: item.locationEnd,
        description: item.description,
        idealResponse: item.idealResponse,
        flaggedText: item.flaggedText,
        confirmed: true,
        sourceLibraryItemId: item.sourceLibraryItemId,
      },
    });
  }

  // Update assignment pointer
  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { activeCalibrationVersionId: newVersion.id },
  });

  return newVersion;
}
```

### Library Item Keyword Extraction

For MVP, keyword extraction from annotations is simple:

```typescript
function extractKeywords(text: string, maxKeywords = 8): string[] {
  const stopwords = new Set([
    'של', 'את', 'על', 'עם', 'הוא', 'היא', 'זה', 'לא', 'כי', 'אם',
    'גם', 'אבל', 'או', 'אני', 'הם', 'היה', 'היו', 'יש', 'אין', 'כל',
    'the', 'a', 'an', 'is', 'are', 'was', 'in', 'on', 'at', 'to', 'for',
    'of', 'and', 'but', 'or', 'not', 'this', 'that', 'with',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\sא-ת]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w))
    .reduce((acc, word) => {
      acc.set(word, (acc.get(word) || 0) + 1);
      return acc;
    }, new Map<string, number>())
    .entries()
    .toArray()
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}
```

---

## 8. Acceptance Criteria

Phase 2 is complete when all of the following pass:

### Immutability & Persistence
- [ ] Student annotations become immutable after submission (API enforced, not just UI)
- [ ] Score snapshots are never overwritten — rescoring creates new records
- [ ] Calibration versions are never overwritten — new version copies and archives
- [ ] RubricMatch records are tied to specific ScoreSnapshots
- [ ] All Phase 1 functionality continues to work

### Calibration Versioning
- [ ] Automated analysis creates CalibrationVersion v1 automatically
- [ ] Instructor can create new calibration version with notes
- [ ] Old version is archived with all its rubric items intact
- [ ] New version copies confirmed items as new records
- [ ] Student scores reference the calibration version they were scored against
- [ ] Can view archived versions (read-only)

### Audit Session
- [ ] AuditSession created when student opens workspace
- [ ] AuditSession records calibration version at time of creation
- [ ] Explicit submit action freezes all annotations + evidence
- [ ] Workspace becomes read-only after submission with clear indicator
- [ ] Submission timestamp visible to instructor

### Score Snapshots
- [ ] Scoring creates immutable ScoreSnapshot
- [ ] Professor override is a separate ProfessorReview record
- [ ] Rescore against new calibration creates new snapshot
- [ ] Score history accessible for comparison
- [ ] Scoring method version tracked

### Finding Library
- [ ] Beyond-rubric findings can be promoted to library
- [ ] Library items searchable and filterable
- [ ] Library items can be imported into new calibration versions
- [ ] Usage count tracks how many calibrations use each item
- [ ] Items can be added to library directly from calibration page

### Research Export
- [ ] Export produces complete anonymized JSON
- [ ] All calibration versions included
- [ ] All score snapshots included
- [ ] Student data properly anonymized
- [ ] Export downloadable from instructor interface

### Technical
- [ ] All new Hebrew strings in locale file
- [ ] All new CSS uses logical properties
- [ ] All new colors use CSS custom properties from tokens
- [ ] API-level enforcement of immutability (not just UI)
- [ ] No regressions in Phase 1 functionality

---

## 9. What This Enables (Phase 3+)

With Phase 2's persistence infrastructure in place, the following become possible without further architectural changes:

- **Cross-semester comparison**: Same assignment, different cohorts, compare audit quality over time
- **Calibration quality tracking**: How much do professor overrides change scores? Is the automated analysis improving?
- **Systematic blind spots**: Which findings do students consistently miss? Which annotation types are underused?
- **Model improvement data**: Instructor-verified findings become training signal for better automated analysis
- **Student growth trajectories**: Track individual students across multiple assignments within a course
- **Discipline-specific finding libraries**: Over time, the library accumulates patterns specific to sociology, political science, literature, etc.
- **Difficulty normalization**: Use calibration version history to normalize difficulty across assignments

None of these require schema changes. They require only queries, aggregation, and visualization — which is Phase 3's scope.

---

## 10. DEVLOG Entry (for session record)

When this plan is finalized, add to DEVLOG.md:

```markdown
## 2026-02-22 — Session 2: Phase 2 architecture

### Entry 1: From grading tool to epistemic infrastructure

Phase 1 builds an audit tool that works for one assignment cycle.
Phase 2 makes it durable: calibration is versioned, submissions are
frozen, scores are snapshotted, and findings compound across assignments.

Key additions:
- CalibrationVersion model (versioned, immutable ground truth)
- AuditSession model (explicit first-class audit wrapper)
- ScoreSnapshot model (immutable scoring results, separated from professor reviews)
- FindingLibraryItem model (reusable findings across assignments)
- Submission freeze (API-enforced immutability after student submits)
- Research export endpoint (anonymized JSON for academic publication)

Design principle: the audit is the primary assessment unit, the finding
is the primary epistemic unit, the calibration version is the primary
fairness unit. Phase 2 gives each its own lifecycle.

Influenced by an architectural review focused on persistence and
long-term epistemic value. Key insight: if persistence is correct now,
cross-semester analytics, cohort analysis, and model improvement
become queries — not architectural changes.
```
