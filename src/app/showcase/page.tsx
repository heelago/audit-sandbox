'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import styles from './showcase.module.css';
import {
  showcaseScenarios,
  type ShowcaseSeverity,
} from '@/lib/showcase-data';
import { showcaseIntro } from '@/lib/showcase-intro';
import { AnnotationBadge, type AnnotationType } from '@/components/ui/Badge';
import { InstructorView } from '@/components/showcase/InstructorView';
import { StudentView } from '@/components/showcase/StudentView';
import { PedagogyModal } from '@/components/showcase/PedagogyModal';
import { WalkthroughTooltip } from '@/components/showcase/WalkthroughTooltip';
import { InstructorPreviewPanel } from '@/components/showcase/InstructorPreviewPanel';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type RoleMode = 'instructor' | 'student';

interface StudentDraft {
  id: string;
  scenarioId: string;
  quote: string;
  tag: AnnotationType;
  why: string;
  fix: string;
  verify: string;
  evidence: string;
}

interface InstructorTag {
  id: string;
  scenarioId: string;
  quote: string;
  tag: AnnotationType;
  note: string;
  followup: string;
}

interface DisplayFinding {
  title: string;
  type: AnnotationType;
  severity?: ShowcaseSeverity;
  quote?: string;
  description: string;
  verificationStep?: string;
  source: 'system' | 'instructor';
}

interface HighlightRange {
  start: number;
  end: number;
  findingIndex: number;
}

type TourTarget =
  | 'tour-left-context'
  | 'tour-model-text'
  | 'tour-instructor-builder'
  | 'tour-instructor-criteria'
  | 'tour-instructor-weights'
  | 'tour-instructor-findings'
  | 'tour-student-mission'
  | 'tour-student-workbench'
  | 'tour-student-saved';

interface WalkthroughStep {
  id: string;
  role: RoleMode;
  title: string;
  description: string;
  target: TourTarget;
}

type InstructorJourneyTarget = Extract<
  TourTarget,
  | 'tour-instructor-builder'
  | 'tour-instructor-criteria'
  | 'tour-instructor-weights'
  | 'tour-instructor-findings'
>;

interface InstructorJourneyStep {
  id: string;
  title: string;
  description: string;
  target: InstructorJourneyTarget;
}

