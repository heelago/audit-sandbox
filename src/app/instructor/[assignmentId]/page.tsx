'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { he } from '@/locale/he';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { STATUS_COLORS } from '@/lib/constants';
import { parseImportEntries, readFileAsText } from '@/lib/import-utils';
import type { Assignment, Text, AnalysisReportSummary, ActivityLogEntry } from '@/lib/types';
import { SettingsCard } from '@/components/instructor/dashboard/SettingsCard';
import { ImportPanel } from '@/components/instructor/dashboard/ImportPanel';
import { TextsTable } from '@/components/instructor/dashboard/TextsTable';
import { ActivityLog } from '@/components/instructor/dashboard/ActivityLog';
import { ReportsCard } from '@/components/instructor/dashboard/ReportsCard';
import { ActionButtons } from '@/components/instructor/dashboard/ActionButtons';

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [importRaw, setImportRaw] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [latestReports, setLatestReports] = useState<AnalysisReportSummary[]>([]);
  const [activeAction, setActiveAction] = useState<'generating' | 'analyzing' | null>(null);
  const [progressDots, setProgressDots] = useState('');
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [editingSettings, setEditingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [rowActionLoading, setRowActionLoading] = useState<string | null>(null);
  const [rowEditTextId, setRowEditTextId] = useState<string | null>(null);
  const [rowEditValue, setRowEditValue] = useState('');
  const [rowEditSaving, setRowEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    promptText: '',
    courseContext: '',
    requirements: '',
    knownPitfalls: '',
    referenceMaterial: '',
    sectionBlueprint: '',
    evaluationCriteria: '',
    exemplarNotes: '',
    generationStrategy: 'natural' as 'natural' | 'balanced_errors' | 'strict_truth',
  });

  function appendActivity(level: ActivityLogEntry['level'], message: string) {
    setActivityLog((prev) => [
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        level,
        message,
        createdAt: Date.now(),
      },
      ...prev.slice(0, 11),
    ]);
  }

  const fetchLatestReports = useCallback(() => {
    fetch(`/api/assignments/${assignmentId}/analysis-reports?latest=1`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data.reports)) return;
        setLatestReports(data.reports as AnalysisReportSummary[]);
      })
      .catch(() => {});
  }, [assignmentId]);

  const fetchAssignment = useCallback(() => {
    setLoading(true);
    fetch(`/api/assignments/${assignmentId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setAssignment(data);
        setEditForm({
          title: data.title ?? '',
          promptText: data.promptText ?? '',
          courseContext: data.courseContext ?? '',
          requirements: data.requirements ?? '',
          knownPitfalls: data.knownPitfalls ?? '',
          referenceMaterial: data.referenceMaterial ?? '',
          sectionBlueprint: data.sectionBlueprint ?? '',
          evaluationCriteria: data.evaluationCriteria ?? '',
          exemplarNotes: data.exemplarNotes ?? '',
          generationStrategy: data.generationStrategy ?? 'natural',
        });
        fetchLatestReports();
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [assignmentId, fetchLatestReports]);

  useEffect(() => { fetchAssignment(); }, [fetchAssignment]);

  useEffect(() => {
    if (!activeAction) { setProgressDots(''); return; }
    const timer = setInterval(() => {
      setProgressDots((prev) => (prev.length >= 3 ? '' : `${prev}.`));
    }, 450);
    return () => clearInterval(timer);
  }, [activeAction]);

  async function handleGenerate(stage: 'pilot' | 'full' = 'pilot') {
    if (!assignment) return;
    setActionLoading(true);
    setActiveAction('generating');
    setError('');
    appendActivity('info', stage === 'pilot' ? 'מתחיל יצירת פיילוט טקסטים...' : 'מתחיל יצירת יתר הטקסטים...');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationStage: stage, pilotCount: 2, requireGemini: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      if (data.success) {
        const message = stage === 'pilot'
          ? `פיילוט הושלם: נוצרו ${data.textsCreated} טקסטים (${data.generationMode}). נותרו ${data.pendingCodes} ברוסטר.`
          : `נוצרו ${data.textsCreated} טקסטים נוספים (${data.generationMode}).`;
        setImportMessage(message);
        appendActivity('success', message);
      }
      fetchAssignment();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה';
      setError(message);
      appendActivity('error', `יצירת טקסטים נכשלה: ${message}`);
    } finally {
      setActionLoading(false);
      setActiveAction(null);
    }
  }

  async function handleAnalyze() {
    setActionLoading(true);
    setActiveAction('analyzing');
    appendActivity('info', 'מתחיל ניתוח סוכנים...');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/analyze`, { method: 'POST' });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Analysis failed'); }
      appendActivity('success', 'ניתוח הסוכנים הושלם.');
      fetchAssignment();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה';
      setError(message);
      appendActivity('error', `ניתוח נכשל: ${message}`);
    } finally {
      setActionLoading(false);
      setActiveAction(null);
    }
  }

  async function handleAnalyzeSingleText(textId: string, studentCode: string) {
    setRowActionLoading(`analyze:${textId}`);
    setError('');
    appendActivity('info', `מריץ ניתוח מחדש עבור ${studentCode}...`);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textIds: [textId], forceReanalyze: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      appendActivity('success', `הניתוח עודכן עבור ${studentCode}.`);
      fetchAssignment();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה';
      setError(message);
      appendActivity('error', `ניתוח מחדש נכשל עבור ${studentCode}: ${message}`);
    } finally {
      setRowActionLoading(null);
    }
  }

  async function handleRegenerateSingleText(textId: string, studentCode: string) {
    const confirmed = window.confirm(`ליצור מחדש את הטקסט של ${studentCode}?\n\nפעולה זו תחליף את הטקסט הנוכחי ותאפס ממצאים וניתוחים קיימים עבורו.`);
    if (!confirmed) return;
    setRowActionLoading(`regen:${textId}`);
    setError('');
    appendActivity('info', `יוצר מחדש את הטקסט של ${studentCode}...`);
    try {
      const res = await fetch(`/api/texts/${textId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requireGemini: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Regeneration failed');
      if (rowEditTextId === textId) { setRowEditTextId(null); setRowEditValue(''); }
      appendActivity('success', `הטקסט נוצר מחדש עבור ${studentCode}.`);
      fetchAssignment();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה';
      setError(message);
      appendActivity('error', `יצירה מחדש נכשלה עבור ${studentCode}: ${message}`);
    } finally {
      setRowActionLoading(null);
    }
  }

  function openRowEditor(text: Text) {
    setError('');
    setRowEditTextId(text.id);
    setRowEditValue(text.textContent ?? '');
  }

  async function handleSaveRowEdit(textId: string, studentCode: string) {
    if (!rowEditValue.trim()) { setError('לא ניתן לשמור טקסט ריק'); return; }
    setRowEditSaving(true);
    setError('');
    appendActivity('info', `שומר עריכה ידנית עבור ${studentCode}...`);
    try {
      const res = await fetch(`/api/texts/${textId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textContent: rowEditValue, resetAnalysis: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Edit failed');
      appendActivity('success', `עריכת הטקסט נשמרה עבור ${studentCode}.`);
      setRowEditTextId(null);
      setRowEditValue('');
      fetchAssignment();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה';
      setError(message);
      appendActivity('error', `שמירת עריכה נכשלה עבור ${studentCode}: ${message}`);
    } finally {
      setRowEditSaving(false);
    }
  }

  async function handleSaveSettings() {
    if (!assignment) return;
    setSavingSettings(true);
    setSettingsMessage('');
    setError('');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שמירת ההגדרות נכשלה');
      setSettingsMessage(he.instructor.settingsSaved);
      setEditingSettings(false);
      fetchAssignment();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שמירת ההגדרות נכשלה');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleImportFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      setImportRaw(text);
      setImportFileName(file.name);
      setImportMessage('');
    } catch {
      setError('לא ניתן לקרוא את הקובץ שנבחר');
    }
  }

  async function handleImportTexts() {
    const entries = parseImportEntries(importRaw);
    if (entries.length === 0) { setError('לא נמצאו טקסטים תקינים לייבוא'); return; }
    setImportLoading(true);
    setImportMessage('');
    setError('');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/import-texts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ייבוא הטקסטים נכשל');
      setImportMessage(`יובאו ${data.imported} טקסטים. בוצעו ${data.totalRedactions} הסתרות אוטומטיות.`);
      setImportRaw('');
      setImportFileName('');
      fetchAssignment();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ייבוא הטקסטים נכשל');
    } finally {
      setImportLoading(false);
    }
  }

  /* ── Loading / Error states ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center', color: 'var(--ink-soft)' }}>...</div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--error)' }}>{error || 'לא נמצא'}</p>
          <Button onClick={() => router.push('/instructor')} variant="secondary">{he.instructor.dashboard}</Button>
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  /* ── Derived state ── */
  const statusKey = assignment.status as keyof typeof he.instructor.status;
  const statusLabel = he.instructor.status[statusKey] || assignment.status;
  const sc = STATUS_COLORS[assignment.status] || STATUS_COLORS.draft;
  const parsedImportEntries = parseImportEntries(importRaw);
  const generatedCount = assignment.texts.length;
  const plannedCount = Math.max(assignment.plannedStudentCount ?? 0, assignment.plannedStudentCodes.length, generatedCount);
  const remainingCount = Math.max(0, plannedCount - generatedCount);
  const canGeneratePilot = assignment.status === 'draft' && generatedCount === 0 && plannedCount > 0;
  const canGenerateRemaining = (assignment.status === 'analyzing' || assignment.status === 'calibrating' || assignment.status === 'draft') && generatedCount > 0 && remainingCount > 0;
  const reportByTextId = new Map(latestReports.map((report) => [report.textId, report]));
  const textMutationsLocked = assignment.status === 'active' || assignment.status === 'grading' || assignment.status === 'closed';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Back */}
        <button
          onClick={() => router.push('/instructor')}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', padding: 0, marginBottom: 24 }}
        >
          &larr; {he.instructor.dashboard}
        </button>

        {/* Title + Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{assignment.title}</h1>
          <StatusBadge color={sc.color} bg={sc.bg}>{statusLabel}</StatusBadge>
        </div>

        {error && (
          <div style={{ background: 'var(--error-soft)', color: 'var(--error)', borderRadius: 8, padding: '8px 10px', fontSize: 12, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <SettingsCard
          assignment={assignment}
          editingSettings={editingSettings}
          savingSettings={savingSettings}
          settingsMessage={settingsMessage}
          editForm={editForm}
          onToggleEditing={() => setEditingSettings((prev) => !prev)}
          onEditFormChange={setEditForm}
          onSaveSettings={handleSaveSettings}
        />

        <ActionButtons
          status={assignment.status}
          textsCount={assignment.texts.length}
          actionLoading={actionLoading}
          canGeneratePilot={canGeneratePilot}
          canGenerateRemaining={canGenerateRemaining}
          remainingCount={remainingCount}
          assignmentId={assignmentId}
          onGenerate={handleGenerate}
          onAnalyze={handleAnalyze}
          onNavigate={(path) => router.push(path)}
        />

        <ActivityLog
          activeAction={activeAction}
          progressDots={progressDots}
          activityLog={activityLog}
        />

        <Card style={{ marginBottom: 24 }}>
          <div style={{ padding: 16, fontSize: 13, color: 'var(--ink-soft)' }}>
            תכנון רוסטר: {plannedCount} | נוצרו: {generatedCount} | נותרו: {remainingCount}
          </div>
        </Card>

        <ReportsCard texts={assignment.texts} reportByTextId={reportByTextId} />

        <ImportPanel
          importRaw={importRaw}
          importFileName={importFileName}
          importLoading={importLoading}
          importMessage={importMessage}
          parsedEntryCount={parsedImportEntries.length}
          onImportRawChange={setImportRaw}
          onFileChange={handleImportFileChange}
          onImport={handleImportTexts}
        />

        <TextsTable
          texts={assignment.texts}
          textMutationsLocked={textMutationsLocked}
          rowActionLoading={rowActionLoading}
          rowEditTextId={rowEditTextId}
          rowEditValue={rowEditValue}
          rowEditSaving={rowEditSaving}
          assignmentId={assignmentId}
          onOpenRowEditor={openRowEditor}
          onRegenerateSingleText={handleRegenerateSingleText}
          onAnalyzeSingleText={handleAnalyzeSingleText}
          onRowEditValueChange={setRowEditValue}
          onSaveRowEdit={handleSaveRowEdit}
          onCancelRowEdit={() => { setRowEditTextId(null); setRowEditValue(''); }}
          onNavigateCalibrate={() => router.push(`/instructor/${assignmentId}/calibrate`)}
        />
      </div>
    </div>
  );
}
