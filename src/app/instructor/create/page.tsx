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
  PLANTED_SIGNAL_PRESETS,
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
import { GuidedBuilderContent } from '@/components/instructor/create/GuidedBuilderContent';
import { TemplatePanel } from '@/components/instructor/create/TemplatePanel';
import { AdvancedPromptFields } from '@/components/instructor/create/AdvancedPromptFields';

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
const SAFE_FLAW_LIBRARY_HE = [
  'החלת מקור מחוץ להקשר: שימוש במקור מוכר באופן שסותר את טענתו המקורית.',
  'נתון מיושן או Cherry-picked: שימוש בנתון אמיתי אך לא עדכני כאילו הוא מייצג את המצב הנוכחי.',
  'פסקת ניסוח מרשימה אך ריקה: טקסט שנשמע אקדמי אך כמעט לא מוסיף תוכן או הוכחה.',
  'הכללה שגויה: הצגת תופעה מקומית/תרבותית כאמת אוניברסלית.',
  'קפיצה סיבתית: מעבר מקורלציה לטענת סיבתיות ללא ביסוס מספק.',
];

const CREATE_TOUR_STEPS: CreateTourStep[] = [
  {
    id: 'tour-title',
    title: 'כותרת ומטרה',
    description: 'מתחילים בכותרת ברורה שתעזור גם לך וגם לסטודנטים להבין מיד את מטרת המטלה.',
    targetId: 'tour-title',
  },
  {
    id: 'tour-builder',
    title: 'בונה מטלה מודרך',
    description: 'כאן עוברים לשפה פשוטה: המערכת שואלת שאלות ועוזרת לבנות את מבנה המטלה מאחורי הקלעים.',
    targetId: 'tour-builder',
    openPromptEditor: true,
  },
  {
    id: 'tour-sections',
    title: 'חלוקה לעד 3 חלקים',
    description: 'אפשר לבנות מטלה עם כמה שאלות נפרדות ולתת לכל חלק מטרות וקריטריונים משלו.',
    targetId: 'tour-sections',
    openPromptEditor: true,
    openGuidedBuilder: true,
  },
  {
    id: 'tour-criteria',
    title: 'קריטריונים ומוקדי קושי',
    description: 'מגדירים מה חייב להופיע בתשובה ומה חשוב שהסטודנטים ילמדו לזהות ולבדוק.',
    targetId: 'tour-criteria',
    openPromptEditor: true,
    openGuidedBuilder: true,
  },
  {
    id: 'tour-build-prompt',
    title: 'בניית פרומפט אוטומטית',
    description: 'בלחיצה אחת המערכת מייצרת פרומפט מובנה מהמידע שהזנת.',
    targetId: 'tour-build-prompt',
    openPromptEditor: true,
    openGuidedBuilder: true,
  },
  {
    id: 'tour-prompt',
    title: 'בדיקה ועדכון',
    description: 'כאן רואים את הטקסט שנבנה, עורכים ידנית ושומרים תבניות לשימוש חוזר.',
    targetId: 'tour-prompt',
    openPromptEditor: true,
  },
  {
    id: 'tour-student-count',
    title: 'כמות גרסאות',
    description: 'מחליטים כמה טקסטים המערכת תיצור לצורך תרגול, כיול והשוואה.',
    targetId: 'tour-student-count',
  },
  {
    id: 'tour-submit',
    title: 'יצירת מטלה',
    description: 'כאן מסיימים: שומרים את המטלה ועוברים ללוח הבקרה להמשך התהליך.',
    targetId: 'tour-submit',
  },
];