interface GenerationSectionBlueprint {
  id: string;
  title: string;
  question: string;
  mustInclude: string;
  embeddedFlaws: string[];
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const annotationTypeOrder: AnnotationType[] = [
  'error', 'gap', 'nuance', 'alternative', 'verified', 'accepted',
];

const defaultWeights: Record<AnnotationType, number> = {
  error: 5, gap: 4, nuance: 3, alternative: 2, verified: 2, accepted: 1,
};

const severityFactor: Record<ShowcaseSeverity, number> = {
  critical: 3, moderate: 2, minor: 1,
};

const generationBlueprintByScenario: Record<string, GenerationSectionBlueprint[]> = {
  'anthropology-rites': [
    {
      id: 'a1',
      title: 'חלק 1: מסגרת תיאורטית',
      question: "הסבירו את מושג טקסי המעבר אצל טרנר והגדירו שלב לימינלי.",
      mustInclude: 'הגדרה תיאורטית מדויקת + דוגמה אחת לפחות.',
      embeddedFlaws: ['הכללה תרבותית רחבה מדי', 'שימוש במונח מערבי כסטנדרט אוניברסלי'],
    },
    {
      id: 'a2',
      title: 'חלק 2: השוואה בין הקשרים',
      question: 'השוו בין טקס בחברה ילידית לבין טקס מודרני כמו סיום לימודים.',
      mustInclude: 'השוואה סימטרית בין שני ההקשרים.',
      embeddedFlaws: ['השטחת השלב הלימינלי במערב', 'התעלמות מכוח מוסדי/כלכלי'],
    },
    {
      id: 'a3',
      title: 'חלק 3: ביקורת מתודולוגית',
      question: 'דונו במגבלות אתנוגרפיות ואתיות של הניתוח.',
      mustInclude: 'התייחסות מפורשת לאתיקה מחקרית וקולוניאליות.',
      embeddedFlaws: ['השמטת אתיקה מחקרית', 'היעדר הקשר קולוניאלי'],
    },
  ],
  'history-ancient-medicine': [
    {
      id: 'm1',
      title: 'חלק 1: מיפוי מושגים',
      question: 'הציגו את תפקידי הכבד, הלב והרחם ברפואה היוונית העתיקה.',
      mustInclude: 'הפרדה בין תפקידים פיזיולוגיים לנפשיים.',
      embeddedFlaws: ['ערבוב בין מסורות רפואיות שונות', 'אנכרוניזם מושגי'],
    },
    {
      id: 'm2',
      title: 'חלק 2: ציר זמן ומקורות',
      question: 'קשרו בין הטענות לבין כתבים היפוקרטיים רלוונטיים.',
      mustInclude: 'שמות חיבורים מאומתים + תקופה היסטורית מדויקת.',
      embeddedFlaws: ['ייחוס לכתבים לא קיימים', 'בלבול בין היפוקרטס לגלנוס'],
    },
    {
      id: 'm3',
      title: 'חלק 3: תיאוריה של הרחם הנודד',
      question: "נתחו את תפיסת 'הרחם הנודד' ואת השלכותיה הרפואיות.",
      mustInclude: 'הבחנה בין תיאור עתיק לפרשנות מאוחרת.',
      embeddedFlaws: ['שימוש במינוח רפואי מודרני', 'הסקת מסקנות חד-משמעיות מדי'],
    },
  ],
  'philosophy-achievement-society': [
    {
      id: 'p1',
      title: 'חלק 1: פוקו כנקודת מוצא',
      question: "הציגו את מאפייני 'חברת המשמעת' אצל פוקו.",
      mustInclude: 'מושגי מוסד, פיקוח, ושליליות.',
      embeddedFlaws: ['הצגה פשטנית של כוח מדכא בלבד'],
    },
    {
      id: 'p2',
      title: 'חלק 2: האן וחברת ההישגיות',
      question: "הסבירו את מעבר הכוח ל'חיוביות' וניצול עצמי אצל האן.",
      mustInclude: 'הבדלה בין כפייה חיצונית לכפייה פנימית.',
      embeddedFlaws: ['גלישה לשיח Wellness אישי', 'קפיצה ממוטיבציה למבנה חברתי בלי נימוק'],
    },
    {
      id: 'p3',
      title: 'חלק 3: שחיקה כמבנה חברתי',
      question: 'נתחו את הקשר בין שחיקה, עייפות וסדר חברתי.',
      mustInclude: 'עיגון מושגי ב-The Burnout Society.',
      embeddedFlaws: ['הסבר פסיכולוגיסטי בלבד', 'אי-הבחנה בין קורלציה לסיבתיות'],
    },
  ],
  'law-hallucinated-case-law': [
    {
      id: 'l1',
      title: 'חלק 1: Issue + Rule',
      question: 'נסחו את הסוגיה המשפטית ואת כללי אמנת מונטריאול הרלוונטיים.',
      mustInclude: 'מבנה IRAC ברור עם סעיפי אמנה.',
      embeddedFlaws: ['הרחבת יתר של כלל משפטי ללא הסתייגות'],
    },
    {
      id: 'l2',
      title: 'חלק 2: Analysis',
      question: 'יישמו את הכללים על פגיעה במסלול ההמראה לפני העלייה למטוס.',
      mustInclude: 'Distinguishing בין פסיקות דומות ושונות.',
      embeddedFlaws: ['סילוף עובדות תקדים', 'קפיצה למסקנה סיבתית'],
    },
    {
      id: 'l3',
      title: 'חלק 3: Citation Integrity',
      question: 'הציגו 3 תקדימים פדרליים והסבירו את תרומתם למסקנה.',
      mustInclude: 'מראי מקום תקינים שניתנים לאימות.',
      embeddedFlaws: ['ציטוט פורמלי אמין אך חלקי/מטעה', 'Cherry-picking של פסיקה'],
    },
  ],
};

const TOUR_SEEN_STORAGE_KEY = 'audit-sandbox-showcase-tour-seen-v1';

const walkthroughSteps: WalkthroughStep[] = [
  { id: 'inst-1', role: 'instructor', title: 'הקשר המטלה', description: 'כאן מוצגים המטלה והטקסט הגנרטיבי שהוזנו מראש עבור הקורס הנבחר.', target: 'tour-left-context' },
  { id: 'inst-2', role: 'instructor', title: 'הקשר ונושא', description: 'המרצה מגדיר כותרת, תחום ומשימה בשפה טבעית.', target: 'tour-instructor-builder' },
  { id: 'inst-3', role: 'instructor', title: 'כשלים מתוכננים', description: 'המרצה בוחר כשלים פדגוגיים, מחלק לחלקים ומגדיר קריטריונים.', target: 'tour-instructor-criteria' },
  { id: 'inst-4', role: 'instructor', title: 'הגדרות יצירה', description: 'המרצה בוחר אסטרטגיה, מקורות, אורך ומספר גרסאות.', target: 'tour-instructor-weights' },
  { id: 'inst-5', role: 'instructor', title: 'סקירה וממצאים', description: 'בדיקה סופית, הרצת ביקורת, תגיות מרצה וסקירת ממצאים.', target: 'tour-instructor-findings' },
  { id: 'stu-1', role: 'student', title: 'משימת הסטודנט', description: 'הסטודנט רואה את היעד והתקדמות לעבר מספר התיוגים הנדרש.', target: 'tour-student-mission' },
  { id: 'stu-2', role: 'student', title: 'טקסט תגובת המודל', description: 'הסטודנט מסמן משפטים ספציפיים ישירות מתוך הטקסט הגנרטיבי.', target: 'tour-model-text' },
  { id: 'stu-3', role: 'student', title: 'עמדת תיוג', description: 'הסטודנט מתייג בעיות, מסביר, מציע תיקון ומתעד אימות.', target: 'tour-student-workbench' },
  { id: 'stu-4', role: 'student', title: 'סקירה שמורה', description: 'התיוגים השמורים מדמים את מה שהמרצה יבדוק בהמשך.', target: 'tour-student-saved' },
];

const instructorJourneyStepsBlueprint: InstructorJourneyStep[] = [
  { id: 'context', title: 'הקשר ונושא', description: 'כותרת המטלה, תחום אקדמי, ותיאור המשימה לסטודנט.', target: 'tour-instructor-builder' },
  { id: 'signals', title: 'כשלים מתוכננים', description: 'בחירת כשלים פדגוגיים, חלוקה לחלקים, וקריטריונים להערכה.', target: 'tour-instructor-criteria' },
  { id: 'settings', title: 'הגדרות יצירה', description: 'אסטרטגיה, מקורות, אורך טקסט ומספר גרסאות.', target: 'tour-instructor-weights' },
  { id: 'review', title: 'סקירה ויצירה', description: 'בדיקה אחרונה, הרצת ביקורת, וסקירת ממצאים.', target: 'tour-instructor-findings' },
];

/* ------------------------------------------------------------------ */
/* Helper functions                                                    */
/* ------------------------------------------------------------------ */

function getNextIndex(current: number, delta: number, size: number): number {
  return (current + delta + size) % size;
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function findQuotedRange(text: string, quote: string): { start: number; end: number } | null {
  const exact = text.indexOf(quote);
  if (exact !== -1) return { start: exact, end: exact + quote.length };

  const parts = quote.split('...').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const first = text.indexOf(parts[0]);
    if (first !== -1) {
      let cursor = first + parts[0].length;
      let lastEnd = cursor;
      let matched = true;
      for (const part of parts.slice(1)) {
        const found = text.indexOf(part, cursor);
        if (found === -1) { matched = false; break; }
        cursor = found + part.length;
        lastEnd = cursor;
      }
      if (matched) return { start: first, end: lastEnd };
    }
  }

  const normalized = quote.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  const fallback = normalized.slice(0, Math.min(normalized.length, 56));
  const fallbackStart = text.indexOf(fallback);
  if (fallbackStart !== -1) return { start: fallbackStart, end: fallbackStart + fallback.length };
  return null;
}

function buildHighlightRanges(text: string, quotes: Array<string | undefined>): HighlightRange[] {
  const ranges: HighlightRange[] = [];
  quotes.forEach((quote, findingIndex) => {
    if (!quote) return;
    const range = findQuotedRange(text, quote);
    if (!range) return;
    ranges.push({ start: range.start, end: range.end, findingIndex });
  });
  const sorted = ranges.sort((a, b) => (a.start !== b.start ? a.start - b.start : b.end - a.end));
  const nonOverlapping: HighlightRange[] = [];
  let cursor = 0;
  for (const range of sorted) {
    if (range.start < cursor) continue;
    nonOverlapping.push(range);
    cursor = range.end;
  }
  return nonOverlapping;
}

/* ------------------------------------------------------------------ */
/* Page component                                                      */
/* ------------------------------------------------------------------ */

export default function ShowcasePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [roleMode, setRoleMode] = useState<RoleMode>('instructor');
  const [pedagogyModalOpen, setPedagogyModalOpen] = useState(false);
  const [activeSystemFindingIndex, setActiveSystemFindingIndex] = useState(0);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [walkthroughStepIndex, setWalkthroughStepIndex] = useState(0);
  const [tourTooltipStyle, setTourTooltipStyle] = useState<{
    top: number; left: number; width: number; arrowLeft: number; placement: 'top' | 'bottom';
  } | null>(null);
  const [agentRunsByScenario, setAgentRunsByScenario] = useState<Record<string, number>>({});
  const [criteriaByScenario, setCriteriaByScenario] = useState<Record<string, string[]>>({});
  const [builderSectionCountByScenario, setBuilderSectionCountByScenario] = useState<Record<string, number>>({});
  const [builderModeByScenario, setBuilderModeByScenario] = useState<Record<string, 'natural' | 'balanced_errors'>>({});
  const [builderPreviewVersionByScenario, setBuilderPreviewVersionByScenario] = useState<Record<string, number>>({});
  const [weightsByScenario, setWeightsByScenario] = useState<Record<string, Record<AnnotationType, number>>>({});
  const [studentDrafts, setStudentDrafts] = useState<StudentDraft[]>([]);
  const [studentSubmittedByScenario, setStudentSubmittedByScenario] = useState<Record<string, boolean>>({});
  const [instructorTags, setInstructorTags] = useState<InstructorTag[]>([]);

