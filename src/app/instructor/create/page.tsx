'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { he } from '@/locale/he';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  type DisciplinePresetId,
  type PlantedSignalId,
  PLANTED_SIGNAL_LIBRARY,
  getPlantedSignalPresetById,
  suggestPlantedSignalPreset,
  extractPlantedSignalIds,
  summarizePlantedSignalHints,
  upsertPlantedSignalBlock,
} from '@/lib/ai/planted-signals';
import type { PromptTemplate, GuidedSection } from '@/lib/types';
import {
  createEmptyGuidedSection,
  compactMultiline,
  mergeUniqueLines,
  resolvePresetForSignals,
} from '@/lib/form-utils';
import { WizardSidebar, type CreateWizardStep } from '@/components/instructor/create/WizardSidebar';
import { CreateTourPanel, type CreateTourStep } from '@/components/instructor/create/CreateTourPanel';
import { WizardStepCard } from '@/components/instructor/create/WizardStepCard';
import { DisciplinePresetGrid } from '@/components/instructor/create/DisciplinePresetGrid';
import { StrategyCards } from '@/components/instructor/create/StrategyCards';
import { TemplatePanel } from '@/components/instructor/create/TemplatePanel';
import { AdvancedPromptFields } from '@/components/instructor/create/AdvancedPromptFields';
import cardStyles from '@/components/instructor/create/WizardStepCard.module.css';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const TEMPLATE_STORAGE_KEY = 'audit-sandbox.prompt-templates.v1';
const CREATE_TOUR_AUTOSTART_KEY = 'h2eapps.instructor.create-tour.autostart.v1';
const MAX_GUIDED_SECTIONS = 3;
const DEFAULT_PLANTED_SIGNALS: PlantedSignalId[] = [
  'empty_fluent_paragraph',
  'overconfident_unsourced_claim',
  'causal_leap',
];
const DEFAULT_PLANTED_PRESET_ID: DisciplinePresetId = 'general_academic';

const CREATE_TOUR_STEPS: CreateTourStep[] = [
  {
    id: 'tour-title',
    title: 'כותרת ומטרה',
    description: 'מתחילים בכותרת ברורה שתעזור גם לך וגם לסטודנטים להבין מיד את מטרת המטלה.',
    targetId: 'tour-title',
  },
  {
    id: 'tour-signals',
    title: 'כשלים מתוכננים',
    description: 'בוחרים אילו כשלים פדגוגיים לשתול בטקסט. הכשלים ניתנים לזיהוי ולביקורת.',
    targetId: 'tour-signals',
  },
  {
    id: 'tour-settings',
    title: 'הגדרות יצירה',
    description: 'בוחרים אסטרטגיית יצירה, מקורות ואורך הטקסט.',
    targetId: 'tour-settings',
  },
  {
    id: 'tour-submit',
    title: 'סקירה ויצירה',
    description: 'בודקים את כל הבחירות ויוצרים את המטלה.',
    targetId: 'tour-submit',
  },
];

/* ------------------------------------------------------------------ */
/* Sub-step definitions                                                */
/* ------------------------------------------------------------------ */

type SubStepDef = {
  mainStep: number;
  question: string;
  explanation: string;
  example?: string;
  impactLabels?: string[];
};

const SUB_STEPS: SubStepDef[] = [
  // Step 0: Context & Topic
  {
    mainStep: 0,
    question: 'איך קוראים למטלה הזו?',
    explanation: 'כותרת קצרה וברורה שתסביר מה המטלה. הכותרת מופיעה גם בממשק הסטודנט/ית.',
    example: 'למשל: ניתוח ביקורתי של מקורות בתחום הפסיכולוגיה החברתית',
    impactLabels: ['יצירת טקסט ✓', 'ביקורת ✓'],
  },
  {
    mainStep: 0,
    question: 'באיזה תחום אקדמי?',
    explanation: 'בחירת תחום תתאים אוטומטית את סוג הכשלים המתוכננים. ניתן לשנות בהמשך.',
    impactLabels: ['כשלים מתוכננים ✓'],
  },
  {
    mainStep: 0,
    question: 'מה הסטודנט/ית צריך/ה לעשות?',
    explanation: 'תארו ב-2-3 משפטים את המשימה המרכזית: ניתוח, השוואה, ביקורת, או יישום.',
    example: 'למשל: נתחו את הטענה לפי שני מקורות קורס ובצעו השוואה ביקורתית.',
    impactLabels: ['יצירת טקסט ✓', 'ביקורת ✓'],
  },
  // Step 1: Planted Signals
  {
    mainStep: 1,
    question: 'אילו כשלים לשתול?',
    explanation: 'בחרו כשלים פדגוגיים שיישתלו בטקסט. הסטודנטים ילמדו לזהות ולנמק אותם.',
    impactLabels: ['יצירת טקסט ✓', 'ביקורת — זיהוי מועדף ✓'],
  },
  {
    mainStep: 1,
    question: 'לכמה חלקים לחלק?',
    explanation: 'אפשר לחלק את המטלה עד 3 חלקים עם שאלות נפרדות. חלק אחד מספיק לרוב המטלות.',
    example: 'למשל: חלק 1 — ניתוח טענה, חלק 2 — ביקורת מקורות',
    impactLabels: ['יצירת טקסט ✓', 'ביקורת ✓'],
  },
  {
    mainStep: 1,
    question: 'מה חייב להופיע בתשובה טובה?',
    explanation: 'קריטריונים שמגדירים תשובה איכותית. כל קריטריון ישפיע על יצירת הטקסט וגם על הביקורת.',
    example: 'למשל: ביסוס טענה מרכזית, ציטוט משני מקורות, הסתייגות מתודולוגית',
    impactLabels: ['יצירת טקסט ✓', 'ביקורת ✓'],
  },
  // Step 2: Settings
  {
    mainStep: 2,
    question: 'איזה סוג טקסט ליצור?',
    explanation: 'האסטרטגיה קובעת איך הכשלים נשתלים בטקסט. מומלץ "שגיאות מאוזנות" כשיש כשלים מתוכננים.',
    impactLabels: ['יצירת טקסט ✓'],
  },
  {
    mainStep: 2,
    question: 'יש מקורות שהטקסט צריך להתייחס אליהם?',
    explanation: 'הוסיפו מקורות קורס, מאמרים או ספרים. הטקסט שנוצר יתייחס אליהם באופן ישיר.',
    example: 'למשל: Kahneman, D. (2011). Thinking, Fast and Slow.',
    impactLabels: ['יצירת טקסט ✓', 'ביקורת ✓'],
  },
  {
    mainStep: 2,
    question: 'מה אורך הטקסט הרצוי?',
    explanation: 'טווח מומלץ: 300-700 מילים. למטלות עמוסות אפשר להעלות עד 1200.',
    impactLabels: ['יצירת טקסט ✓'],
  },
  {
    mainStep: 2,
    question: 'כמה גרסאות טקסט ליצור?',
    explanation: 'מספר הטקסטים שהמערכת תיצור. מומלץ 3 לפחות לצורך כיול, השוואה ותרגול.',
    impactLabels: ['יצירת טקסט ✓'],
  },
  // Step 3: Review & Create
  {
    mainStep: 3,
    question: 'הכול מוכן — סקירה אחרונה',
    explanation: 'בדקו את כל הבחירות לפני יצירת המטלה. אפשר לחזור לכל שלב ולשנות.',
  },
];