const CREATE_WIZARD_STEPS: CreateWizardStep[] = [
  {
    id: 'wizard-basics',
    label: '1. פתיחה',
    description: 'מגדירים כותרת למטלה ומה הסטודנט/ית אמור/ה לעשות.',
    targetId: 'tour-title',
  },
  {
    id: 'wizard-builder',
    label: '2. בניית המטלה',
    description: 'עובדים עם הבונה המודרך: עד 3 חלקים, קריטריונים, מקורות ומוקדי קושי.',
    targetId: 'tour-builder',
    openPromptEditor: true,
    openGuidedBuilder: true,
  },
  {
    id: 'wizard-prompt',
    label: '3. טיוב פרומפט',
    description: 'בודקים את הפרומפט המלא, תבניות ואסטרטגיית יצירה.',
    targetId: 'tour-prompt',
    openPromptEditor: true,
  },
  {
    id: 'wizard-final',
    label: '4. יצירה',
    description: 'קובעים כמה גרסאות ליצור ומסיימים ביצירת המטלה.',
    targetId: 'tour-submit',
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
  const [promptText, setPromptText] = useState('');
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

  /* Guided builder */
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [showGuidedBuilder, setShowGuidedBuilder] = useState(true);
  const [guidedTask, setGuidedTask] = useState('');
  const [guidedCriteria, setGuidedCriteria] = useState('');
  const [guidedSectionCount, setGuidedSectionCount] = useState(1);
  const [guidedSectionItems, setGuidedSectionItems] = useState<GuidedSection[]>([
    createEmptyGuidedSection(1),
  ]);
  const [guidedObstacles, setGuidedObstacles] = useState('');
  const [guidedSources, setGuidedSources] = useState('');
  const [guidedWordLimit, setGuidedWordLimit] = useState(500);
  const [guidedMessage, setGuidedMessage] = useState('');
  const [brainstormPrompt, setBrainstormPrompt] = useState('');

  /* Templates */
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateMessage, setTemplateMessage] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  /* Tour & wizard */
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [wizardStepIndex, setWizardStepIndex] = useState(0);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  const tourQuery = searchParams.get('tour');

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

  const activeWizardStep = useMemo(() => {
    if (CREATE_WIZARD_STEPS.length === 0) return null;
    return CREATE_WIZARD_STEPS[Math.min(wizardStepIndex, CREATE_WIZARD_STEPS.length - 1)];
  }, [wizardStepIndex]);

  const wizardStepCompletion = useMemo(
    () => [
      title.trim().length > 0,
      guidedTask.trim().length > 0 ||
        guidedSectionItems.some((section) => section.task.trim().length > 0),
      promptText.trim().length > 0 &&
        (evaluationCriteria.trim().length > 0 ||
          knownPitfalls.trim().length > 0 ||
          selectedPlantedSignals.length > 0),
      title.trim().length > 0 && promptText.trim().length > 0 && studentCount >= 1,
    ],
    [title, guidedTask, guidedSectionItems, promptText, evaluationCriteria, knownPitfalls, selectedPlantedSignals, studentCount]
  );

  const wizardCompletedCount = useMemo(
    () => wizardStepCompletion.filter(Boolean).length,
    [wizardStepCompletion]
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
    setShowPromptEditor(true);
    setShowGuidedBuilder(true);
    setTourStepIndex(0);
    setTourOpen(true);
    window.localStorage.removeItem(CREATE_TOUR_AUTOSTART_KEY);
  }, [tourQuery]);

  useEffect(() => {
    if (!activeCreateTourStep) return;
    if (activeCreateTourStep.openPromptEditor && !showPromptEditor) {
      setShowPromptEditor(true);
      return;
    }
    if (activeCreateTourStep.openGuidedBuilder && !showGuidedBuilder) {
      setShowGuidedBuilder(true);
      return;
    }
    const target = document.querySelector<HTMLElement>(
      `[data-tour-id="${activeCreateTourStep.targetId}"]`
    );
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [activeCreateTourStep, showPromptEditor, showGuidedBuilder]);

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

  useEffect(() => {
    if (tourOpen || !activeWizardStep) return;
    if (activeWizardStep.openPromptEditor && !showPromptEditor) {
      setShowPromptEditor(true);
      return;
    }
    if (activeWizardStep.openGuidedBuilder && !showGuidedBuilder) {
      setShowGuidedBuilder(true);
      return;
    }
    const target = document.querySelector<HTMLElement>(
      `[data-tour-id="${activeWizardStep.targetId}"]`
    );
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [activeWizardStep, tourOpen, showPromptEditor, showGuidedBuilder]);

  /* ---------------------------------------------------------------- */
  /* Tour / wizard navigation                                          */
  /* ---------------------------------------------------------------- */

  function startTour() {
    setShowPromptEditor(true);
    setShowGuidedBuilder(true);
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

  function jumpWizardStep(stepIndex: number) {
    setWizardStepIndex(Math.max(0, Math.min(CREATE_WIZARD_STEPS.length - 1, stepIndex)));
  }

  function moveWizardStep(direction: 'next' | 'prev') {
    setWizardStepIndex((current) => {
      if (direction === 'prev') return Math.max(0, current - 1);
      return Math.min(CREATE_WIZARD_STEPS.length - 1, current + 1);
    });
  }

  const activeWizardStepId = activeWizardStep?.id ?? 'wizard-basics';
  const showWizardBasics = tourOpen || activeWizardStepId === 'wizard-basics';
  const showWizardBuilder = tourOpen || activeWizardStepId === 'wizard-builder';
  const showWizardPrompt = tourOpen || activeWizardStepId === 'wizard-prompt';
  const showWizardFinal = tourOpen || activeWizardStepId === 'wizard-final';

  function getWizardStageCardStyle(stepIndex: number): React.CSSProperties {
    const isDone = wizardStepCompletion[stepIndex];
    const isActive = wizardStepIndex === stepIndex;
    if (isDone) {
      return { border: '1px solid #85A88B', background: '#F4F8F4', boxShadow: '0 1px 0 rgba(133,168,139,0.14)' };
    }
    if (isActive) {
      return { border: '1px solid #B85D3B', background: '#FBF2EE', boxShadow: '0 0 0 2px rgba(184, 93, 59, 0.12)' };
    }
    return { border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 1px 0 rgba(0,0,0,0.02)' };
  }

  function tourTargetStyle(targetId: string): React.CSSProperties | undefined {
    if (activeCreateTourStep?.targetId === targetId) {
      return {
        boxShadow: '0 0 0 3px rgba(47, 120, 157, 0.36)',
        borderRadius: 12,
        background: 'linear-gradient(180deg, rgba(231, 244, 251, 0.72), rgba(255, 255, 255, 0.9))',
        transition: 'box-shadow 0.2s ease',
      };
    }
    if (!tourOpen && activeWizardStep?.targetId === targetId) {
      return {
        boxShadow: '0 0 0 2px rgba(47, 120, 157, 0.22)',
        borderRadius: 12,
        background: 'linear-gradient(180deg, rgba(245, 250, 253, 0.92), rgba(255, 255, 255, 0.96))',
        transition: 'box-shadow 0.2s ease',
      };
    }
    return undefined;
  }

  function renderTourHint(targetId: string): React.ReactNode {
    if (!activeCreateTourStep || activeCreateTourStep.targetId !== targetId) return null;
    return (
      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          color: '#1f5672',
          background: '#eaf6fc',
          border: '1px solid #c9e4f2',
          borderRadius: 8,
          padding: '6px 8px',
          lineHeight: 1.6,
        }}
      >
        הדרכה: {activeCreateTourStep.description}
      </div>
    );
  }

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
    setBrainstormPrompt('');
    setStudentCount(template.studentCount);
  }

  function handleSaveTemplate() {
    const name = templateName.trim();
    if (!name) { setTemplateMessage(he.instructor.templateNameRequired); return; }
    if (!promptText.trim()) { setTemplateMessage(he.instructor.templatePromptRequired); return; }
    const now = new Date().toISOString();
    const existing = templates.find((item) => item.name.toLowerCase() === name.toLowerCase());
    const nextTemplate: PromptTemplate = {
      id: existing?.id ?? `tpl_${Date.now()}`,
      name,
      title: title.trim(),
      promptText: promptText.trim(),
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
    setShowPromptEditor(true);
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
  /* Guided builder handlers                                           */
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
    setGuidedMessage(`הוחל פריסט תחומי: ${preset.label}.`);
  }

  function handleApplySuggestedPreset() {
    const suggested = getPlantedSignalPresetById(presetSuggestion.presetId);
    if (!suggested) return;
    setPresetPinnedByUser(true);
    setSelectedPresetId(suggested.id);
    setSelectedPlantedSignals(suggested.signalIds);
    setGuidedMessage(
      `הוחלה הצעה אוטומטית: ${suggested.label}${
        presetSuggestion.matchedKeywords.length > 0
          ? ` (זיהוי לפי: ${presetSuggestion.matchedKeywords.join(', ')})`
          : ''
      }.`
    );
  }

  function handleResumeAutoPresetSuggestion() {
    setPresetPinnedByUser(false);
    setGuidedMessage('זיהוי אוטומטי של פריסט תחומי הופעל מחדש.');
  }

  function handleSelectPreset(presetId: DisciplinePresetId) {
    setPresetPinnedByUser(true);
    setSelectedPresetId(presetId);
  }

  /* ---------------------------------------------------------------- */
  /* Prompt building                                                   */
  /* ---------------------------------------------------------------- */

  function handleBuildBrainstormPrompt() {
    const selectedPreset = getPlantedSignalPresetById(selectedPresetId);
    const normalizedSections = guidedSectionItems
      .map((section, index) => ({
        ...section,
        order: index + 1,
        title: compactMultiline(section.title),
        task: compactMultiline(section.task),
        criteria: compactMultiline(section.criteria),
      }))
      .filter((section) => section.task);

    const signalBullets = selectedPlantedSignals
      .map((id) => {
        const signal = PLANTED_SIGNAL_LIBRARY.find((item) => item.id === id);
        if (!signal) return null;
        return `- ${signal.label}: ${signal.generationHint}`;
      })
      .filter((line): line is string => Boolean(line))
      .join('\n');

    const sectionsBlock =
      normalizedSections.length > 0
        ? normalizedSections
            .map((section) =>
              [`חלק ${section.order}: ${section.title || `חלק ${section.order}`}`, `שאלה: ${section.task}`, section.criteria ? `קריטריונים: ${section.criteria}` : '']
                .filter(Boolean)
                .join('\n')
            )
            .join('\n\n')
        : '- ללא חלוקה מפורשת לחלקים';

    const prompt = [
      'את/ה יועץ/ת פדגוגי/ת לקורס אקדמי.',
      'הציע/י 10 מוקדי כשל ריאליסטיים אך בולטים לזיהוי סטודנטיאלי בטקסט AI.',
      'הכשל צריך להיות "בעל ערך לימודי": ניתן לאימות, להסבר, ולהצעת תיקון.',
      'עבור כל מוקד כשל החזר/י:',
      '1) תיאור קצר של הכשל',
      '2) למה סטודנטים נוטים לפספס אותו',
      '3) איך לזהות אותו בטקסט',
      '4) איך לתקן אותו',
      '5) תגית קצרה (snake_case)',
      '',
      `נושא המטלה: ${title.trim() || 'לא הוגדר עדיין'}`,
      `משימת הסטודנט/ית: ${guidedTask.trim() || 'לא הוגדרה עדיין'}`,
      `קריטריונים כלליים: ${compactMultiline(guidedCriteria) || 'לא הוגדרו'}`,
      `פריסט תחומי נבחר: ${selectedPreset?.label ?? 'ללא פריסט'}`,
      '',
      'מבנה המטלה:',
      sectionsBlock,
      '',
      'מוקדי כשל רצויים שכבר נבחרו:',
      signalBullets || '- אין בחירה ידנית כרגע',
      '',
      'הנחיה סגנונית:',
      '- כלול לפחות הצעה אחת לפסקה רהוטה אך חלולה תוכנית (AI-ism).',
      '- כלול לפחות הצעה אחת לביטחון יתר ללא ביסוס.',
      '- שמור על כשלים ריאליסטיים ולא קריקטוריים.',
      '- כתוב בעברית אקדמית קצרה וברורה.',
    ].join('\n');

    setBrainstormPrompt(prompt);
    setGuidedMessage('נוצר פרומפט בריינסטורם למוקדי כשל. ניתן להעתיק ולהשתמש בו.');
  }

  function handleCopyBrainstormPrompt() {
    if (!brainstormPrompt.trim()) return;
    navigator.clipboard
      .writeText(brainstormPrompt)
      .then(() => setGuidedMessage('פרומפט הבריינסטורם הועתק ללוח.'))
      .catch(() => setGuidedMessage('לא ניתן היה להעתיק אוטומטית. ניתן לסמן ולהעתיק ידנית.'));
  }

  function handleApplySafeFlawTemplate() {
    const signalHints = summarizePlantedSignalHints(DEFAULT_PLANTED_SIGNALS, 'generation');
    setPresetPinnedByUser(true);
    setGuidedObstacles((prev) => mergeUniqueLines(prev, SAFE_FLAW_LIBRARY_HE));
    setKnownPitfalls((prev) => mergeUniqueLines(prev, [...SAFE_FLAW_LIBRARY_HE, ...signalHints]));
    setSelectedPlantedSignals(DEFAULT_PLANTED_SIGNALS);
    setSelectedPresetId(DEFAULT_PLANTED_PRESET_ID);
    setGenerationStrategy('balanced_errors');
    setGuidedMessage('נוספה תבנית כשלים פדגוגיים + תגיות כשל נבחרות למצב יצירה עם כשלים.');
  }

  function handleBuildPromptFromGuide() {
    const normalizedSections = guidedSectionItems
      .map((section, index) => ({
        ...section,
        order: index + 1,
        title: compactMultiline(section.title),
        task: compactMultiline(section.task),
        criteria: compactMultiline(section.criteria),
        pitfalls: compactMultiline(section.pitfalls),
      }));

    if (normalizedSections.length === 0) {
      setGuidedMessage('יש להוסיף לפחות חלק אחד עם שאלה לפני בניית הפרומפט.');
      return;
    }
    if (normalizedSections.some((section) => !section.task)) {
      setGuidedMessage('בכל חלק חייבת להיות לפחות שאלה אחת.');
      return;
    }

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

    const sectionsBlock = `\n- המטלה מחולקת לחלקים. יש להתייחס לכל חלק בנפרד ולפי הסדר.\n${normalizedSections
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
      .join('\n\n')}`;
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

    const builtPrompt = [
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

    const sectionBlueprintText = normalizedSections
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

    setPromptText(builtPrompt);
    setRequirements(`עד ${wordLimit} מילים, עברית אקדמית טבעית, והחזרת טקסט תשובה בלבד.`);
    setEvaluationCriteria(criteriaList.join('\n'));
    setKnownPitfalls(upsertPlantedSignalBlock(pitfallsList.join('\n'), selectedPlantedSignals));
    setReferenceMaterial(guidedSources.trim());
    setSectionBlueprint(sectionBlueprintText);
    if (pitfallsList.length > 0 || selectedPlantedSignals.length > 0) {
      setGenerationStrategy('balanced_errors');
    }
    setGuidedMessage(he.instructor.guidedBuilt);
  }

  /* ---------------------------------------------------------------- */
  /* Submit                                                            */
  /* ---------------------------------------------------------------- */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !promptText.trim()) return;

    setSubmitting(true);
    setError('');
    const normalizedKnownPitfalls = upsertPlantedSignalBlock(knownPitfalls.trim(), selectedPlantedSignals);
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
          promptText: promptText.trim(),
          courseContext: courseContext.trim() || undefined,
          requirements: requirements.trim() || undefined,
          knownPitfalls: normalizedKnownPitfalls || undefined,
          referenceMaterial: referenceMaterial.trim() || undefined,
          sectionBlueprint: sectionBlueprint.trim() || undefined,
          evaluationCriteria: evaluationCriteria.trim() || undefined,
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
            steps={CREATE_WIZARD_STEPS}
            isNarrowScreen={isNarrowScreen}
            wizardStepIndex={wizardStepIndex}
            wizardStepCompletion={wizardStepCompletion}
            wizardCompletedCount={wizardCompletedCount}
            activeWizardStep={activeWizardStep}
            onJumpStep={jumpWizardStep}
            onMoveStep={moveWizardStep}
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
          &larr; {he.instructor.dashboard}
        </button>

        <h1
          style={{
            fontSize: 26,
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

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Step 1: Title */}
            {showWizardBasics && (
              <div
                data-tour-id="tour-title"
                style={{
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  display: 'grid',
                  gap: 10,
                  ...getWizardStageCardStyle(0),
                  ...tourTargetStyle('tour-title'),
                }}
              >
                {!tourOpen && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6a4a3c' }}>
                    שלב 1 מתוך 4: פתיחה והגדרת המשימה
                  </div>
                )}
                <Input
                  label={he.instructor.assignmentTitle}
                  helpTooltip="שם קצר וברור, לדוגמה: ניתוח ביקורתי של מקורות בתחום X"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                {renderTourHint('tour-title')}
                {!tourOpen && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-soft)' }}>
                    השלב הבא: בניית מטלה מודרכת והגדרת הקריטריונים.
                  </div>
                )}
              </div>
            )}

            {/* Steps 2-3: Builder & Prompt */}
            {(showWizardBuilder || showWizardPrompt) && (
              <div
              data-tour-id="tour-builder"
              style={{
                borderRadius: 'var(--radius-md)',
                padding: 16,
                display: 'grid',
                gap: 14,
                ...getWizardStageCardStyle(showWizardBuilder ? 1 : 2),
                ...tourTargetStyle('tour-builder'),
              }}
            >
              {!tourOpen && (
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6a4a3c' }}>
                  {showWizardBuilder
                    ? 'שלב 2 מתוך 4: תכנון פדגוגי ובניית המטלה'
                    : 'שלב 3 מתוך 4: טיוב פרומפט ושדות מתקדמים'}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                    {he.instructor.promptEditor}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                    {he.instructor.promptEditorHint}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPromptEditor((prev) => !prev)}
                >
                  {showPromptEditor ? he.instructor.hidePromptEditor : he.instructor.editPrompt}
                </Button>
              </div>
              {renderTourHint('tour-builder')}
              {!tourOpen && showWizardBuilder && (
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  שלב זה מתמקד בבנייה פדגוגית: חלקים, קריטריונים, מוקדי קושי ומקורות.
                </div>
              )}
              {!tourOpen && showWizardPrompt && (
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  שלב זה מתמקד בטיוב טקסט הפרומפט, תבניות ושדות מתקדמים לפני יצירה.
                </div>
              )}

              {!showPromptEditor && (
                <div
                  style={{
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    background: 'var(--card-hover)',
                    fontSize: 13,
                    color: 'var(--ink-soft)',
                    lineHeight: 1.7,
                  }}
                >
                  {promptText.trim()
                    ? `${promptText.trim().slice(0, 180)}${promptText.trim().length > 180 ? '...' : ''}`
                    : he.instructor.promptEmpty}
                </div>
              )}

              {showPromptEditor && (
                <div style={{ display: 'grid', gap: 14 }}>
                  {showWizardBuilder && (
                    <div
                      style={{
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--card-hover)',
                        padding: 12,
                        display: 'grid',
                        gap: 10,
                      }}
                    >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                          {he.instructor.guidedBuilder}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                          {he.instructor.guidedBuilderHint}
                        </div>
                      </div>
                      <Button type="button" variant="secondary" onClick={() => setShowGuidedBuilder((prev) => !prev)}>
                        {showGuidedBuilder ? he.instructor.guidedBuilderHide : he.instructor.guidedBuilderShow}
                      </Button>
                    </div>

                    {showGuidedBuilder && (
                      <GuidedBuilderContent
                        guidedSectionCount={guidedSectionCount}
                        guidedSectionItems={guidedSectionItems}
                        maxSections={MAX_GUIDED_SECTIONS}
                        guidedTask={guidedTask}
                        guidedCriteria={guidedCriteria}
                        guidedObstacles={guidedObstacles}
                        guidedSources={guidedSources}
                        guidedWordLimit={guidedWordLimit}
                        guidedMessage={guidedMessage}
                        brainstormPrompt={brainstormPrompt}
                        selectedPlantedSignals={selectedPlantedSignals}
                        selectedPresetId={selectedPresetId}
                        presetSuggestion={presetSuggestion}
                        presetPinnedByUser={presetPinnedByUser}
                        tourTargetStyle={tourTargetStyle}
                        renderTourHint={renderTourHint}
                        onSetSectionCount={setGuidedSectionCountAndSync}
                        onUpdateSection={updateGuidedSection}
                        onSetGuidedTask={setGuidedTask}
                        onSetGuidedCriteria={setGuidedCriteria}
                        onSetGuidedObstacles={setGuidedObstacles}
                        onSetGuidedSources={setGuidedSources}
                        onSetGuidedWordLimit={setGuidedWordLimit}
                        onSetBrainstormPrompt={setBrainstormPrompt}
                        onBuildPrompt={handleBuildPromptFromGuide}
                        onApplySafeFlawTemplate={handleApplySafeFlawTemplate}
                        onBuildBrainstormPrompt={handleBuildBrainstormPrompt}
                        onCopyBrainstormPrompt={handleCopyBrainstormPrompt}
                        onToggleSignal={togglePlantedSignal}
                        onApplyPreset={handleApplyDisciplinePreset}
                        onApplySuggested={handleApplySuggestedPreset}
                        onResumeAuto={handleResumeAutoPresetSuggestion}
                        onSelectPreset={handleSelectPreset}
                      />
                    )}
                    </div>
                  )}

                  {showWizardPrompt && (
                    <>
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
                        tourTargetStyle={tourTargetStyle}
                        renderTourHint={renderTourHint}
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
                    </>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Step 4: Final */}
            {showWizardFinal && (
              <div
                style={{
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  display: 'grid',
                  gap: 12,
                  ...getWizardStageCardStyle(3),
                }}
              >
                {!tourOpen && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6a4a3c' }}>
                    שלב 4 מתוך 4: הגדרות יצירה וסיום
                  </div>
                )}
                <div data-tour-id="tour-student-count" style={tourTargetStyle('tour-student-count')}>
                  <Input
                    label={he.instructor.studentCount}
                    helpTooltip="כמה גרסאות טקסט לייצר בשלב זה"
                    type="number"
                    value={studentCount}
                    onChange={(e) => setStudentCount(Number(e.target.value) || 1)}
                    min={1}
                    max={50}
                  />
                  {renderTourHint('tour-student-count')}
                </div>

                <div
                  data-tour-id="tour-submit"
                  style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, ...tourTargetStyle('tour-submit') }}
                >
                  <Button type="submit" disabled={submitting || !title.trim() || !promptText.trim()}>
                    {submitting ? '...' : he.instructor.create}
                  </Button>
                </div>
                {renderTourHint('tour-submit')}
              </div>
            )}
          </div>
        </form>
      </div>
      </div>
      </div>
    </div>
  );
}