  const [studentSelection, setStudentSelection] = useState('');
  const [studentTag, setStudentTag] = useState<AnnotationType>('error');
  const [studentWhy, setStudentWhy] = useState('');
  const [studentFix, setStudentFix] = useState('');
  const [studentVerify, setStudentVerify] = useState('');
  const [studentEvidence, setStudentEvidence] = useState('');
  const [studentError, setStudentError] = useState<string | null>(null);

  const [instructorSelection, setInstructorSelection] = useState('');
  const [instructorTag, setInstructorTag] = useState<AnnotationType>('gap');
  const [instructorNote, setInstructorNote] = useState('');
  const [instructorFollowup, setInstructorFollowup] = useState('');
  const [instructorError, setInstructorError] = useState<string | null>(null);

  const textRef = useRef<HTMLDivElement | null>(null);

  /* ---------------------------------------------------------------- */
  /* Derived state                                                     */
  /* ---------------------------------------------------------------- */

  const scenario = showcaseScenarios[activeIndex];
  const scenarioId = scenario.id;
  const roleTitle = roleMode === 'instructor' ? 'מה רואים בצד המרצה' : 'מה רואים בצד הסטודנט';
  const roleSteps = roleMode === 'instructor' ? scenario.instructorView : scenario.studentView;
  const roleModeBanner = roleMode === 'instructor' ? 'מצב פעיל: מבט מרצה' : 'מצב פעיל: מבט סטודנט';
  const activeWalkthroughStep =
    walkthroughOpen && walkthroughSteps.length
      ? walkthroughSteps[Math.min(walkthroughStepIndex, walkthroughSteps.length - 1)]
      : null;