const MAIN_STEPS: CreateWizardStep[] = [
  {
    id: 'step-context',
    label: '1. הקשר ונושא',
    description: 'כותרת, תחום ומשימת הסטודנט/ית.',
    subStepCount: 3,
  },
  {
    id: 'step-signals',
    label: '2. כשלים מתוכננים',
    description: 'בחירת כשלים, חלוקה לחלקים, קריטריונים.',
    subStepCount: 3,
  },
  {
    id: 'step-settings',
    label: '3. הגדרות יצירה',
    description: 'אסטרטגיה, מקורות, אורך וגרסאות.',
    subStepCount: 4,
  },
  {
    id: 'step-review',
    label: '4. סקירה ויצירה',
    description: 'בדיקה אחרונה ויצירת המטלה.',
    subStepCount: 1,
  },
];

/* ------------------------------------------------------------------ */
/* Page component                                                      */
/* ------------------------------------------------------------------ */

export default function CreateAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  /* Form fields */
  const [title, setTitle] = useState('');
  const [courseContext, setCourseContext] = useState('');
  const [requirements, setRequirements] = useState('');
  const [knownPitfalls, setKnownPitfalls] = useState('');
  const [referenceMaterial, setReferenceMaterial] = useState('');
  const [sectionBlueprint, setSectionBlueprint] = useState('');
  const [evaluationCriteria, setEvaluationCriteria] = useState('');
  const [exemplarNotes, setExemplarNotes] = useState('');
  const [generationStrategy, setGenerationStrategy] = useState<'natural' | 'balanced_errors' | 'strict_truth'>('balanced_errors');
  const [studentCount, setStudentCount] = useState(3);

  /* Planted signals */
  const [selectedPlantedSignals, setSelectedPlantedSignals] = useState<PlantedSignalId[]>(DEFAULT_PLANTED_SIGNALS);
  const [selectedPresetId, setSelectedPresetId] = useState<DisciplinePresetId>(DEFAULT_PLANTED_PRESET_ID);
  const [presetPinnedByUser, setPresetPinnedByUser] = useState(false);

  /* Guided builder fields */
  const [guidedTask, setGuidedTask] = useState('');
  const [guidedCriteria, setGuidedCriteria] = useState('');
  const [guidedSectionCount, setGuidedSectionCount] = useState(1);
  const [guidedSectionItems, setGuidedSectionItems] = useState<GuidedSection[]>([
    createEmptyGuidedSection(1),
  ]);
  const [guidedObstacles, setGuidedObstacles] = useState('');
  const [guidedSources, setGuidedSources] = useState('');
  const [guidedWordLimit, setGuidedWordLimit] = useState(500);

  /* Templates */
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateMessage, setTemplateMessage] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  /* Advanced mode */
  const [showAdvanced, setShowAdvanced] = useState(false);
  // promptText is now built at submit time — but we keep it for advanced mode
  const [promptText, setPromptText] = useState('');

  /* Tour */
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  /* Sub-step wizard */
  const [globalSubStep, setGlobalSubStep] = useState(0);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  const tourQuery = searchParams.get('tour');

  /* Derived: current main step from global sub-step */
  const currentMainStep = useMemo(() => SUB_STEPS[globalSubStep]?.mainStep ?? 0, [globalSubStep]);
  const currentSubStepWithinMain = useMemo(() => {
    const mainIdx = SUB_STEPS[globalSubStep]?.mainStep ?? 0;
    let count = 0;
    for (let i = 0; i < globalSubStep; i++) {
      if (SUB_STEPS[i].mainStep === mainIdx) count++;
    }
    return count;
  }, [globalSubStep]);

  /* ---------------------------------------------------------------- */
  /* Effects                                                           */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const sanitized = parsed
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const value = item as Partial<PromptTemplate>;
          if (!value.id || !value.name || !value.promptText) return null;
          return {
            id: String(value.id),
            name: String(value.name),
            title: String(value.title ?? ''),
            promptText: String(value.promptText ?? ''),
            courseContext: String(value.courseContext ?? ''),
            requirements: String(value.requirements ?? ''),
            knownPitfalls: String(value.knownPitfalls ?? ''),
            referenceMaterial: String(value.referenceMaterial ?? ''),
            sectionBlueprint: String(value.sectionBlueprint ?? ''),
            evaluationCriteria: String(value.evaluationCriteria ?? ''),
            exemplarNotes: String(value.exemplarNotes ?? ''),
            generationStrategy:
              value.generationStrategy === 'balanced_errors' || value.generationStrategy === 'strict_truth'
                ? value.generationStrategy
                : 'natural',
            studentCount:
              typeof value.studentCount === 'number' && Number.isFinite(value.studentCount)
                ? Math.max(1, Math.min(50, Math.round(value.studentCount)))
                : 3,
            createdAt: String(value.createdAt ?? ''),
            updatedAt: String(value.updatedAt ?? ''),
          } satisfies PromptTemplate;
        })
        .filter((item): item is PromptTemplate => Boolean(item));
      setTemplates(sanitized);
    } catch {
      // Keep form usable even with bad local template data.
    }
  }, []);

  useEffect(() => {
    if (!knownPitfalls.includes('[PLANTED_SIGNALS]')) return;
    const ids = extractPlantedSignalIds(knownPitfalls);
    setSelectedPlantedSignals(ids);
    setSelectedPresetId(resolvePresetForSignals(ids));
    setPresetPinnedByUser(true);
  }, [knownPitfalls]);

  const activeCreateTourStep = useMemo(() => {
    if (!tourOpen || CREATE_TOUR_STEPS.length === 0) return null;
    return CREATE_TOUR_STEPS[Math.min(tourStepIndex, CREATE_TOUR_STEPS.length - 1)];
  }, [tourOpen, tourStepIndex]);

  const activeMainStep = useMemo(() => {
    return MAIN_STEPS[Math.min(currentMainStep, MAIN_STEPS.length - 1)];
  }, [currentMainStep]);

  const activeSections = useMemo(
    () => guidedSectionItems.slice(0, guidedSectionCount),
    [guidedSectionItems, guidedSectionCount]
  );
  const allSectionTasksFilled = useMemo(
    () => activeSections.every((section) => section.task.trim().length > 0),
    [activeSections]
  );
  const hasAnyCriteria = useMemo(
    () =>
      guidedCriteria.trim().length > 0 ||
      activeSections.some((section) => section.criteria.trim().length > 0),
    [guidedCriteria, activeSections]
  );
  const hasMinimumRequiredFields = useMemo(
    () =>
      title.trim().length > 0 &&
      guidedTask.trim().length > 0 &&
      allSectionTasksFilled &&
      hasAnyCriteria &&
      Number.isInteger(studentCount) &&
      studentCount >= 1 &&
      studentCount <= 50,
    [title, guidedTask, allSectionTasksFilled, hasAnyCriteria, studentCount]
  );

  const stepCompletion = useMemo(
    () => [
      title.trim().length > 0 && guidedTask.trim().length > 0,
      selectedPlantedSignals.length > 0 || guidedCriteria.trim().length > 0,
      generationStrategy.length > 0 && studentCount >= 1 && studentCount <= 50,
      hasMinimumRequiredFields,
    ],
    [
      title,
      guidedTask,
      selectedPlantedSignals,
      guidedCriteria,
      generationStrategy,
      studentCount,
      hasMinimumRequiredFields,
    ]
  );

  const completedCount = useMemo(
    () => stepCompletion.filter(Boolean).length,
    [stepCompletion]
  );

  const presetSuggestion = useMemo(
    () =>
      suggestPlantedSignalPreset({
        title,
        courseContext,
        task: guidedTask,
        requirements,
        sectionBlueprint,
        referenceMaterial,
      }),
    [title, courseContext, guidedTask, requirements, sectionBlueprint, referenceMaterial]
  );

  useEffect(() => {
    if (presetPinnedByUser) return;
    if (selectedPresetId === presetSuggestion.presetId) return;
    setSelectedPresetId(presetSuggestion.presetId);
  }, [presetPinnedByUser, presetSuggestion.presetId, selectedPresetId]);

  useEffect(() => {
    const shouldAutoStart =
      tourQuery === '1' ||
      window.localStorage.getItem(CREATE_TOUR_AUTOSTART_KEY) === '1';
    if (!shouldAutoStart) return;
    setTourStepIndex(0);
    setTourOpen(true);
    window.localStorage.removeItem(CREATE_TOUR_AUTOSTART_KEY);
  }, [tourQuery]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 980px)');
    const onChange = () => setIsNarrowScreen(media.matches);
    onChange();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  /* ---------------------------------------------------------------- */
  /* Navigation                                                        */
  /* ---------------------------------------------------------------- */

  function goToSubStep(index: number) {
    setGlobalSubStep(Math.max(0, Math.min(SUB_STEPS.length - 1, index)));
  }

  function nextSubStep() {
    if (globalSubStep < SUB_STEPS.length - 1) {
      setGlobalSubStep(globalSubStep + 1);
    }
  }

  function prevSubStep() {
    if (globalSubStep > 0) {
      setGlobalSubStep(globalSubStep - 1);
    }
  }

  function jumpToMainStep(mainIndex: number) {
    // Find the first sub-step of the target main step
    const target = SUB_STEPS.findIndex(s => s.mainStep === mainIndex);
    if (target >= 0) setGlobalSubStep(target);
  }

  function moveMainStep(direction: 'next' | 'prev') {
    const nextMain = direction === 'next' ? currentMainStep + 1 : currentMainStep - 1;
    if (nextMain >= 0 && nextMain < MAIN_STEPS.length) {
      jumpToMainStep(nextMain);
    }
  }

  /* Tour navigation */
  function startTour() {
    setTourStepIndex(0);
    setTourOpen(true);
  }

  function closeTour() {
    setTourOpen(false);
    setTourStepIndex(0);
  }

  function moveTourStep(direction: 'next' | 'prev') {
    setTourStepIndex((current) => {
      if (direction === 'prev') return Math.max(0, current - 1);
      return Math.min(CREATE_TOUR_STEPS.length - 1, current + 1);
    });
  }

  useEffect(() => {
    if (!tourOpen) return;
    const targetMainStep = Math.max(0, Math.min(MAIN_STEPS.length - 1, tourStepIndex));
    jumpToMainStep(targetMainStep);
  }, [tourOpen, tourStepIndex]);

  /* ---------------------------------------------------------------- */
  /* Template handlers                                                 */
  /* ---------------------------------------------------------------- */

  function persistTemplates(next: PromptTemplate[]) {
    setTemplates(next);
    window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(next));
  }

  function applyTemplate(template: PromptTemplate) {
    setTitle(template.title);
    setPromptText(template.promptText);
    setCourseContext(template.courseContext);
    setRequirements(template.requirements);
    setKnownPitfalls(template.knownPitfalls);
    setReferenceMaterial(template.referenceMaterial);
    setSectionBlueprint(template.sectionBlueprint);
    setEvaluationCriteria(template.evaluationCriteria);
    setExemplarNotes(template.exemplarNotes);
    setGenerationStrategy(template.generationStrategy);
    const extractedSignals = extractPlantedSignalIds(template.knownPitfalls);
    if (extractedSignals.length > 0) {
      setSelectedPlantedSignals(extractedSignals);
      setSelectedPresetId(resolvePresetForSignals(extractedSignals));
      setPresetPinnedByUser(true);
    } else {
      setSelectedPresetId(DEFAULT_PLANTED_PRESET_ID);
      setPresetPinnedByUser(false);
    }
    setStudentCount(template.studentCount);
    setShowAdvanced(true);
  }

  function handleSaveTemplate() {
    const name = templateName.trim();
    if (!name) { setTemplateMessage(he.instructor.templateNameRequired); return; }
    const builtPrompt = buildPromptText();
    if (!builtPrompt.trim()) { setTemplateMessage(he.instructor.templatePromptRequired); return; }
    const now = new Date().toISOString();
    const existing = templates.find((item) => item.name.toLowerCase() === name.toLowerCase());
    const nextTemplate: PromptTemplate = {
      id: existing?.id ?? `tpl_${Date.now()}`,
      name,
      title: title.trim(),
      promptText: builtPrompt.trim(),
      courseContext: courseContext.trim(),
      requirements: requirements.trim(),
      knownPitfalls: upsertPlantedSignalBlock(knownPitfalls.trim(), selectedPlantedSignals),
      referenceMaterial: referenceMaterial.trim(),
      sectionBlueprint: sectionBlueprint.trim(),
      evaluationCriteria: evaluationCriteria.trim(),
      exemplarNotes: exemplarNotes.trim(),
      generationStrategy,
      studentCount,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const next = existing
      ? templates.map((item) => (item.id === existing.id ? nextTemplate : item))
      : [nextTemplate, ...templates];
    persistTemplates(next);
    setSelectedTemplateId(nextTemplate.id);
    setTemplateName('');
    setTemplateMessage(existing ? he.instructor.templateUpdated : he.instructor.templateSaved);
  }

  function handleLoadTemplate() {
    if (!selectedTemplateId) { setTemplateMessage(he.instructor.templateSelectFirst); return; }
    const template = templates.find((item) => item.id === selectedTemplateId);
    if (!template) { setTemplateMessage(he.instructor.templateNotFound); return; }
    applyTemplate(template);
    setTemplateMessage(he.instructor.templateLoaded);
  }

  function handleDeleteTemplate() {
    if (!selectedTemplateId) { setTemplateMessage(he.instructor.templateSelectFirst); return; }
    const next = templates.filter((item) => item.id !== selectedTemplateId);
    persistTemplates(next);
    setSelectedTemplateId('');
    setTemplateMessage(he.instructor.templateDeleted);
  }

  function sanitizeImportedTemplates(raw: unknown): PromptTemplate[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const value = item as Partial<PromptTemplate>;
        if (!value.name || !value.promptText) return null;
        const now = new Date().toISOString();
        return {
          id: typeof value.id === 'string' && value.id.trim() ? value.id : `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: String(value.name).trim(),
          title: String(value.title ?? ''),
          promptText: String(value.promptText ?? ''),
          courseContext: String(value.courseContext ?? ''),
          requirements: String(value.requirements ?? ''),
          knownPitfalls: String(value.knownPitfalls ?? ''),
          referenceMaterial: String(value.referenceMaterial ?? ''),
          sectionBlueprint: String(value.sectionBlueprint ?? ''),
          evaluationCriteria: String(value.evaluationCriteria ?? ''),
          exemplarNotes: String(value.exemplarNotes ?? ''),
          generationStrategy:
            value.generationStrategy === 'balanced_errors' || value.generationStrategy === 'strict_truth'
              ? value.generationStrategy
              : 'natural',
          studentCount:
            typeof value.studentCount === 'number' && Number.isFinite(value.studentCount)
              ? Math.max(1, Math.min(50, Math.round(value.studentCount)))
              : 3,
          createdAt: typeof value.createdAt === 'string' && value.createdAt ? value.createdAt : now,
          updatedAt: now,
        } satisfies PromptTemplate;
      })
      .filter((item): item is PromptTemplate => Boolean(item));
  }

  function handleExportTemplates() {
    if (templates.length === 0) { setTemplateMessage(he.instructor.templateExportEmpty); return; }
    const payload = JSON.stringify(templates, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-sandbox-templates-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setTemplateMessage(he.instructor.templateExported);
  }

  async function handleImportTemplatesFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const imported = sanitizeImportedTemplates(parsed);
      if (imported.length === 0) { setTemplateMessage(he.instructor.templateImportInvalid); return; }
      const byName = new Map<string, PromptTemplate>();
      for (const existing of templates) byName.set(existing.name.toLowerCase(), existing);
      for (const entry of imported) {
        const key = entry.name.toLowerCase();
        const prev = byName.get(key);
        byName.set(key, { ...entry, id: prev?.id ?? entry.id, createdAt: prev?.createdAt ?? entry.createdAt, updatedAt: new Date().toISOString() });
      }
      const merged = Array.from(byName.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      persistTemplates(merged);
      setTemplateMessage(he.instructor.templateImported.replace('{count}', String(imported.length)));
    } catch {
      setTemplateMessage(he.instructor.templateImportFailed);
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  }

  /* ---------------------------------------------------------------- */
  /* Guided builder helpers                                            */
  /* ---------------------------------------------------------------- */

  function updateGuidedSection(id: string, field: keyof GuidedSection, value: string) {
    setGuidedSectionItems((prev) =>
      prev.map((section) => (section.id === id ? { ...section, [field]: value } : section))
    );
  }

  function setGuidedSectionCountAndSync(nextCount: number) {
    const count = Math.max(1, Math.min(MAX_GUIDED_SECTIONS, Math.round(nextCount)));
    setGuidedSectionCount(count);
    setGuidedSectionItems((prev) => {
      if (prev.length === count) return prev;
      if (prev.length > count) return prev.slice(0, count);
      const next = [...prev];
      while (next.length < count) next.push(createEmptyGuidedSection(next.length + 1));
      return next;
    });
  }

  /* ---------------------------------------------------------------- */
  /* Planted signal handlers                                           */
  /* ---------------------------------------------------------------- */

  function togglePlantedSignal(signalId: PlantedSignalId) {
    setPresetPinnedByUser(true);
    setSelectedPlantedSignals((prev) => {
      const next = prev.includes(signalId) ? prev.filter((id) => id !== signalId) : [...prev, signalId];
      setSelectedPresetId(resolvePresetForSignals(next));
      return next;
    });
  }

  function handleApplyDisciplinePreset(presetId: DisciplinePresetId) {
    const preset = getPlantedSignalPresetById(presetId);
    if (!preset) return;
    const presetHints = summarizePlantedSignalHints(preset.signalIds, 'generation');
    setPresetPinnedByUser(true);
    setSelectedPresetId(preset.id);
    setSelectedPlantedSignals(preset.signalIds);
    setGuidedObstacles((prev) => mergeUniqueLines(prev, presetHints));
    setKnownPitfalls((prev) => mergeUniqueLines(prev, presetHints));
    setGenerationStrategy('balanced_errors');
  }

  /* ---------------------------------------------------------------- */
  /* Prompt building — pure function                                   */
  /* ---------------------------------------------------------------- */

  function buildPromptText(): string {
    // If user edited prompt directly in advanced mode, use that
    if (showAdvanced && promptText.trim()) {
      return promptText.trim();
    }

    const normalizedSections = guidedSectionItems
      .map((section, index) => ({
        ...section,
        order: index + 1,
        title: compactMultiline(section.title),
        task: compactMultiline(section.task),
        criteria: compactMultiline(section.criteria),
        pitfalls: compactMultiline(section.pitfalls),
      }));

    const wordLimit = Math.max(150, Math.min(1200, Math.round(guidedWordLimit || 500)));
    const criteriaList = [
      compactMultiline(guidedCriteria),
      ...normalizedSections.map((section) => section.criteria).filter(Boolean),
    ].filter(Boolean);
    const pitfallsList = [
      compactMultiline(guidedObstacles),
      ...normalizedSections.map((section) => section.pitfalls).filter(Boolean),
      ...summarizePlantedSignalHints(selectedPlantedSignals, 'generation'),
    ].filter(Boolean);

    const sectionsBlock = normalizedSections.some(s => s.task)
      ? `\n- המטלה מחולקת לחלקים. יש להתייחס לכל חלק בנפרד ולפי הסדר.\n${normalizedSections
          .filter(s => s.task)
          .map((section) =>
            [
              `חלק ${section.order}: ${section.title || `חלק ${section.order}`}`,
              `שאלת החלק: ${section.task}`,
              section.criteria ? `קריטריונים לחלק: ${section.criteria}` : '',
              section.pitfalls ? `מוקדי קושי רצויים לזיהוי: ${section.pitfalls}` : '',
            ]
              .filter(Boolean)
              .join('\n')
          )
          .join('\n\n')}`
      : '';
    const criteriaBlock = criteriaList.length > 0
      ? `\n- קריטריונים שחייבים להופיע בתשובה:\n${criteriaList.join('\n')}`
      : '';
    const obstaclesBlock = pitfallsList.length > 0
      ? `\n- שלב/י באופן טבעי מוקדי קושי פדגוגיים לביקורת (בלי להצהיר על כך מפורשות):\n${pitfallsList.join('\n')}`
      : '';
    const plantedSignalBlock = selectedPlantedSignals.length > 0
      ? `\n- אותות כשל נשתלים (באופן טבעי, מעט מודגש, בלי לחשוף זאת):\n${selectedPlantedSignals
          .map((id) => {
            const signal = PLANTED_SIGNAL_LIBRARY.find((item) => item.id === id);
            return signal ? `• ${signal.label}: ${signal.generationHint}` : null;
          })
          .filter((line): line is string => Boolean(line))
          .join('\n')}`
      : '';
    const sourcesBlock = guidedSources.trim()
      ? `\n- השתמש/י בהפניות למקורות על בסיס הרשימה הבאה בלבד, ככל שרלוונטי:\n${guidedSources.trim()}`
      : '';

    return [
      `כתוב/כתבי תשובה אקדמית טבעית בעברית (RTL), עד ${wordLimit} מילים.`,
      'החזר/י טקסט תשובה בלבד ללא כותרות מערכת.',
      'אל תציין/י בשום אופן שהטקסט כולל אי-דיוקים או מלכודות.',
      'הגבּר/י קלות AI-isms (רצף לשוני רהוט, ביטחון גבוה בניסוח), אך השאר/י את הטקסט אמין.',
      guidedTask.trim() ? `משימת הסטודנט/ית: ${guidedTask.trim()}.` : '',
      sectionsBlock,
      criteriaBlock,
      obstaclesBlock,
      plantedSignalBlock,
      sourcesBlock,
    ]
      .filter(Boolean)
      .join('\n');
  }

  function buildDerivedFields() {
    const normalizedSections = guidedSectionItems
      .map((section, index) => ({
        ...section,
        order: index + 1,
        title: compactMultiline(section.title),
        task: compactMultiline(section.task),
        criteria: compactMultiline(section.criteria),
        pitfalls: compactMultiline(section.pitfalls),
      }));

    const wordLimit = Math.max(150, Math.min(1200, Math.round(guidedWordLimit || 500)));
    const criteriaList = [
      compactMultiline(guidedCriteria),
      ...normalizedSections.map((section) => section.criteria).filter(Boolean),
    ].filter(Boolean);
    const pitfallsList = [
      compactMultiline(guidedObstacles),
      ...normalizedSections.map((section) => section.pitfalls).filter(Boolean),
      ...summarizePlantedSignalHints(selectedPlantedSignals, 'generation'),
    ].filter(Boolean);

    const sectionBlueprintText = normalizedSections
      .filter(s => s.task)
      .map((section) =>
        [
          `חלק ${section.order}: ${section.title || `חלק ${section.order}`}`,
          `שאלה: ${section.task}`,
          section.criteria ? `קריטריונים: ${section.criteria}` : '',
          section.pitfalls ? `מוקדי קושי: ${section.pitfalls}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      )
      .join('\n\n');

    return {
      requirements: `עד ${wordLimit} מילים, עברית אקדמית טבעית, והחזרת טקסט תשובה בלבד.`,
      evaluationCriteria: criteriaList.join('\n'),
      knownPitfalls: upsertPlantedSignalBlock(pitfallsList.join('\n'), selectedPlantedSignals),
      referenceMaterial: guidedSources.trim(),
      sectionBlueprint: sectionBlueprintText,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Submit                                                            */
  /* ---------------------------------------------------------------- */

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setError('יש להזין כותרת למטלה לפני יצירה.');
      return;
    }
    if (!guidedTask.trim()) {
      setError('יש לתאר את משימת הסטודנט/ית לפני יצירה.');
      return;
    }
    if (!allSectionTasksFilled) {
      setError('יש להשלים שאלה לכל חלק במטלה לפני יצירה.');
      return;
    }
    if (!hasAnyCriteria) {
      setError('יש להזין לפחות קריטריון אחד להערכה לפני יצירה.');
      return;
    }
    if (!Number.isInteger(studentCount) || studentCount < 1 || studentCount > 50) {
      setError('כמות גרסאות חייבת להיות בין 1 ל-50.');
      return;
    }

    setSubmitting(true);
    setError('');

    // Build prompt and derived fields at submit time
    const builtPrompt = buildPromptText();
    const derived = buildDerivedFields();

    const normalizedKnownPitfalls = upsertPlantedSignalBlock(
      (showAdvanced ? knownPitfalls.trim() : derived.knownPitfalls),
      selectedPlantedSignals
    );
    const normalizedGenerationStrategy =
      selectedPlantedSignals.length > 0 && generationStrategy === 'natural'
        ? 'balanced_errors'
        : generationStrategy;

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          promptText: builtPrompt.trim(),
          courseContext: courseContext.trim() || undefined,
          requirements: (showAdvanced ? requirements.trim() : derived.requirements) || undefined,
          knownPitfalls: normalizedKnownPitfalls || undefined,
          referenceMaterial: (showAdvanced ? referenceMaterial.trim() : derived.referenceMaterial) || undefined,
          sectionBlueprint: (showAdvanced ? sectionBlueprint.trim() : derived.sectionBlueprint) || undefined,
          evaluationCriteria: (showAdvanced ? evaluationCriteria.trim() : derived.evaluationCriteria) || undefined,
          exemplarNotes: exemplarNotes.trim() || undefined,
          generationStrategy: normalizedGenerationStrategy,
          studentCount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'יצירת המטלה נכשלה');
      }

      router.push('/instructor');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת המטלה');
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Signal detail expand state                                        */
  /* ---------------------------------------------------------------- */
  const [expandedSignal, setExpandedSignal] = useState<PlantedSignalId | null>(null);

  /* ---------------------------------------------------------------- */
  /* Render helpers                                                    */
  /* ---------------------------------------------------------------- */

  const currentDef = SUB_STEPS[globalSubStep];

  function renderSubStepContent() {
    switch (globalSubStep) {
      // 0: Title
      case 0:
        return (
          <Input
            label={he.instructor.assignmentTitle}
            helpTooltip="שם קצר וברור למטלה"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        );

      // 1: Discipline preset
      case 1:
        return (
          <DisciplinePresetGrid
            selectedPresetId={selectedPresetId}
            suggestedPresetId={presetSuggestion.presetId}
            onSelect={(id) => handleApplyDisciplinePreset(id)}
          />
        );

      // 2: Task description
      case 2:
        return (
          <Textarea
            label="תיאור המשימה"
            helpTooltip="תארו במשפט-שניים מה הסטודנט/ית צריך/ה לעשות"
            value={guidedTask}
            onChange={(e) => setGuidedTask(e.target.value)}
            placeholder="למשל: נתחו את הטענות במאמר X לפי שני קריטריונים..."
            rows={4}
          />
        );

      // 3: Planted signals
      case 3:
        return (
          <>
            <div className={cardStyles.signalChipsWrap}>
              {PLANTED_SIGNAL_LIBRARY.map((signal) => {
                const active = selectedPlantedSignals.includes(signal.id);
                return (
                  <button
                    key={signal.id}
                    type="button"
                    className={cardStyles.signalChip}
                    data-active={active ? 'true' : 'false'}
                    onClick={() => {
                      togglePlantedSignal(signal.id);
                      setExpandedSignal(active ? null : signal.id);
                    }}
                  >
                    {signal.label}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
              נבחרו: {selectedPlantedSignals.length} כשלים
            </div>
            {expandedSignal && (() => {
              const signal = PLANTED_SIGNAL_LIBRARY.find(s => s.id === expandedSignal);
              if (!signal) return null;
              return (
                <div className={cardStyles.signalDetail}>
                  <div className={cardStyles.signalDetailLabel}>{signal.label}</div>
                  <div>ביצירה: {signal.generationHint}</div>
                  <div>בביקורת: {signal.auditHint}</div>
                  <div>חומרה: {signal.defaultSeverity === 'critical' ? 'קריטי' : signal.defaultSeverity === 'moderate' ? 'בינוני' : 'קל'}</div>
                </div>
              );
            })()}
          </>
        );

      // 4: Sections
      case 4:
        return (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3].map((count) => (
                <button
                  key={count}
                  type="button"
                  className={cardStyles.selectCard}
                  data-selected={guidedSectionCount === count ? 'true' : 'false'}
                  data-selectable
                  onClick={() => setGuidedSectionCountAndSync(count)}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  <div className={cardStyles.selectCardLabel}>{count} {count === 1 ? 'חלק' : 'חלקים'}</div>
                  <div className={cardStyles.selectCardDesc}>
                    {count === 1 ? 'מטלה אחידה' : count === 2 ? 'שני חלקים נפרדים' : 'שלושה חלקים'}
                  </div>
                </button>
              ))}
            </div>
            {activeSections.map((section, index) => (
              <div
                key={section.id}
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--card-hover)',
                  padding: 12,
                  display: 'grid',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                  חלק {index + 1}
                </div>
                <Input
                  label="כותרת החלק"
                  helpTooltip="למשל: שאלת תיאוריה, ניתוח מקרה"
                  value={section.title}
                  onChange={(e) => updateGuidedSection(section.id, 'title', e.target.value)}
                  placeholder="למשל: ניתוח לפי תיאוריה X"
                />
                <Textarea
                  label="שאלת החלק"
                  helpTooltip="מה הסטודנט/ית צריך/ה לעשות בחלק הזה"
                  value={section.task}
                  onChange={(e) => updateGuidedSection(section.id, 'task', e.target.value)}
                  placeholder="מה הסטודנט/ית צריך/ה לנתח בחלק הזה?"
                  rows={3}
                />
                <Textarea
                  label="קריטריונים לחלק (אופציונלי)"
                  helpTooltip="מה חייב להופיע בתשובה טובה בחלק הזה"
                  value={section.criteria}
                  onChange={(e) => updateGuidedSection(section.id, 'criteria', e.target.value)}
                  placeholder="למשל: הגדרה מדויקת של מושג, נימוק מבוסס מקור"
                  rows={3}
                />
                <Textarea
                  label="מוקדי קושי לחלק (אופציונלי)"
                  helpTooltip="אילו טעויות נפוצות או בלבולים חשוב לשלב לזיהוי ביקורתי"
                  value={section.pitfalls}
                  onChange={(e) => updateGuidedSection(section.id, 'pitfalls', e.target.value)}
                  placeholder="למשל: קפיצה סיבתית, הכללת יתר, מקור לא מאומת"
                  rows={3}
                />
              </div>
            ))}
          </>
        );

      // 5: Evaluation criteria
      case 5:
        return (
          <Textarea
            label="קריטריונים להערכה"
            helpTooltip="מה חייב להופיע בתשובה איכותית"
            value={guidedCriteria}
            onChange={(e) => setGuidedCriteria(e.target.value)}
            placeholder="למשל: ביסוס טענה מרכזית, ציטוט משני מקורות, הסתייגות מתודולוגית"
            rows={6}
          />
        );

      // 6: Generation strategy
      case 6:
        return (
          <StrategyCards
            selected={generationStrategy}
            hasPlantedSignals={selectedPlantedSignals.length > 0}
            onChange={setGenerationStrategy}
          />
        );

      // 7: Sources
      case 7:
        return (
          <Textarea
            label="מקורות קורס"
            helpTooltip="מקורות שהטקסט צריך להתייחס אליהם"
            value={guidedSources}
            onChange={(e) => setGuidedSources(e.target.value)}
            placeholder="רשימת מקורות — מאמרים, ספרים, פרקים"
            rows={6}
          />
        );

      // 8: Word limit
      case 8:
        return (
          <div style={{ display: 'grid', gap: 8 }}>
            <Input
              label="אורך הטקסט (מילים)"
              helpTooltip="טווח מומלץ: 300-700"
              type="number"
              value={guidedWordLimit}
              onChange={(e) => setGuidedWordLimit(Number(e.target.value) || 500)}
              min={150}
              max={1200}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-faint)' }}>
              <span>150 — קצר</span>
              <span>500 — ממוצע</span>
              <span>1200 — ארוך</span>
            </div>
          </div>
        );

      // 9: Version count
      case 9:
        return (
          <Input
            label="כמות גרסאות"
            helpTooltip="כמה טקסטים לייצר"
            type="number"
            value={studentCount}
            onChange={(e) => setStudentCount(Number(e.target.value) || 1)}
            min={1}
            max={50}
          />
        );

      // 10: Review & Create
      case 10:
        return renderSummary();

      default:
        return null;
    }
  }

  function renderSummary() {
    const presetLabel = getPlantedSignalPresetById(selectedPresetId)?.label ?? 'כללי';
    const signalNames = selectedPlantedSignals
      .map(id => PLANTED_SIGNAL_LIBRARY.find(s => s.id === id)?.label)
      .filter(Boolean)
      .join(', ');
    const strategyLabel =
      generationStrategy === 'balanced_errors' ? 'שגיאות מאוזנות' :
      generationStrategy === 'natural' ? 'טבעי' : 'אמת קפדנית';

    const summaryItems: { label: string; value: string; editStep: number }[] = [
      { label: 'כותרת', value: title.trim() || '—', editStep: 0 },
      { label: 'תחום', value: presetLabel, editStep: 1 },
      { label: 'משימה', value: guidedTask.trim() || '—', editStep: 2 },
      { label: 'כשלים מתוכננים', value: signalNames || 'לא נבחרו', editStep: 3 },
      { label: 'חלקים', value: `${guidedSectionCount}`, editStep: 4 },
      { label: 'קריטריונים', value: guidedCriteria.trim() ? (guidedCriteria.trim().length > 80 ? `${guidedCriteria.trim().slice(0, 80)}...` : guidedCriteria.trim()) : '—', editStep: 5 },
      { label: 'אסטרטגיה', value: strategyLabel, editStep: 6 },
      { label: 'מקורות', value: guidedSources.trim() ? (guidedSources.trim().length > 60 ? `${guidedSources.trim().slice(0, 60)}...` : guidedSources.trim()) : 'ללא', editStep: 7 },
      { label: 'אורך', value: `${guidedWordLimit} מילים`, editStep: 8 },
      { label: 'גרסאות', value: `${studentCount}`, editStep: 9 },
    ];

    return (
      <>
        <div className={cardStyles.summaryGrid}>
          {summaryItems.map((item) => (
            <div key={item.label} className={cardStyles.summaryCard}>
              <div className={cardStyles.summaryCardContent}>
                <div className={cardStyles.summaryCardTitle}>{item.label}</div>
                <div className={cardStyles.summaryCardValue}>{item.value}</div>
              </div>
              <button
                type="button"
                className={cardStyles.summaryCardEdit}
                onClick={() => goToSubStep(item.editStep)}
              >
                עריכה
              </button>
            </div>
          ))}
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-faint)',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            padding: '4px 0',
            textAlign: 'right',
          }}
        >
          {showAdvanced ? 'הסתר אפשרויות מתקדמות ▲' : 'אפשרויות מתקדמות — רוב המשתמשים לא צריכים ▼'}
        </button>

        {showAdvanced && (
          <div style={{ display: 'grid', gap: 14, border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 14, background: 'var(--card-hover)' }}>
            <TemplatePanel
              templateName={templateName}
              selectedTemplateId={selectedTemplateId}
              templates={templates}
              templateMessage={templateMessage}
              importInputRef={importInputRef}
              onTemplateNameChange={setTemplateName}
              onSelectedTemplateIdChange={setSelectedTemplateId}
              onSave={handleSaveTemplate}
              onLoad={handleLoadTemplate}
              onDelete={handleDeleteTemplate}
              onExport={handleExportTemplates}
              onImportFile={handleImportTemplatesFile}
            />
            <AdvancedPromptFields
              promptText={promptText}
              courseContext={courseContext}
              requirements={requirements}
              knownPitfalls={knownPitfalls}
              referenceMaterial={referenceMaterial}
              sectionBlueprint={sectionBlueprint}
              evaluationCriteria={evaluationCriteria}
              exemplarNotes={exemplarNotes}
              generationStrategy={generationStrategy}
              tourTargetStyle={() => undefined}
              renderTourHint={() => null}
              onPromptTextChange={setPromptText}
              onCourseContextChange={setCourseContext}
              onRequirementsChange={setRequirements}
              onKnownPitfallsChange={setKnownPitfalls}
              onReferenceMaterialChange={setReferenceMaterial}
              onSectionBlueprintChange={setSectionBlueprint}
              onEvaluationCriteriaChange={setEvaluationCriteria}
              onExemplarNotesChange={setExemplarNotes}
              onGenerationStrategyChange={setGenerationStrategy}
            />
          </div>
        )}
      </>
    );
  }

  /* Can move forward? */
  const canGoNext = useMemo(() => {
    switch (globalSubStep) {
      case 0: return title.trim().length > 0;
      case 2: return guidedTask.trim().length > 0;
      case 4: return allSectionTasksFilled;
      case 5: return hasAnyCriteria;
      case 9: return Number.isInteger(studentCount) && studentCount >= 1 && studentCount <= 50;
      case 10: return hasMinimumRequiredFields && !submitting;
      default: return true; // All other steps are optional
    }
  }, [
    globalSubStep,
    title,
    guidedTask,
    allSectionTasksFilled,
    hasAnyCriteria,
    studentCount,
    hasMinimumRequiredFields,
    submitting,
  ]);

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '40px 24px',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: isNarrowScreen ? 'column' : 'row-reverse',
            gap: 20,
            alignItems: 'flex-start',
          }}
        >
          <WizardSidebar
            steps={MAIN_STEPS}
            isNarrowScreen={isNarrowScreen}
            mainStep={currentMainStep}
            subStep={currentSubStepWithinMain}
            stepCompletion={stepCompletion}
            completedCount={completedCount}
            activeStep={activeMainStep}
            onJumpStep={jumpToMainStep}
            onMoveStep={moveMainStep}
          />

          <div style={{ flex: 1, minWidth: 0, maxWidth: isNarrowScreen ? '100%' : 780 }}>
            {/* Back link */}
            <button
              onClick={() => router.push('/instructor')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontSize: 14,
                fontFamily: 'inherit',
                padding: 0,
                marginBottom: 24,
              }}
            >
              &rarr; {he.instructor.dashboard}
            </button>

            <h1
              style={{
                fontSize: 26,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                color: 'var(--ink)',
                margin: '0 0 32px 0',
              }}
            >
              {he.instructor.createAssignment}
            </h1>

            <CreateTourPanel
              tourOpen={tourOpen}
              tourStepIndex={tourStepIndex}
              totalSteps={CREATE_TOUR_STEPS.length}
              activeStep={activeCreateTourStep}
              onStart={startTour}
              onClose={closeTour}
              onMove={moveTourStep}
            />

            {error && (
              <div
                style={{
                  background: 'var(--error-soft)',
                  color: 'var(--error)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 20,
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <WizardStepCard
              key={globalSubStep}
              stepNumber={globalSubStep + 1}
              totalSteps={SUB_STEPS.length}
              question={currentDef.question}
              explanation={currentDef.explanation}
              example={currentDef.example}
              impactLabels={currentDef.impactLabels}
              onPrev={prevSubStep}
              onNext={() => {
                if (globalSubStep === SUB_STEPS.length - 1) {
                  handleSubmit();
                } else {
                  nextSubStep();
                }
              }}
              canGoNext={canGoNext}
              isFirst={globalSubStep === 0}
              isLast={globalSubStep === SUB_STEPS.length - 1}
              nextLabel={submitting ? '...' : 'יצירת מטלה'}
            >
              {renderSubStepContent()}
            </WizardStepCard>
          </div>
        </div>
      </div>
    </div>
  );
}
