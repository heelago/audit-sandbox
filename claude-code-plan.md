# AI Audit Sandbox — Claude Code Implementation Plan

## MVP Build — Hebrew RTL First

**Reference document:** `audit-sandbox-spec.md` (full system architecture & design system)
**Primary language:** Hebrew (RTL), with English locale structure ready for future addition
**Target:** Deployable MVP that an instructor can use with a small class (5-15 students) for testing

---

## 1. MVP Scope

### What we're building

A full-stack web application where:

1. **Instructor** creates an assignment by writing a prompt
2. **System** generates AI text per student using the Anthropic API
3. **System** runs automated baseline analysis passes, producing a hidden rubric per text
4. **Instructor** reviews 2-3 sample texts, can confirm/flag issues (lightweight calibration)
5. **Student** receives their AI-generated text and audits it — annotating, attaching evidence, reflecting
6. **System** scores the audit against the hidden rubric (3-tier model)
7. **Instructor** reviews scored submissions, can override, releases grades

### What we're deferring (post-MVP)

- Professor observation → automated pass conversion (Section 4.4 of spec — calibration runs manual flags only, doesn't auto-convert to new passes)
- Difficulty normalization in scoring (all texts scored against their own rubric, no cross-text normalization)
- Aggregate analytics / multi-assignment tracking
- Dark mode
- Mobile responsive layout (desktop-first for MVP)
- English locale (structure ready, strings not translated)
- Research export
- Beyond-rubric AI pre-assessment (professor manually confirms/rejects in MVP)

---

## 2. Tech Stack

```
Frontend:       Next.js 14+ (App Router)
Language:       TypeScript
Styling:        CSS Modules (one module per component, all tokens from shared constants)
Database:       SQLite via Prisma ORM (file-based, zero config, portable)
Auth:           Simple password-based sessions (no OAuth for MVP — instructor code + student code per assignment)
AI:             Anthropic API (Claude Sonnet for generation + baseline passes)
Deployment:     Local dev server for testing, Vercel-ready structure
```

### Why these choices

- **Next.js App Router**: Server components for data loading, API routes for backend, single deployable unit
- **SQLite + Prisma**: No database server to configure. The `.db` file lives in the project. Prisma gives us typed queries and easy migration to PostgreSQL later
- **CSS Modules over inline styles**: The prototype used inline styles for artifact constraints. A real build needs maintainable, debuggable CSS with RTL support via `direction` and logical properties (`margin-inline-start` instead of `margin-right`)
- **Simple auth over OAuth**: For testing with 5-15 students, we need minimal friction. Instructor creates assignment → gets an instructor code and a set of student codes. No signup, no email verification.

---

## 3. Project Structure

```
audit-sandbox/
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── seed.ts                    # Seed data for development
│   └── dev.db                     # SQLite database (gitignored)
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout (RTL, fonts, global styles)
│   │   ├── page.tsx               # Landing / entry page
│   │   ├── globals.css            # CSS reset, font imports, CSS variables
│   │   │
│   │   ├── instructor/
│   │   │   ├── layout.tsx         # Instructor auth wrapper
│   │   │   ├── page.tsx           # Instructor dashboard (assignment list)
│   │   │   ├── create/
│   │   │   │   └── page.tsx       # Create assignment + prompt
│   │   │   ├── [assignmentId]/
│   │   │   │   ├── page.tsx       # Assignment overview (status, stats)
│   │   │   │   ├── calibrate/
│   │   │   │   │   └── page.tsx   # Calibration interface (sample review)
│   │   │   │   ├── submissions/
│   │   │   │   │   ├── page.tsx   # All submissions overview
│   │   │   │   │   └── [studentId]/
│   │   │   │   │       └── page.tsx  # Per-student scored view
│   │   │   │   └── rubric/
│   │   │   │       └── page.tsx   # Hidden rubric viewer (debug/review)
│   │   │
│   │   ├── student/
│   │   │   ├── layout.tsx         # Student auth wrapper
│   │   │   ├── page.tsx           # Student landing (enter code)
│   │   │   ├── [assignmentId]/
│   │   │   │   ├── page.tsx       # Assignment intro (prompt, instructions)
│   │   │   │   ├── workspace/
│   │   │   │   │   └── page.tsx   # Main audit workspace
│   │   │   │   └── report/
│   │   │   │       └── page.tsx   # Student's own audit report
│   │   │
│   │   └── api/
│   │       ├── assignments/
│   │       │   ├── route.ts                  # POST create, GET list
│   │       │   └── [id]/
│   │       │       ├── route.ts              # GET details, PATCH update
│   │       │       ├── generate/route.ts     # POST trigger text generation
│   │       │       ├── analyze/route.ts      # POST trigger baseline analysis
│   │       │       ├── calibrate/route.ts    # POST professor calibration actions
│   │       │       └── release/route.ts      # POST release to students / grades
│   │       ├── texts/
│   │       │   └── [id]/
│   │       │       ├── route.ts              # GET text content
│   │       │       └── rubric/route.ts       # GET hidden rubric (instructor only)
│   │       ├── annotations/
│   │       │   ├── route.ts                  # POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts              # PUT update, DELETE remove
│   │       │       └── evidence/route.ts     # POST attach evidence
│   │       ├── scoring/
│   │       │   └── [textId]/
│   │       │       └── route.ts              # POST run scoring, GET results
│   │       └── auth/
│   │           └── route.ts                  # POST verify code, manage session
│   │
│   ├── components/
│   │   ├── ui/                    # Generic UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   ├── Badge.tsx
│   │   │   ├── Badge.module.css
│   │   │   ├── Card.tsx
│   │   │   ├── Card.module.css
│   │   │   ├── Tabs.tsx
│   │   │   ├── Tabs.module.css
│   │   │   ├── Input.tsx
│   │   │   ├── Input.module.css
│   │   │   ├── Textarea.tsx
│   │   │   └── StatCard.tsx
│   │   │
│   │   ├── audit/                 # Audit workspace components
│   │   │   ├── DocumentViewer.tsx         # Annotatable text renderer
│   │   │   ├── DocumentViewer.module.css
│   │   │   ├── AnnotationCard.tsx         # Sidebar annotation panel
│   │   │   ├── AnnotationCard.module.css
│   │   │   ├── SelectionToolbar.tsx       # Tag-type selector on text selection
│   │   │   ├── EvidenceForm.tsx           # Evidence attachment form
│   │   │   ├── GuidedPrompts.tsx          # Context-specific reflection prompts
│   │   │   ├── AuditSidebar.tsx           # Sidebar container (tabs: audit/prompt/guide)
│   │   │   ├── AuditSidebar.module.css
│   │   │   ├── CoverageBar.tsx            # Visual text coverage indicator
│   │   │   └── AuthorshipBanner.tsx       # "Written by AI" banner
│   │   │
│   │   ├── instructor/            # Instructor-specific components
│   │   │   ├── CalibrationViewer.tsx      # Side-by-side text + findings
│   │   │   ├── SubmissionCard.tsx         # Student submission summary card
│   │   │   ├── ScoringBreakdown.tsx       # 3-tier score display
│   │   │   ├── RubricItemCard.tsx         # Individual rubric item display
│   │   │   └── AssignmentStatusBar.tsx    # Assignment lifecycle status
│   │   │
│   │   ├── report/                # Report components
│   │   │   ├── StudentReport.tsx          # Full student-facing report
│   │   │   ├── InstructorReport.tsx       # Per-student instructor view
│   │   │   └── AnnotationBreakdown.tsx    # Type distribution visualization
│   │   │
│   │   └── icons/
│   │       └── index.tsx          # All SVG icon components (single file)
│   │
│   ├── lib/
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── anthropic.ts           # Anthropic API client + helpers
│   │   ├── generation.ts          # Text generation logic
│   │   ├── analysis.ts            # Baseline analysis passes (6 passes)
│   │   ├── scoring.ts             # 3-tier scoring engine
│   │   ├── matching.ts            # Annotation ↔ rubric matching algorithm
│   │   ├── auth.ts                # Session management (cookies)
│   │   └── utils.ts               # General utilities
│   │
│   ├── locale/
│   │   ├── he.ts                  # Hebrew strings (all UI text)
│   │   └── types.ts               # Locale type definitions
│   │
│   └── styles/
│       ├── tokens.ts              # Color, font, spacing constants (exported JS)
│       └── tokens.css             # CSS custom properties (mirrors tokens.ts)
│
├── .env.local                     # ANTHROPIC_API_KEY, SESSION_SECRET
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

---

## 4. Design Tokens

Reference: `audit-sandbox-spec.md` Section 12

These are defined twice — as TypeScript constants (for any JS logic that needs colors) and as CSS custom properties (for stylesheets).

### `src/styles/tokens.ts`

```typescript
export const colors = {
  bg: '#F3F1EC',
  card: '#FAFAF6',
  cardHover: '#F7F6F1',
  border: '#DDD9CE',
  borderLight: '#E8E4DA',
  ink: '#2C2924',
  inkSoft: '#5E574B',
  inkFaint: '#9E9688',
  accent: '#8B5E3C',
  accentSoft: '#8B5E3C18',

  // annotation types
  error: '#B54D4D',
  errorSoft: '#B54D4D14',
  success: '#4D8B6A',
  successSoft: '#4D8B6A14',
  warn: '#A68A2B',
  warnSoft: '#A68A2B14',
  gap: '#9B6B42',
  gapSoft: '#9B6B4214',
  info: '#4A6F8B',
  infoSoft: '#4A6F8B14',
  neutral: '#7A7568',
  neutralSoft: '#7A756814',
} as const;

export const fonts = {
  display: "'Heebo', 'Rubik', 'Arial Hebrew', sans-serif",
  body: "'Heebo', 'Rubik', 'Arial Hebrew', sans-serif",
} as const;

export const spacing = {
  xs: '4px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  xxl: '32px',
} as const;
```

### `src/styles/tokens.css`

```css
:root {
  --bg: #F3F1EC;
  --card: #FAFAF6;
  --card-hover: #F7F6F1;
  --border: #DDD9CE;
  --border-light: #E8E4DA;
  --ink: #2C2924;
  --ink-soft: #5E574B;
  --ink-faint: #9E9688;
  --accent: #8B5E3C;
  --accent-soft: #8B5E3C18;

  --error: #B54D4D;
  --success: #4D8B6A;
  --warn: #A68A2B;
  --gap: #9B6B42;
  --info: #4A6F8B;
  --neutral: #7A7568;

  --font-display: 'Heebo', 'Rubik', 'Arial Hebrew', sans-serif;
  --font-body: 'Heebo', 'Rubik', 'Arial Hebrew', sans-serif;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-pill: 20px;
}
```

---

## 5. Database Schema

### `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Assignment {
  id                String   @id @default(cuid())
  title             String
  promptText        String
  courseContext      String?              // e.g. "SOC 101 — מבוא לסוציולוגיה"
  requirements      String?              // structural expectations
  knownPitfalls     String?              // instructor's AI failure notes
  modelVersion      String   @default("claude-sonnet-4-20250514")
  status            String   @default("draft")
                    // draft → generating → analyzing → calibrating → active → grading → closed
  instructorCode    String   @unique      // access code for instructor
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  texts             GeneratedText[]
  calibrationLogs   CalibrationLog[]
}

model GeneratedText {
  id                String   @id @default(cuid())
  assignmentId      String
  studentCode       String                // unique access code for this student
  studentName       String?               // optional display name
  textContent       String
  wordCount         Int
  generationMeta    String?               // JSON: model, timestamp, tokens
  difficultyRating  Float?                // set after analysis
  rawQualityScore   Float?                // set after analysis
  status            String   @default("generated")
                    // generated → analyzed → assigned → submitted → scored
  createdAt         DateTime @default(now())

  assignment        Assignment  @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  rubricItems       RubricItem[]
  annotations       Annotation[]
  score             Score?

  @@unique([assignmentId, studentCode])
}

model RubricItem {
  id                String   @id @default(cuid())
  textId            String
  passSource        String               // factual / citation / structural / disciplinary / gap / composite / professor
  severity          String               // critical / moderate / minor
  category          String               // e.g. "unverifiable_statistic", "misattribution", "missing_perspective"
  locationStart     Int
  locationEnd       Int
  description       String               // what the issue is
  idealResponse     String?              // what a good student would say
  flaggedText       String?              // the actual text span
  confirmed         Boolean  @default(true)  // professor can dismiss during calibration
  createdAt         DateTime @default(now())

  text              GeneratedText @relation(fields: [textId], references: [id], onDelete: Cascade)
  matches           RubricMatch[]
}

model CalibrationLog {
  id                String   @id @default(cuid())
  assignmentId      String
  action            String               // confirm / dismiss / modify / flag_new
  rubricItemId      String?
  notes             String?
  createdAt         DateTime @default(now())

  assignment        Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
}

model Annotation {
  id                String   @id @default(cuid())
  textId            String
  type              String               // error / verified / alternative / gap / nuance / accepted
  locationStart     Int
  locationEnd       Int
  selectedText      String
  note              String   @default("")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  text              GeneratedText @relation(fields: [textId], references: [id], onDelete: Cascade)
  evidence          Evidence[]
  rubricMatches     RubricMatch[]
  beyondRubric      BeyondRubricFinding?
}

model Evidence {
  id                String   @id @default(cuid())
  annotationId      String
  type              String               // conversation / source / note
  content           String
  createdAt         DateTime @default(now())

  annotation        Annotation @relation(fields: [annotationId], references: [id], onDelete: Cascade)
}

model Score {
  id                String   @id @default(cuid())
  textId            String   @unique
  tier1Raw          Float    @default(0)
  tier2Deductions   Float    @default(0)
  tier3Bonus        Float    @default(0)
  coverageScore     Float    @default(0)
  compositeRaw      Float    @default(0)
  normalizedFinal   Float    @default(0)
  professorAdjusted Boolean  @default(false)
  professorOverride Float?
  professorNotes    String?
  releasedAt        DateTime?
  createdAt         DateTime @default(now())

  text              GeneratedText @relation(fields: [textId], references: [id], onDelete: Cascade)
}

model RubricMatch {
  id                String   @id @default(cuid())
  annotationId      String
  rubricItemId      String
  matchConfidence   String               // high / medium / low
  matchQuality      Float    @default(0) // 0-10
  createdAt         DateTime @default(now())

  annotation        Annotation @relation(fields: [annotationId], references: [id], onDelete: Cascade)
  rubricItem        RubricItem @relation(fields: [rubricItemId], references: [id], onDelete: Cascade)
}

model BeyondRubricFinding {
  id                    String   @id @default(cuid())
  annotationId          String   @unique
  aiLegitimacyAssessment String?   // JSON from AI assessment
  aiQualityAssessment    String?
  professorConfirmed     Boolean?
  professorNotes         String?
  createdAt              DateTime @default(now())

  annotation             Annotation @relation(fields: [annotationId], references: [id], onDelete: Cascade)
}
```

---

## 6. Hebrew Locale

### `src/locale/he.ts`

All user-facing strings live here. This is the single source of truth for Hebrew text. The locale file should contain ALL labels, messages, placeholders, guided prompts, error messages, and status text. No Hebrew strings hardcoded in components.

```typescript
export const he = {
  app: {
    name: 'סביבת ביקורת AI',
    tagline: 'המטלה נכתבה על ידי בינה מלאכותית. התפקיד שלך — לבקר אותה.',
    description: 'קראו בביקורתיות. מצאו שגיאות. אמתו טענות. הציעו חלופות. הראו את החשיבה שה-AI לא מסוגל לה — הביקורת שלכם היא המטלה.',
  },

  auth: {
    enterCode: 'הזן קוד גישה',
    codePlaceholder: 'הקלד/י את הקוד שקיבלת...',
    enter: 'כניסה',
    invalidCode: 'קוד שגוי. נסה שנית.',
    instructorLogin: 'כניסת מרצה',
    studentLogin: 'כניסת סטודנט/ית',
  },

  annotationTypes: {
    error:       { label: 'אי-דיוק',              desc: 'שגיאה עובדתית, מושגית או לוגית של הבינה המלאכותית' },
    verified:    { label: 'אומת כמדויק',           desc: 'טענה שבדקת באופן עצמאי ואישרת את נכונותה' },
    alternative: { label: 'חלופה עדיפה',           desc: 'גישה, מסגור או מקור טובים יותר שידועים לך' },
    gap:         { label: 'רכיב חסר',              desc: 'משהו חשוב שהבינה המלאכותית השמיטה לחלוטין' },
    nuance:      { label: 'ניואנס דיסציפלינרי',     desc: 'תובנה מקצועית שהבינה המלאכותית החמיצה או שיטחה' },
    accepted:    { label: 'אושר — עם נימוק',       desc: 'הושאר כפי שהוא במכוון — נמק את שיקוליך' },
  },

  evidenceTypes: {
    conversation: { label: 'שיחה עם AI',    placeholder: 'הדבק את החלק הרלוונטי מהשיחה — מה שאלת, מה קיבלת, מה החלטת...' },
    source:       { label: 'מקור / אימות',   placeholder: 'כתובת URL, שם מאמר ומחבר/ת, מאגר מידע, או תיאור דרך האימות...' },
    note:         { label: 'הערת תהליך',     placeholder: 'השיקולים שלך — למה זה חשוב, מה שמת לב אליו, איך הגעת להחלטה...' },
  },

  guidedPrompts: {
    error:       ['מה בדיוק שגוי כאן?', 'איך גילית את השגיאה?', 'מהו המידע הנכון?'],
    verified:    ['מול איזה מקור בדקת?', 'מצאת אי-התאמות?', 'עד כמה המקור שלך סמכותי?'],
    alternative: ['מה היית מציע/ה במקום?', 'למה החלופה שלך עדיפה?', 'האם ה-AI היה יכול לדעת את זה?'],
    gap:         ['מה חסר ולמה זה חשוב?', 'איך הפער משפיע על הטיעון?', 'היכן היית מוסיף/ה את זה?'],
    nuance:      ['מה הידע המקצועי חושף כאן?', 'איך זה משטח את המציאות?', 'מה מומחה/ית היה/ה שם/ה לב אליו?'],
    accepted:    ['למה זה מספק כמות שהוא?', 'האם אימתת לפני שקיבלת?', 'מה נותן לך ביטחון לשמור את זה?'],
  },

  workspace: {
    aiAuthoredBadge: 'נכתב על ידי AI',
    aiAuthoredMessage: 'טקסט זה נוצר על ידי בינה מלאכותית מפרומפט אחיד. המטלה שלך: בקר אותו בביקורתיות.',
    tagAs: 'תייג כ:',
    selectHint: 'סמנו קטע טקסט כלשהו למטה כדי להתחיל את הביקורת',
    annotations: 'הערות',
    covered: 'כוסה',
    generateReport: 'צור דוח',
    writeAnalysis: 'כתוב את הניתוח שלך...',
    attachEvidence: 'צרף ראיה',
    add: 'הוסף',
    cancel: 'ביטול',
    emptyState: 'סמנו טקסט במסמך כדי ליצור את ההערה הראשונה.',
    emptyStateHint: 'כל קטע שלא תבקרו הוא טקסט שלא נבדק — וזה נלקח בחשבון.',
  },

  sidebar: {
    auditTab: 'ביקורת',
    promptTab: 'פרומפט',
    guideTab: 'מדריך',
    promptTitle: 'פרומפט המטלה',
    promptReadOnly: 'פרומפט זה אינו ניתן לעריכה כרגע. אנו בוחנים אפשרויות להתאמה אישית בגרסאות עתידיות.',
    promptVariance: 'כל הסטודנטים מקבלים את אותו פרומפט. הטקסט שנוצר עשוי להשתנות — כולם מיוצרים על ידי אותו מודל.',
    promptScoring: 'הציון שלך מבוסס על איכות המעורבות הביקורתית, לא על הטקסט הספציפי שקיבלת.',
    aboutPrompt: 'אודות הפרומפט',
    guideTitle: 'איך הביקורת עובדת',
    guideIntro: 'הביקורת שלך היא המטלה. ה-AI כתב את הטקסט — התפקיד שלך לבחון אותו כעורך/ת ביקורתי/ת. כל מה שתמצא (וכל מה שתחמיץ) משפיע על הציון.',
    annotationTypesTitle: 'סוגי הערות',
    scoringTitle: 'מדדי ציון',
    tipsTitle: 'טיפים',
    tips: [
      'בדקו כל נתון סטטיסטי ואזכור מקור מול מקורות אמיתיים',
      'חפשו מסגור מערבי-צנטרי שמוצג כאוניברסלי',
      'שימו לב מתי ה-AI מפשט יתר על המידה מנגנונים סיבתיים',
      'חשבו אילו פרספקטיבות או תיאוריות נעדרות',
      'ודאו שמחברים מצוטטים באמת טענו את מה שהטקסט מייחס להם',
    ],
  },

  scoring: {
    pointsFor: {
      errorsFound: 'נקודות על שגיאות שנמצאו עם ראיות',
      verified: 'נקודות על טענות שאומתו כראוי',
      alternatives: 'נקודות על חלופות חזקות שהוצעו',
      gaps: 'נקודות על זיהוי רכיבים חסרים',
      nuance: 'נקודות על תובנות דיסציפלינריות',
    },
    pointsAgainst: {
      unverified: 'נקודות על טענות לא מדויקות שנותרו ללא אימות',
      missed: 'נקודות על שגיאות שהוחמצו',
      unsupported: 'נקודות על תיוגי "אושר" ללא נימוק',
    },
  },

  report: {
    title: 'דוח ביקורת',
    backToWorkspace: 'חזרה לסביבת העבודה',
    stats: {
      annotations: 'הערות',
      coverage: 'כיסוי טקסט',
      unchecked: 'לא נבדק',
      evidence: 'ראיות',
      reflections: 'רפלקציות',
    },
    breakdown: 'פילוח הערות',
    instructorAssessment: 'הערכת מרצה',
    instructorAssessmentDesc: 'ניתוח באמצעות AI של איכות הביקורת',
    generateAssessment: 'צור הערכה',
    generating: 'מייצר...',
  },

  instructor: {
    dashboard: 'לוח בקרה',
    createAssignment: 'מטלה חדשה',
    assignmentTitle: 'כותרת המטלה',
    prompt: 'פרומפט',
    promptPlaceholder: 'כתוב את הפרומפט שממנו ייווצר הטקסט...',
    courseContext: 'הקשר קורס',
    courseContextPlaceholder: 'למשל: מבוא לסוציולוגיה, שנה א\'...',
    requirements: 'דרישות',
    requirementsPlaceholder: 'אורך, מספר מקורות, מבנה צפוי...',
    knownPitfalls: 'בעיות ידועות של AI בתחום',
    knownPitfallsPlaceholder: 'תחומים שבהם ידוע לך ש-AI נוטה לטעות...',
    studentCount: 'מספר סטודנטים',
    create: 'צור מטלה',
    generate: 'ייצר טקסטים',
    analyze: 'הרץ ניתוח בסיסי',
    calibrate: 'כייל מטלה',
    releaseToStudents: 'שחרר לסטודנטים',
    submissions: 'הגשות',
    scoreAll: 'דרג הכל',
    releaseGrades: 'שחרר ציונים',
    status: {
      draft: 'טיוטה',
      generating: 'מייצר טקסטים...',
      analyzing: 'מנתח...',
      calibrating: 'בכיול',
      active: 'פעיל — סטודנטים עובדים',
      grading: 'בדירוג',
      closed: 'סגור',
    },
    calibration: {
      title: 'כיול מטלה',
      description: 'עיינו בטקסטים לדוגמה ובממצאים האוטומטיים. אשרו, דחו או הוסיפו ממצאים.',
      confirm: 'אשר',
      dismiss: 'דחה',
      modify: 'ערוך',
      flagNew: 'סמן ממצא חדש',
      flagNewPlaceholder: 'תאר את מה שמצאת...',
      approved: 'כיול אושר',
    },
    scoring: {
      tier1: 'התאמות מול רובריקה',
      tier2: 'החמצות',
      tier3: 'מעבר לרובריקה',
      coverage: 'כיסוי',
      composite: 'ציון משוקלל',
      override: 'עדכן ציון',
      overridePlaceholder: 'נמק את השינוי...',
      confirmBeyond: 'אשר ממצא',
      rejectBeyond: 'דחה ממצא',
    },
  },

  landing: {
    readOnly: 'קריאה בלבד',
    assignmentPrompt: 'פרומפט המטלה',
    promptNote: 'פרומפט זה אינו ניתן לעריכה כרגע. אנו בוחנים אפשרויות להתאמה אישית בגרסאות עתידיות. כל הסטודנטים מקבלים את אותו פרומפט. הטקסט שנוצר עשוי להשתנות — כולם מיוצרים על ידי אותו מודל.',
    assignmentTitle: 'כותרת המטלה',
    aiGeneratedText: 'הטקסט שנוצר על ידי AI',
    aiAuthored: 'נכתב על ידי AI',
    wordCount: 'מילים',
    textNote: 'נוצר מהפרומפט שלמעלה — התפקיד שלך: מצא מה שגוי, אמת מה שנכון, השלם מה שחסר',
    beginAudit: 'התחל ביקורת',
    steps: [
      { title: 'קרא ובחר', desc: 'סמן קטעים לבחינה' },
      { title: 'תייג וסווג', desc: 'שגיאה, אומת, חסר, חלופה...' },
      { title: 'נמק והוכח', desc: 'הסבר שיקולים, צרף ראיות' },
      { title: 'הגש דוח', desc: 'הביקורת שלך היא הציון' },
    ],
  },
} as const;
```

---

## 7. Build Order

Build in this exact sequence. Each task should be fully working before moving to the next. Test after every task.

### Task 0: Project Setup

```
Action:
  1. npx create-next-app@latest audit-sandbox --typescript --app --src-dir
  2. npm install prisma @prisma/client
  3. npm install @anthropic-ai/sdk
  4. npx prisma init --datasource-provider sqlite
  5. Set up project structure (create all directories)
  6. Create tokens.ts, tokens.css, locale/he.ts, icons/index.tsx
  7. Configure globals.css: import Heebo from Google Fonts via @import,
     set html { direction: rtl; }, apply CSS variables from tokens.css
  8. Create root layout.tsx with RTL, Heebo font, metadata

Test: `npm run dev` serves a blank page with correct RTL direction and Heebo font

Files: All config files + empty directory structure
```

### Task 1: Database + Prisma Setup

```
Action:
  1. Copy schema.prisma from Section 5 above
  2. npx prisma db push (creates SQLite database)
  3. Create src/lib/db.ts (Prisma client singleton)
  4. Create seed.ts with one sample assignment + one generated text
  5. npx prisma db seed

Test: npx prisma studio shows tables with seed data

Files: prisma/schema.prisma, prisma/seed.ts, src/lib/db.ts
```

### Task 2: UI Component Library

```
Action:
  Build all generic UI components following the design spec (Section 12.6).
  Every component reads from CSS custom properties — no hardcoded colors.
  All components support RTL natively via CSS logical properties.

  Build in this order:
  1. icons/index.tsx — all SVG icons as named exports
  2. Button.tsx + .module.css
  3. Badge.tsx + .module.css (annotation type badges + status badges)
  4. Card.tsx + .module.css
  5. Input.tsx + .module.css
  6. Textarea.tsx + .module.css
  7. Tabs.tsx + .module.css
  8. StatCard.tsx

Test: Create a test page at /test that renders every component.
      Verify RTL rendering, colors match tokens, hover states work.
      Delete test page when done.

Files: All src/components/ui/* files
```

### Task 3: Auth System

```
Action:
  Simple code-based auth using cookies. No user accounts, no passwords.
  Instructor enters instructor code → session cookie set with role=instructor.
  Student enters student code → session cookie set with role=student + textId.

  1. Create src/lib/auth.ts
     - setSession(role, code, textId?) — sets httpOnly cookie
     - getSession() — reads cookie, returns { role, code, textId? } or null
     - clearSession() — removes cookie
  2. Create /api/auth/route.ts
     - POST { code } → validate against assignments.instructorCode
       or generatedTexts.studentCode → set session → return role + redirect path
  3. Create instructor/layout.tsx — server component, checks session,
     redirects to / if not instructor
  4. Create student/layout.tsx — same for student role

Test: Can enter instructor code → redirected to /instructor.
      Can enter student code → redirected to /student/[assignmentId].
      Invalid code shows error. Refresh preserves session.

Files: src/lib/auth.ts, src/app/api/auth/route.ts,
       src/app/instructor/layout.tsx, src/app/student/layout.tsx,
       src/app/page.tsx (landing with code entry)
```

### Task 4: Instructor — Create Assignment

```
Action:
  1. Build /instructor/page.tsx — list of assignments with status badges
  2. Build /instructor/create/page.tsx — form with fields:
     - title, promptText, courseContext, requirements, knownPitfalls, studentCount
     - All labels from he.ts locale
  3. Build /api/assignments/route.ts
     - POST: creates assignment + generates instructor code +
       N student codes (random 6-char alphanumeric)
     - GET: lists assignments for this instructor session
  4. On creation, status = "draft"

Test: Create assignment → appears in list → codes are generated.
      Each student code is unique. Instructor code is displayed on assignment page.

Files: instructor/page.tsx, instructor/create/page.tsx,
       api/assignments/route.ts
```

### Task 5: Text Generation

```
Action:
  1. Create src/lib/anthropic.ts — Anthropic client wrapper
     - Uses ANTHROPIC_API_KEY from env
     - Wrapper function: generateText(prompt, model) → string
     - Wrapper function: analyzeText(text, systemPrompt) → structured JSON
  2. Create src/lib/generation.ts
     - generateAllTexts(assignmentId): for each student code, call Anthropic API
       with the assignment prompt. Store result in generatedTexts table.
       Update assignment status to "generating" → "analyzing" when done.
  3. Build /api/assignments/[id]/generate/route.ts
     - POST: triggers generation. Returns immediately with status.
       Generation runs in background (or sequentially for MVP).
  4. Build /instructor/[assignmentId]/page.tsx — shows assignment details,
     generation status, student codes list, action buttons

Test: Create assignment with 3 students → click "Generate" →
      3 unique texts are generated and stored. Each text is different.
      Generation metadata (model, timestamp, token count) is logged.

Files: src/lib/anthropic.ts, src/lib/generation.ts,
       api/assignments/[id]/generate/route.ts,
       instructor/[assignmentId]/page.tsx
```

### Task 6: Automated Baseline Analysis

```
Action:
  1. Create src/lib/analysis.ts — the 6-pass analysis pipeline
     Each pass is a function that:
     - Takes text content + previous pass results
     - Constructs a specialized prompt (see spec Section 3.2)
     - Calls Anthropic API requesting JSON output
     - Parses response into RubricItem records
     - Returns structured findings

     Passes in order:
     a. factualAccuracyScan(text) → claim objects
     b. citationVerification(text, factualFindings) → citation objects
     c. structuralAnalysis(text, priorFindings) → structural observations
     d. disciplinaryDepth(text, priorFindings, fieldContext) → disciplinary obs
     e. gapAnalysis(text, priorFindings, requirements) → gap objects
     f. compositeScoring(allFindings) → difficulty rating + severity distribution

  2. Each pass writes RubricItem records to the database with:
     - passSource identifying which pass found it
     - severity rating
     - location (character offsets in the text)
     - description and ideal_response

  3. Composite pass writes to text_quality_scores fields on GeneratedText

  4. Build /api/assignments/[id]/analyze/route.ts
     - POST: runs all 6 passes on all generated texts for this assignment
     - Updates assignment status to "calibrating" when done

  CRITICAL: Prompt engineering for each pass must request JSON output.
  Include a JSON schema example in the prompt. Parse defensively —
  if the API returns malformed JSON, log the error and skip that item.

  The analysis prompts should instruct the model to return findings
  in Hebrew when describing issues, since the instructor interface is Hebrew.

Test: Run analysis on 3 generated texts → each text gets rubric items.
      Items have correct locations (test by checking that locationStart/End
      correspond to the actual text at those positions).
      Difficulty ratings are reasonable (1-10 range).
      At least 5 rubric items per text on average.

Files: src/lib/analysis.ts, api/assignments/[id]/analyze/route.ts
```

### Task 7: Instructor Calibration Interface

```
Action:
  1. Build /instructor/[assignmentId]/calibrate/page.tsx
     - Select 2-3 sample texts (system picks highest, median, lowest difficulty)
     - For each sample: split view with text on right, rubric items on left
     - Each rubric item shows: severity badge, category, description,
       the flagged text span (highlighted in context)
     - Action buttons per item: confirm / dismiss / modify
     - "Flag new finding" form at bottom — free text, creates new RubricItem
       with passSource = "professor"
     - "Approve calibration" button → updates assignment status to "active"

  2. Build CalibrationViewer.tsx component — reusable split-pane viewer
     - Right pane: text with rubric item locations highlighted
     - Left pane: scrollable list of RubricItem cards
     - Click a rubric item → highlights its location in the text

  3. Build /api/assignments/[id]/calibrate/route.ts
     - POST { action, rubricItemId?, notes? }
     - confirm: sets rubricItem.confirmed = true
     - dismiss: sets rubricItem.confirmed = false
     - flag_new: creates new RubricItem with passSource = "professor"
     - All actions logged in CalibrationLog

  4. Build /api/assignments/[id]/release/route.ts
     - POST: changes status to "active", making assignment visible to students

Test: Calibration page shows sample texts with findings highlighted.
      Can confirm/dismiss items. Can add professor findings.
      After approval, assignment status changes to "active".

Files: instructor/[assignmentId]/calibrate/page.tsx,
       components/instructor/CalibrationViewer.tsx,
       components/instructor/RubricItemCard.tsx,
       api/assignments/[id]/calibrate/route.ts,
       api/assignments/[id]/release/route.ts
```

### Task 8: Student Audit Workspace

```
Action:
  This is the core of the product. Reference the existing Hebrew prototype
  (audit-sandbox-he.jsx) for the interaction model, but rebuild as proper
  Next.js components with real data persistence.

  1. Build /student/[assignmentId]/page.tsx — landing page
     - Shows assignment title, prompt (read-only), text preview
     - "Begin Audit" button → navigates to workspace
     - All notices about prompt read-only status, variation between students

  2. Build /student/[assignmentId]/workspace/page.tsx — main workspace
     Layout: sidebar (right, 370px) + document panel (flex: 1)
     Top bar: app name, title, annotation count + coverage, "Generate Report"
     AI authorship banner below top bar

  3. Build DocumentViewer.tsx
     - Renders full text with RTL direction
     - Tracks text selection (mouseup handler)
     - Renders annotation highlights (colored backgrounds + bottom borders)
     - Click annotation → sets active annotation in sidebar
     - Selection → shows SelectionToolbar

  4. Build SelectionToolbar.tsx
     - Appears when text is selected
     - Shows 6 annotation type buttons with icons + labels
     - Click → POST /api/annotations (creates annotation)
     - Clears selection after creation

  5. Build AuditSidebar.tsx with 3 tabs:
     a. Audit tab: list of AnnotationCard components (newest first)
     b. Prompt tab: read-only prompt display + notices
     c. Guide tab: annotation types reference + scoring indicators + tips

  6. Build AnnotationCard.tsx
     - Badge showing annotation type
     - Quoted excerpt (guillemets « »)
     - Textarea for note/reflection
     - Guided prompt chips (click to append to note)
     - Evidence list (existing items)
     - "Attach evidence" button → EvidenceForm
     - Delete button

  7. Build EvidenceForm.tsx
     - Evidence type selector (3 types with icons)
     - Textarea with type-specific placeholder
     - Add / Cancel buttons
     - POST /api/annotations/[id]/evidence on submit

  8. Build API routes:
     - POST /api/annotations — create annotation
     - PUT /api/annotations/[id] — update note
     - DELETE /api/annotations/[id] — delete
     - POST /api/annotations/[id]/evidence — attach evidence
     All routes validate that the session's student code matches the text

  9. Auto-save: annotations save on blur (debounced 500ms).
     No explicit save button — changes persist automatically.

Test: Full audit workflow:
      Enter student code → see landing → click "Begin Audit" →
      select text → choose annotation type → annotation appears in sidebar →
      write note → attach evidence → see coverage update.
      Refresh page → all data persists.
      Create 5+ annotations of different types → verify all render correctly.

Files: student/[assignmentId]/page.tsx,
       student/[assignmentId]/workspace/page.tsx,
       All components/audit/* files,
       api/annotations/* routes
```

### Task 9: Student Report

```
Action:
  1. Build /student/[assignmentId]/report/page.tsx
     - Summary stats (4 stat cards): annotation count, coverage %, evidence count, reflections
     - Annotation breakdown by type (bar visualization)
     - Scoring indicators (qualitative, not numeric — spec Section 7.1)
     - Detailed annotations grouped by type
     - Each annotation shows: excerpt, note, evidence items
     - "Back to workspace" button

  2. Build StudentReport.tsx component (reusable for instructor view)
  3. Build AnnotationBreakdown.tsx — visual bar chart of types

  No "submit" button in MVP — the report page IS the submission.
  When a student views their report, their text status updates to "submitted".

Test: Complete an audit with 5+ annotations → click "Generate Report" →
      report shows accurate stats, all annotations, evidence.
      Stats are correct (manually verify coverage calculation).

Files: student/[assignmentId]/report/page.tsx,
       components/report/StudentReport.tsx,
       components/report/AnnotationBreakdown.tsx
```

### Task 10: Scoring Engine

```
Action:
  1. Create src/lib/matching.ts — annotation ↔ rubric matching
     For each student annotation:
     a. Find rubric items with overlapping location (>30% character overlap)
     b. Compare annotation note text against rubric item description
        (for MVP: use keyword overlap scoring instead of embeddings —
         count shared significant words / total significant words)
     c. Check type alignment (error↔factual_inaccuracy, etc.)
     d. Assign matchConfidence: high / medium / low
     e. Assess matchQuality (0-10) based on:
        - Did the student identify the right issue? (+3)
        - Did they provide correct information? (+3)
        - Did they attach evidence? (+2)
        - Is their reasoning sound? (+2)

  2. Create src/lib/scoring.ts — 3-tier score calculation
     Tier 1 (max 60): Sum of (matchQuality × severity_weight) for matched items
       severity_weight: critical=3, moderate=2, minor=1
       Normalize to 60-point scale based on total possible points

     Tier 2 (max -20): Deduction for unmatched rubric items (confirmed only)
       Per unmatched item: -(severity_weight × 2)
       Normalize to 20-point scale

     Tier 3 (max +20): Bonus for annotations not matching any rubric item
       For MVP: flag as beyond-rubric, assign provisional quality score
       Professor confirms/rejects in review

     Coverage modifier: if coverage < 40%, apply 0.8x multiplier to Tier 1

     compositeRaw = tier1 + tier2 + tier3
     normalizedFinal = clamp(compositeRaw, 0, 100)

  3. Build /api/scoring/[textId]/route.ts
     - POST: runs matching + scoring for this text
     - GET: returns score breakdown
     - Creates Score record + RubricMatch records + BeyondRubricFinding records

Test: Create annotations that match known rubric items → run scoring →
      verify Tier 1 points are awarded. Leave known issues unannotated →
      verify Tier 2 deductions. Add annotation that doesn't match rubric →
      verify it appears as beyond-rubric finding.

Files: src/lib/matching.ts, src/lib/scoring.ts,
       api/scoring/[textId]/route.ts
```

### Task 11: Instructor Submission Review

```
Action:
  1. Build /instructor/[assignmentId]/submissions/page.tsx
     - List of all students with: name/code, status, annotation count,
       coverage, composite score (if scored)
     - "Score all" button → runs scoring for all submitted texts
     - Status indicators: not started / in progress / submitted / scored

  2. Build /instructor/[assignmentId]/submissions/[studentId]/page.tsx
     - Three-panel view:
       a. Original text with student annotations highlighted
       b. Scoring breakdown (Tier 1 matches, Tier 2 misses, Tier 3 beyond)
       c. Professor action panel

     - Tier 1 section: each matched rubric item shows:
       Student's annotation → Rubric item it matched → Match quality score
       Professor can adjust quality score

     - Tier 2 section: each unmatched rubric item shows:
       The issue description → The text location (highlighted) → "Missed"
       Professor can waive deduction with note

     - Tier 3 section: each beyond-rubric finding shows:
       Student's annotation + evidence → "Confirm" / "Reject" buttons
       Professor adds note

     - Override panel at bottom:
       Final score display (auto-calculated + professor override field)
       Notes textarea
       "Release grade" button (per-student)

  3. Build ScoringBreakdown.tsx, SubmissionCard.tsx components

  4. Build /api/scoring/[textId]/route.ts PUT for professor overrides

Test: Score a student → review in instructor view → see 3-tier breakdown.
      Confirm a beyond-rubric finding → score updates.
      Override final score → saved with rationale.
      Release grade → student can see final feedback.

Files: instructor/[assignmentId]/submissions/page.tsx,
       instructor/[assignmentId]/submissions/[studentId]/page.tsx,
       components/instructor/ScoringBreakdown.tsx,
       components/instructor/SubmissionCard.tsx
```

### Task 12: Integration Testing & Polish

```
Action:
  Run through the complete lifecycle with realistic data:

  1. Instructor creates assignment with a real sociology prompt (use the
     sample from our prototype)
  2. System generates 3-5 texts
  3. System runs baseline analysis
  4. Instructor calibrates (confirm some items, dismiss some, add 1-2)
  5. Release to students
  6. Student completes full audit (10+ annotations, evidence, reflections)
  7. Student views report
  8. Instructor scores all submissions
  9. Instructor reviews per-student, confirms beyond-rubric findings
  10. Instructor releases grades

  Fix any issues found. Polish:
  - Loading states on all API calls (simple text change, no spinners)
  - Error handling on all API calls (display error message, offer retry)
  - Confirm dialogs on destructive actions (delete annotation, release grades)
  - Focus management: after creating annotation, focus the note textarea
  - Text selection behavior: clear selection after creating annotation
  - Auto-scroll sidebar to newly created annotation

Files: Fixes across all files as needed
```

---

## 8. Key Implementation Notes

### RTL CSS Strategy

Use CSS logical properties everywhere. Never use `left` / `right` for layout:

```css
/* WRONG */
margin-left: 10px;
border-left: 4px solid var(--error);
text-align: right;

/* CORRECT */
margin-inline-start: 10px;
border-inline-start: 4px solid var(--error);
text-align: start;
```

The root `<html>` tag has `dir="rtl"` and `lang="he"`. This makes all logical properties resolve correctly. When an English locale is added later, only the `dir` and `lang` attributes change — no component modifications needed.

**Exception:** The `direction: rtl` on text content (DocumentViewer) should be explicit, not inherited, because mixed Hebrew/English content in academic text needs the base direction set correctly for the Unicode Bidi algorithm to handle inline Latin text (author names, citations) properly.

### Anthropic API Patterns

```typescript
// src/lib/anthropic.ts

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateText(prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');
}

export async function analyzeWithJSON<T>(
  text: string,
  systemPrompt: string,
  userPrompt: string
): Promise<T | null> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const raw = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');
    // Strip markdown fences if present
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('Analysis parse error:', err);
    return null;
  }
}
```

### Annotation Location Tracking

The DocumentViewer uses the same approach as the prototype — `Range` API to calculate character offsets within the text container. The critical detail: offsets are character positions within the PLAIN TEXT string, not DOM positions. This ensures annotations are stable regardless of how the text is rendered (with or without existing highlights).

```typescript
// In DocumentViewer: after selection
const range = selection.getRangeAt(0);
const preRange = document.createRange();
preRange.selectNodeContents(containerRef.current);
preRange.setEnd(range.startContainer, range.startOffset);
const start = preRange.toString().length;
const end = start + selection.toString().length;
```

### Overlapping Annotations

For MVP, overlapping annotations are **not supported**. If a user selects text that overlaps with an existing annotation, only the new annotation's boundaries are stored. The rendering sorts annotations by start position and renders them left-to-right (or right-to-left in RTL), which means if ranges overlap, the earlier-starting annotation "wins" for the overlapping characters.

Post-MVP: implement a more sophisticated rendering system that can display multiple annotation colors on the same text span (e.g., stacked underlines or a multi-color sidebar gutter).

### Scoring Keyword Matching (MVP Alternative to Embeddings)

For MVP, the semantic matching in the scoring engine uses keyword overlap instead of embedding similarity. This avoids an additional API call per annotation-rubric pair.

```typescript
function keywordOverlap(text1: string, text2: string): number {
  const stopwords = new Set(['של', 'את', 'על', 'עם', 'הוא', 'היא', 'זה', 'לא',
    'כי', 'אם', 'גם', 'אבל', 'או', 'the', 'a', 'an', 'is', 'are', 'was',
    'in', 'on', 'at', 'to', 'for', 'of', 'and', 'but', 'or', 'not']);

  const tokenize = (s: string) => s.toLowerCase()
    .replace(/[^\w\sא-ת]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));

  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));
  const intersection = [...tokens1].filter(t => tokens2.has(t));
  const union = new Set([...tokens1, ...tokens2]);

  return union.size > 0 ? intersection.length / union.size : 0;
}
```

This gives a Jaccard-like similarity score. Threshold of 0.15 for potential match (lower than embedding threshold because keyword matching is coarser).

### Environment Variables

```
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
SESSION_SECRET=random-32-char-string-for-cookie-signing
DATABASE_URL=file:./prisma/dev.db
```

---

## 9. Acceptance Criteria

The MVP is complete when all of the following pass:

### Instructor Flow
- [ ] Can create a new assignment with Hebrew prompt
- [ ] System generates unique AI texts for each student code
- [ ] Automated baseline analysis produces rubric items for each text
- [ ] Calibration interface shows sample texts with findings highlighted
- [ ] Can confirm, dismiss, and add rubric items during calibration
- [ ] Can release assignment to students
- [ ] Can view all student submissions with status
- [ ] Can view per-student scoring breakdown (3 tiers)
- [ ] Can confirm/reject beyond-rubric findings
- [ ] Can override final scores with rationale
- [ ] Can release grades

### Student Flow
- [ ] Can enter student code and access assigned text
- [ ] Landing page shows prompt (read-only) and text preview
- [ ] Workspace renders full text in RTL with correct Hebrew typography
- [ ] Can select text and create annotations of all 6 types
- [ ] Annotations persist across page refreshes
- [ ] Can write reflections in annotation cards
- [ ] Guided prompt chips append to reflection textarea
- [ ] Can attach all 3 types of evidence
- [ ] Coverage percentage updates in real time
- [ ] Annotation highlights render correctly (colors, active states)
- [ ] Can view audit report with accurate statistics
- [ ] All interface text is Hebrew, all layout is RTL

### Technical
- [ ] All data persists in SQLite database
- [ ] API routes validate session auth
- [ ] Anthropic API errors are caught and displayed gracefully
- [ ] No hardcoded Hebrew strings in components (all from locale file)
- [ ] CSS uses logical properties (no `left`/`right` for layout)
- [ ] All colors use CSS custom properties from tokens
- [ ] No emoji anywhere in the interface
- [ ] No pure white (#FFFFFF) or pure black (#000000) anywhere
- [ ] Annotation type icons are all SVG components

---

## 10. Reference Files

The following files from this project inform the build:

| File | Purpose |
|------|---------|
| `audit-sandbox-spec.md` | Full system architecture, all 12 sections including design system |
| `audit-sandbox-he.jsx` | Hebrew RTL prototype — interaction model reference, NOT for direct porting |
| `audit-sandbox-v2.jsx` | English prototype — same role, English version |

The prototypes demonstrate the interaction model and visual design but are single-file React artifacts with inline styles. The real build uses proper Next.js architecture, CSS Modules, server components, and database persistence. Do not copy code from the prototypes directly — use them as a behavioral reference.