  const criteriaCatalog = useMemo(
    () => [
      ...scenario.knownPitfalls.map((item, index) => ({
        id: `pitfall-${index}`, title: item, desc: 'דפוס כשל מוכר בתחום הדעת הזה.',
      })),
      { id: 'fact-check', title: 'דרישת אימות מקורות לטענות עובדתיות', desc: 'איתור טענות שדורשות בדיקת מקור חיצונית.' },
      { id: 'logic-chain', title: 'בדיקת קוהרנטיות ולוגיקה בטיעון', desc: 'איתור קפיצות לוגיות ומעברים חלשים.' },
      { id: 'reference-audit', title: 'ביקורת מראי מקום וציטוטים', desc: 'סימון מקורות מפוברקים, חלקיים או מטעים.' },
    ],
    [scenario.knownPitfalls]
  );

  const selectedCriteria = criteriaByScenario[scenarioId] ?? criteriaCatalog.slice(0, 3).map((c) => c.id);
  const selectedCriterionTitles = criteriaCatalog
    .filter((criterion) => selectedCriteria.includes(criterion.id))
    .map((criterion) => criterion.title);
  const builderSectionCount = Math.max(1, Math.min(3, builderSectionCountByScenario[scenarioId] ?? 2));
  const builderMode = builderModeByScenario[scenarioId] ?? 'balanced_errors';
  const builderPreviewVersion = builderPreviewVersionByScenario[scenarioId] ?? 0;
  const generationBlueprint = generationBlueprintByScenario[scenarioId] ?? [];
  const activeBlueprintSections = generationBlueprint.slice(0, builderSectionCount);
  const weights = weightsByScenario[scenarioId] ?? defaultWeights;
  const weightsEdited = annotationTypeOrder.some((type) => weights[type] !== defaultWeights[type]);
  const agentRuns = agentRunsByScenario[scenarioId] ?? 0;
  const studentScenarioDrafts = studentDrafts.filter((draft) => draft.scenarioId === scenarioId);
  const instructorScenarioTags = instructorTags.filter((tag) => tag.scenarioId === scenarioId);

  const systemFindingsVisible = useMemo(
    () => agentRuns > 0 ? scenario.findings.slice(0, Math.min(scenario.findings.length, Math.max(2, agentRuns * 2))) : [],
    [agentRuns, scenario.findings]
  );

  const displayedFindings: DisplayFinding[] = useMemo(() => {
    const systemMapped: DisplayFinding[] = systemFindingsVisible.map((finding) => ({
      title: finding.title, type: finding.type as AnnotationType, severity: finding.severity, quote: finding.quote,
      description: finding.description, verificationStep: finding.verificationStep, source: 'system',
    }));
    const instructorMapped: DisplayFinding[] = instructorScenarioTags.map((tag) => ({
      title: 'תגית המשך של המרצה', type: tag.tag, severity: 'moderate', quote: tag.quote,
      description: tag.note, verificationStep: tag.followup, source: 'instructor',
    }));
    return [...systemMapped, ...instructorMapped];
  }, [instructorScenarioTags, systemFindingsVisible]);

  const highlightRanges = useMemo(
    () => buildHighlightRanges(scenario.modelText, systemFindingsVisible.map((f) => f.quote)),
    [scenario.modelText, systemFindingsVisible]
  );

  const renderedModelText = useMemo(() => {
    if (!highlightRanges.length) return <span>{scenario.modelText}</span>;
    const parts: ReactNode[] = [];
    let cursor = 0;
    for (const range of highlightRanges) {
      if (range.start > cursor) parts.push(<span key={`plain-${cursor}`}>{scenario.modelText.slice(cursor, range.start)}</span>);
      const finding = systemFindingsVisible[range.findingIndex];
      parts.push(
        <mark key={`hl-${range.start}-${range.end}-${range.findingIndex}`} className={styles.highlight}
          data-type={finding.type} data-active={activeSystemFindingIndex === range.findingIndex ? 'true' : 'false'}
          onClick={() => setActiveSystemFindingIndex(range.findingIndex)} title={finding.title}>
          {scenario.modelText.slice(range.start, range.end)}
        </mark>
      );
      cursor = range.end;
    }
    if (cursor < scenario.modelText.length) parts.push(<span key={`tail-${cursor}`}>{scenario.modelText.slice(cursor)}</span>);
    return parts;
  }, [activeSystemFindingIndex, highlightRanges, scenario.modelText, systemFindingsVisible]);

  const weightedSignal = useMemo(() => {
    return displayedFindings.reduce((sum, finding) => {
      const w = weights[finding.type] ?? 1;
      const s = severityFactor[finding.severity ?? 'moderate'];
      return sum + w * s;
    }, 0);
  }, [displayedFindings, weights]);

  const progressTarget = 5;
  const studentProgress = Math.min(100, Math.round((studentScenarioDrafts.length / progressTarget) * 100));
  const studentSubmitted = studentSubmittedByScenario[scenarioId] ?? false;
  const instructorStepCompletion: Record<InstructorJourneyTarget, boolean> = {
    'tour-instructor-builder': builderPreviewVersion > 0,
    'tour-instructor-criteria': selectedCriteria.length > 0,
    'tour-instructor-weights': weightsEdited,
    'tour-instructor-findings': displayedFindings.length > 0,
  };
  const activeInstructorTargetFromWalkthrough =
    activeWalkthroughStep && activeWalkthroughStep.role === 'instructor' ? activeWalkthroughStep.target : null;
  const nextInstructorTarget = instructorJourneyStepsBlueprint.find((step) => !instructorStepCompletion[step.target])?.target;
  const activeInstructorTarget = instructorJourneyStepsBlueprint.some(
    (step) => step.target === activeInstructorTargetFromWalkthrough
  )
    ? activeInstructorTargetFromWalkthrough
    : roleMode === 'instructor' ? nextInstructorTarget ?? 'tour-instructor-findings' : null;

  const calibrationQuestions = useMemo(() => [
    'האם הממצא מצביע על בעיה מהותית להבנת החומר או על ניסוח בלבד?',
    'איזו ראיית אימות מצופה מהסטודנט כדי לאשר או להפריך את הטענה?',
    'האם הכשל תלוי תחום (ניואנס דיסציפלינרי) או מתאים גם לקורסים אחרים?',
    'האם נדרש סבב סוכנים נוסף לפני שחרור המטלה לסטודנטים?',
  ], []);

  /* ---------------------------------------------------------------- */
  /* Handlers                                                          */
  /* ---------------------------------------------------------------- */

  function isWalkthroughTarget(target: string): boolean {
    return Boolean(activeWalkthroughStep && activeWalkthroughStep.target === target);
  }

  function startWalkthrough() { setWalkthroughOpen(true); setWalkthroughStepIndex(0); }

  function jumpToWalkthroughRole(role: RoleMode) {
    const firstForRole = walkthroughSteps.findIndex((step) => step.role === role);
    setWalkthroughOpen(true);
    setWalkthroughStepIndex(firstForRole === -1 ? 0 : firstForRole);
  }

  function jumpToInstructorStep(target: InstructorJourneyTarget) {
    setRoleMode('instructor');
    const index = walkthroughSteps.findIndex((step) => step.role === 'instructor' && step.target === target);
    if (index === -1) return;
    setWalkthroughOpen(true);
    setWalkthroughStepIndex(index);
  }

  function nextWalkthroughStep() {
    setWalkthroughStepIndex((current) => Math.min(current + 1, Math.max(0, walkthroughSteps.length - 1)));
  }
  function prevWalkthroughStep() { setWalkthroughStepIndex((current) => Math.max(0, current - 1)); }
  function stopWalkthrough() { setWalkthroughOpen(false); setWalkthroughStepIndex(0); }

  useEffect(() => {
    if (!walkthroughOpen || !activeWalkthroughStep) { setTourTooltipStyle(null); return; }
    if (roleMode !== activeWalkthroughStep.role) { setRoleMode(activeWalkthroughStep.role); return; }
    const targetEl = document.getElementById(activeWalkthroughStep.target);
    if (!targetEl) return;
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const updateTooltip = () => {
      const element = document.getElementById(activeWalkthroughStep.target);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const margin = 12;
      const width = Math.min(360, Math.max(260, window.innerWidth - margin * 2));
      const estimatedHeight = 190;
      const centerX = rect.left + rect.width / 2;
      let left = centerX - width / 2;
      left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
      let placement: 'top' | 'bottom' = 'bottom';
      let top = rect.bottom + 12;
      if (top + estimatedHeight > window.innerHeight - margin) { placement = 'top'; top = rect.top - estimatedHeight - 12; }
      top = Math.max(margin, top);
      const arrowLeft = Math.max(20, Math.min(width - 20, centerX - left));
      setTourTooltipStyle({ top, left, width, arrowLeft, placement });
    };
    const rafId = window.requestAnimationFrame(updateTooltip);
    window.addEventListener('resize', updateTooltip);
    window.addEventListener('scroll', updateTooltip, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateTooltip);
      window.removeEventListener('scroll', updateTooltip, true);
    };
  }, [activeWalkthroughStep, roleMode, walkthroughOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const seen = window.localStorage.getItem(TOUR_SEEN_STORAGE_KEY);
      if (!seen) { window.localStorage.setItem(TOUR_SEEN_STORAGE_KEY, '1'); setWalkthroughOpen(true); setWalkthroughStepIndex(0); }
    } catch { setWalkthroughOpen(true); setWalkthroughStepIndex(0); }
  }, []);

  function changeRoleMode(nextRole: RoleMode) {
    setRoleMode(nextRole);
    if (walkthroughOpen) {
      const firstForRole = walkthroughSteps.findIndex((step) => step.role === nextRole);
      setWalkthroughStepIndex(firstForRole === -1 ? 0 : firstForRole);
    }
  }

  function captureSelection(setter: (value: string) => void, setErr: (value: string | null) => void) {
    if (typeof window === 'undefined') return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) { setErr('יש לסמן קודם טקסט מתוך תגובת המודל.'); return; }
    const range = selection.getRangeAt(0);
    if (!textRef.current || !textRef.current.contains(range.commonAncestorContainer)) { setErr('יש לבחור טקסט מתוך אזור תגובת המודל בלבד.'); return; }
    const quote = selection.toString().replace(/\s+/g, ' ').trim();
    if (!quote) { setErr('הסימון ריק.'); return; }
    setter(quote);
    setErr(null);
    selection.removeAllRanges();
  }

  function toggleCriterion(idValue: string) {
    setCriteriaByScenario((current) => {
      const currentSelected = current[scenarioId] ?? criteriaCatalog.slice(0, 3).map((c) => c.id);
      const next = currentSelected.includes(idValue) ? currentSelected.filter((item) => item !== idValue) : [...currentSelected, idValue];
      return { ...current, [scenarioId]: next };
    });
  }

  function setBuilderSectionCount(nextCount: number) {
    setBuilderSectionCountByScenario((current) => ({ ...current, [scenarioId]: Math.max(1, Math.min(3, Math.round(nextCount))) }));
  }
  function setBuilderMode(nextMode: 'natural' | 'balanced_errors') {
    setBuilderModeByScenario((current) => ({ ...current, [scenarioId]: nextMode }));
  }
  function runBuilderPreview() {
    setBuilderPreviewVersionByScenario((current) => ({ ...current, [scenarioId]: (current[scenarioId] ?? 0) + 1 }));
  }

  function runDemoAgents() {
    if (selectedCriteria.length === 0) { setInstructorError('יש לבחור לפחות קריטריון אחד לפני הרצת סוכני הדמו.'); return; }
    setActiveSystemFindingIndex(0);
    setAgentRunsByScenario((current) => ({ ...current, [scenarioId]: (current[scenarioId] ?? 0) + 1 }));
    setInstructorError(null);
  }

  function updateWeight(type: AnnotationType, value: number) {
    setWeightsByScenario((current) => ({ ...current, [scenarioId]: { ...(current[scenarioId] ?? defaultWeights), [type]: value } }));
  }

  function saveInstructorTag() {
    if (!instructorSelection) { setInstructorError('יש ללכוד קודם טקסט מסומן לפני שמירת תגית מרצה.'); return; }
    if (!instructorNote.trim() || !instructorFollowup.trim()) { setInstructorError('יש למלא גם נימוק וגם הנחיית המשך.'); return; }
    setInstructorTags((current) => [{ id: genId(), scenarioId, quote: instructorSelection, tag: instructorTag, note: instructorNote.trim(), followup: instructorFollowup.trim() }, ...current]);
    setInstructorSelection(''); setInstructorNote(''); setInstructorFollowup(''); setInstructorError(null);
  }

  function saveStudentDraft() {
    if (!studentSelection) { setStudentError('יש ללכוד קודם טקסט מסומן לפני שמירה.'); return; }
    if (!studentWhy.trim() || !studentFix.trim() || !studentVerify.trim() || !studentEvidence.trim()) { setStudentError('יש למלא את כל שדות ההסבר לפני שמירה.'); return; }
    setStudentDrafts((current) => [{ id: genId(), scenarioId, quote: studentSelection, tag: studentTag, why: studentWhy.trim(), fix: studentFix.trim(), verify: studentVerify.trim(), evidence: studentEvidence.trim() }, ...current]);
    setStudentSelection(''); setStudentWhy(''); setStudentFix(''); setStudentVerify(''); setStudentEvidence(''); setStudentError(null);
  }

  function submitStudentDemo() {
    if (studentScenarioDrafts.length < progressTarget) { setStudentError(`יש להוסיף לפחות ${progressTarget} תיוגים לפני הגשה.`); return; }
    setStudentSubmittedByScenario((current) => ({ ...current, [scenarioId]: true }));
    setStudentError(null);
  }

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.title}>דמו אינטראקטיבי</h1>
            <p className={styles.subtitle}>
              סימולציית פרונט מלאה: הגדרת מרצה + סקירה משוקללת, ותהליך תיוג ואימות של סטודנט.
              הכול נטען מדמו מקודד מראש וללא שמירה למסד נתונים.
            </p>
          </div>
          <Link href="/" className={styles.backLink}>חזרה למסך כניסה</Link>
        </div>

        <section className={styles.introPanel}>
          <p className={styles.introEyebrow}>{showcaseIntro.eyebrow}</p>
          <h2 className={styles.introTitle}>{showcaseIntro.title}</h2>
          <p className={styles.introText}>{showcaseIntro.rationale}</p>
          <div className={styles.introActions}>
            <button type="button" className={styles.introModalBtn} onClick={() => setPedagogyModalOpen(true)}>
              עקרונות פדגוגיים ומתודולוגיה
            </button>
          </div>
        </section>

        <section className={styles.valueStrip}>
          <p className={styles.valueStripTitle}>למה כדאי לאמץ את המערכת</p>
          <div className={styles.valueStripGrid}>
            <article className={styles.valueCard}>
              <p className={styles.valueCardTitle}>חיסכון בזמן למרצה</p>
              <p className={styles.valueCardText}>סינון ראשוני אוטומטי מאפשר להתמקד בהחלטות פדגוגיות במקום באיתור ידני.</p>
            </article>
            <article className={styles.valueCard}>
              <p className={styles.valueCardTitle}>אימות אקדמי לסטודנט</p>
              <p className={styles.valueCardText}>הסטודנט מתרגל בדיקת מקורות, נימוק מקצועי ותיקון מנומק במקום קבלה עיוורת של טקסט AI.</p>
            </article>
            <article className={styles.valueCard}>
              <p className={styles.valueCardTitle}>הערכה עקבית ושקופה</p>
              <p className={styles.valueCardText}>תיוגים מובנים ומשקלים ברורים מייצרים שפה משותפת בין הוראה, בדיקה ומשוב.</p>
            </article>
          </div>
          <div className={styles.quickTourActions}>
            <button type="button" className={styles.quickTourBtnPrimary} onClick={() => jumpToWalkthroughRole('instructor')}>הדגמת מרצה</button>
            <button type="button" className={styles.quickTourBtn} onClick={() => jumpToWalkthroughRole('student')}>הדגמת סטודנט</button>
          </div>
        </section>

        <InstructorPreviewPanel
          roleMode={roleMode}
          activeInstructorTarget={activeInstructorTarget}
          instructorStepCompletion={instructorStepCompletion}
          journeySteps={instructorJourneyStepsBlueprint}
          builderSectionCount={builderSectionCount}
          builderMode={builderMode}
          selectedCriteriaCount={selectedCriteria.length}
          agentRuns={agentRuns}
          displayedFindingsCount={displayedFindings.length}
          instructorTagsCount={instructorScenarioTags.length}
          onJumpToInstructorStep={jumpToInstructorStep}
        />

        <div className={styles.roleToggle}>
          <button type="button" onClick={() => changeRoleMode('instructor')} onTouchEnd={() => changeRoleMode('instructor')}
            aria-pressed={roleMode === 'instructor'} className={`${styles.roleBtn} ${roleMode === 'instructor' ? styles.roleBtnActive : ''}`}>מבט מרצה</button>
          <button type="button" onClick={() => changeRoleMode('student')} onTouchEnd={() => changeRoleMode('student')}
            aria-pressed={roleMode === 'student'} className={`${styles.roleBtn} ${roleMode === 'student' ? styles.roleBtnActive : ''}`}>מבט סטודנט</button>
        </div>

        <p className={styles.roleModeBanner} data-mode={roleMode} aria-live="polite">{roleModeBanner}</p>

        <section className={styles.walkthroughPanel}>
          <div>
            <p className={styles.walkthroughTitle}>סיור מודרך</p>
            {!walkthroughOpen && (
              <p className={styles.walkthroughText}>הפעילו סיור מודרך של 60 שניות. לחיצה על "הבא" תעביר אתכם אוטומטית בין כל היכולות ותבצע מעבר בין מבט מרצה למבט סטודנט.</p>
            )}
            {walkthroughOpen && activeWalkthroughStep && (
              <>
                <p className={styles.walkthroughStepMeta}>שלב {walkthroughStepIndex + 1} מתוך {walkthroughSteps.length} | {activeWalkthroughStep.role === 'instructor' ? 'מבט מרצה' : 'מבט סטודנט'}</p>
                <p className={styles.walkthroughText}>הטיפ הצף מסמן עכשיו: {activeWalkthroughStep.title}</p>
              </>
            )}
          </div>
          <div className={styles.walkthroughActions}>
            {!walkthroughOpen && (
              <button type="button" className={styles.walkthroughBtnPrimary} onClick={startWalkthrough}>התחלת סיור (60 שניות)</button>
            )}
            {walkthroughOpen && (
              <p className={styles.walkthroughHint}>הסיור פעיל: עקבו אחרי הטיפ הצף על המסך.</p>
            )}
          </div>
        </section>

        <section className={`${styles.panel} ${roleMode === 'instructor' ? styles.panelInstructor : styles.panelStudent}`}>
          <header className={styles.panelHeader}>
            <span className={styles.fieldChip}>{scenario.field}</span>
            <div className={styles.counter}>תרחיש {activeIndex + 1} מתוך {showcaseScenarios.length}</div>
            <div className={styles.nav}>
              <button type="button" className={styles.navBtn} onClick={() => setActiveIndex((prev) => getNextIndex(prev, -1, showcaseScenarios.length))}>הקודם</button>
              <button type="button" className={styles.navBtn} onClick={() => setActiveIndex((prev) => getNextIndex(prev, 1, showcaseScenarios.length))}>הבא</button>
            </div>
          </header>

          <div className={styles.content}>
            <div id="tour-left-context" className={isWalkthroughTarget('tour-left-context') ? styles.walkthroughTargetActive : ''}>
              <h2 className={styles.heading}>{scenario.title}</h2>
              <p className={styles.metaTitle}><strong>כותרת מטלה:</strong> {scenario.assignmentTitle}</p>
              <div className={styles.section}>
                <p className={styles.sectionLabel}>פרומפט טעון מראש</p>
                <p className={styles.sectionText}>{scenario.prompt}</p>
              </div>
              <div className={styles.section}>
                <p className={styles.sectionLabel}>דרישות</p>
                <p className={styles.sectionText}>{scenario.requirements}</p>
              </div>
              <div id="tour-model-text" className={`${styles.section} ${isWalkthroughTarget('tour-model-text') ? styles.walkthroughTargetActive : ''}`}>
                <p className={styles.sectionLabel}>טקסט תגובת המודל{' '}{agentRuns > 0 ? '(עם סימונים אוטומטיים לאחר הרצת דמו)' : '(סמנו טקסט לתיוג)'}</p>
                <div ref={textRef} className={styles.annotatedText}>{renderedModelText}</div>
              </div>
            </div>

            <div>
              <div className={styles.roleCard} data-mode={roleMode}>
                <p className={styles.roleTitle}>{roleTitle}</p>
                <ul className={styles.list}>
                  {roleSteps.map((step) => (<li key={step} className={styles.listItem}>{step}</li>))}
                </ul>
              </div>

              {roleMode === 'instructor' && (
                <InstructorView
                  isWalkthroughTarget={isWalkthroughTarget}
                  builderSectionCount={builderSectionCount}
                  builderMode={builderMode}
                  builderPreviewVersion={builderPreviewVersion}
                  activeBlueprintSections={activeBlueprintSections}
                  selectedCriteria={selectedCriteria}
                  selectedCriterionTitles={selectedCriterionTitles}
                  criteriaCatalog={criteriaCatalog}
                  agentRuns={agentRuns}
                  weights={weights}
                  weightedSignal={weightedSignal}
                  systemFindingsVisible={systemFindingsVisible}
                  activeSystemFindingIndex={activeSystemFindingIndex}
                  displayedFindings={displayedFindings}
                  instructorSelection={instructorSelection}
                  instructorTag={instructorTag}
                  instructorNote={instructorNote}
                  instructorFollowup={instructorFollowup}
                  instructorError={instructorError}
                  calibrationQuestions={calibrationQuestions}
                  onSetBuilderSectionCount={setBuilderSectionCount}
                  onSetBuilderMode={setBuilderMode}
                  onRunBuilderPreview={runBuilderPreview}
                  onToggleCriterion={toggleCriterion}
                  onRunDemoAgents={runDemoAgents}
                  onSetActiveSystemFindingIndex={setActiveSystemFindingIndex}
                  onUpdateWeight={updateWeight}
                  onCaptureInstructorSelection={() => captureSelection(setInstructorSelection, setInstructorError)}
                  onSetInstructorTag={setInstructorTag}
                  onSetInstructorNote={setInstructorNote}
                  onSetInstructorFollowup={setInstructorFollowup}
                  onSaveInstructorTag={saveInstructorTag}
                />
              )}

              {roleMode === 'student' && (
                <StudentView
                  isWalkthroughTarget={isWalkthroughTarget}
                  studentProgress={studentProgress}
                  studentScenarioDrafts={studentScenarioDrafts}
                  progressTarget={progressTarget}
                  studentSubmitted={studentSubmitted}
                  studentSelection={studentSelection}
                  studentTag={studentTag}
                  studentWhy={studentWhy}
                  studentFix={studentFix}
                  studentVerify={studentVerify}
                  studentEvidence={studentEvidence}
                  studentError={studentError}
                  onCaptureStudentSelection={() => captureSelection(setStudentSelection, setStudentError)}
                  onSetStudentTag={setStudentTag}
                  onSetStudentWhy={setStudentWhy}
                  onSetStudentFix={setStudentFix}
                  onSetStudentVerify={setStudentVerify}
                  onSetStudentEvidence={setStudentEvidence}
                  onSaveStudentDraft={saveStudentDraft}
                  onSubmitStudentDemo={submitStudentDemo}
                />
              )}
            </div>
          </div>
        </section>

        <div className={styles.scenarioRail}>
          {showcaseScenarios.map((item, index) => (
            <button key={item.id} type="button" className={`${styles.scenarioBtn} ${index === activeIndex ? styles.scenarioBtnActive : ''}`} onClick={() => setActiveIndex(index)}>
              <p className={styles.scenarioBtnTitle}>{item.assignmentTitle}</p>
              <p className={styles.scenarioBtnField}>{item.field}</p>
            </button>
          ))}
        </div>

        <p className={styles.note}>מצב דמו סטטי: נתונים טעונים מראש בלבד, ללא שמירה למסד נתונים וללא קריאות API חיצוניות.</p>
      </div>

      <PedagogyModal open={pedagogyModalOpen} onClose={() => setPedagogyModalOpen(false)} />

      {walkthroughOpen && activeWalkthroughStep && tourTooltipStyle && (
        <WalkthroughTooltip
          activeStep={activeWalkthroughStep}
          stepIndex={walkthroughStepIndex}
          totalSteps={walkthroughSteps.length}
          tooltipStyle={tourTooltipStyle}
          onPrev={prevWalkthroughStep}
          onNext={nextWalkthroughStep}
          onStop={stopWalkthrough}
        />
      )}

      <div className={styles.stickyCta}>
        <p className={styles.stickyCtaText}>רוצים לנסות את המערכת בפועל?</p>
        <Link href="/" className={styles.stickyCtaButton}>מעבר למסך הדמו</Link>
      </div>
    </main>
  );
}
