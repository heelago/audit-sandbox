'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { he } from '@/locale/he';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';

interface RubricItem {
  id: string;
  passSource: string;
  severity: string;
  category: string;
  locationStart: number;
  locationEnd: number;
  description: string;
  idealResponse?: string;
  flaggedText?: string | null;
  confirmed: boolean;
}

interface TextItem {
  id: string;
  studentCode: string;
  textContent: string;
  rubricItems: RubricItem[];
}

interface Assignment {
  id: string;
  title: string;
  status: string;
  texts: TextItem[];
}

type Severity = 'critical' | 'moderate' | 'minor';

const SEVERITY_COLORS: Record<Severity, { color: string; bg: string; label: string }> = {
  critical: { color: 'var(--error)', bg: 'var(--error-soft)', label: 'קריטי' },
  moderate: { color: 'var(--warn)', bg: 'var(--warn-soft)', label: 'בינוני' },
  minor: { color: 'var(--info)', bg: 'var(--info-soft)', label: 'קל' },
};

function getTextOffset(container: HTMLElement, node: Node, nodeOffset: number): number {
  const range = document.createRange();
  range.selectNodeContents(container);
  range.setEnd(node, nodeOffset);
  return range.toString().length;
}

function readSelectionFromContainer(
  container: HTMLElement,
  textContent: string
): { start: number; end: number; text: string } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return null;
  if (!container.contains(range.commonAncestorContainer)) return null;

  const a = getTextOffset(container, range.startContainer, range.startOffset);
  const b = getTextOffset(container, range.endContainer, range.endOffset);
  if (a === b) return null;

  const start = Math.max(0, Math.min(a, b));
  const end = Math.min(textContent.length, Math.max(a, b));
  if (end <= start) return null;

  return {
    start,
    end,
    text: textContent.slice(start, end).trim(),
  };
}

export default function CalibratePage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;
  const textViewRef = useRef<HTMLDivElement | null>(null);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTextId, setActiveTextId] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [releaseLoading, setReleaseLoading] = useState(false);

  const [newFindingDesc, setNewFindingDesc] = useState('');
  const [newFindingSeverity, setNewFindingSeverity] = useState<Severity>('moderate');
  const [newFindingCategory, setNewFindingCategory] = useState('professor_finding');
  const [newFindingLoading, setNewFindingLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [saveTextLoading, setSaveTextLoading] = useState(false);
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [reanalyzeLoading, setReanalyzeLoading] = useState(false);

  const fetchAssignment = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`);
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'Not found');
      }
      const data = (await res.json()) as Assignment;
      setAssignment(data);
      setActiveTextId((prev) => {
        if (data.texts.some((text) => text.id === prev)) return prev;
        return data.texts[0]?.id ?? '';
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const activeText = useMemo(
    () => assignment?.texts.find((text) => text.id === activeTextId) ?? null,
    [assignment, activeTextId]
  );

  useEffect(() => {
    if (!activeText || isEditMode) return;
    setEditedText(activeText.textContent);
    setSelectedRange(null);
  }, [activeText, isEditMode]);

  async function handleCalibrate(action: 'confirm' | 'dismiss', rubricItemId: string) {
    setActionLoading(rubricItemId);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/calibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rubricItemId }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'Calibration failed');
      }
      await fetchAssignment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בכיול');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleFlagNew() {
    if (!activeText || !newFindingDesc.trim()) return;
    setNewFindingLoading(true);
    setError('');
    setNotice('');
    try {
      const fallbackEnd = Math.min(activeText.textContent.length, 120);
      const locationStart = selectedRange?.start ?? 0;
      const locationEnd = selectedRange?.end ?? fallbackEnd;

      const res = await fetch(`/api/assignments/${assignmentId}/calibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'flag_new',
          textId: activeText.id,
          description: newFindingDesc.trim(),
          severity: newFindingSeverity,
          category: newFindingCategory.trim() || 'professor_finding',
          locationStart,
          locationEnd,
          flaggedText: selectedRange?.text || null,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'Failed to flag new finding');
      }
      setNewFindingDesc('');
      setSelectedRange(null);
      setNotice('הממצא נשמר בכיול');
      await fetchAssignment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בסימון ממצא');
    } finally {
      setNewFindingLoading(false);
    }
  }

  async function handleSaveText() {
    if (!activeText) return;
    if (!editedText.trim()) {
      setError('לא ניתן לשמור טקסט ריק');
      return;
    }
    setSaveTextLoading(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/texts/${activeText.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: editedText,
          resetAnalysis: true,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'Failed to save text');
      }
      setIsEditMode(false);
      setSelectedRange(null);
      setNotice('הטקסט עודכן. ממצאים קיימים אופסו כדי למנוע חוסר התאמה.');
      await fetchAssignment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון טקסט');
    } finally {
      setSaveTextLoading(false);
    }
  }

  async function handleRegenerateText() {
    if (!activeText) return;
    const confirmed = window.confirm(
      `ליצור מחדש את הטקסט של ${activeText.studentCode}?\n\nפעולה זו תחליף את הטקסט הקיים ותאפס ממצאים קיימים עבורו.`
    );
    if (!confirmed) {
      return;
    }

    setRegenerateLoading(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/texts/${activeText.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requireGemini: true }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'Failed to regenerate text');
      }
      setIsEditMode(false);
      setSelectedRange(null);
      setNotice('הטקסט נוצר מחדש. ניתן להריץ ניתוח מחדש לטקסט זה.');
      await fetchAssignment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירה מחדש');
    } finally {
      setRegenerateLoading(false);
    }
  }

  async function handleReanalyzeActiveText() {
    if (!activeText) return;
    setReanalyzeLoading(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textIds: [activeText.id],
          forceReanalyze: true,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'Reanalysis failed');
      }
      setNotice('הניתוח עודכן לטקסט הפעיל.');
      await fetchAssignment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהרצת ניתוח מחדש');
    } finally {
      setReanalyzeLoading(false);
    }
  }

  async function handleRelease() {
    setReleaseLoading(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/release`, {
        method: 'POST',
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'Release failed');
      }
      router.push(`/instructor/${assignmentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשחרור');
    } finally {
      setReleaseLoading(false);
    }
  }

  function onTextSelection() {
    if (isEditMode || !activeText || !textViewRef.current) return;
    requestAnimationFrame(() => {
      if (!textViewRef.current) return;
      const next = readSelectionFromContainer(textViewRef.current, activeText.textContent);
      setSelectedRange(next);
    });
  }

  function renderHighlightedText(text: string, rubricItems: RubricItem[]): ReactNode {
    if (rubricItems.length === 0) return <span>{text}</span>;

    const sortedItems = [...rubricItems]
      .filter((item) => item.locationEnd > item.locationStart)
      .sort((a, b) => a.locationStart - b.locationStart);

    const segments: ReactNode[] = [];
    let lastEnd = 0;

    for (const item of sortedItems) {
      const start = Math.max(0, Math.min(text.length, item.locationStart));
      const end = Math.max(0, Math.min(text.length, item.locationEnd));
      if (end <= start) continue;
      if (end <= lastEnd) continue;

      if (start > lastEnd) {
        segments.push(<span key={`plain-${lastEnd}`}>{text.slice(lastEnd, start)}</span>);
      }

      const actualStart = Math.max(start, lastEnd);
      const sevColor =
        (SEVERITY_COLORS[item.severity as Severity] ?? SEVERITY_COLORS.minor);
      segments.push(
        <mark
          key={`hl-${item.id}`}
          style={{
            backgroundColor: sevColor.bg,
            borderBottom: `2px solid ${sevColor.color}`,
            padding: '2px 0',
            borderRadius: 2,
          }}
          title={item.description}
        >
          {text.slice(actualStart, end)}
        </mark>
      );

      lastEnd = end;
    }

    if (lastEnd < text.length) {
      segments.push(<span key="plain-end">{text.slice(lastEnd)}</span>);
    }

    return <>{segments}</>;
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', color: 'var(--ink-soft)' }}>
          ...
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--error)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  const tabs = assignment.texts.map((text) => ({
    id: text.id,
    label: text.studentCode,
  }));
  const isBusy =
    Boolean(actionLoading) ||
    newFindingLoading ||
    saveTextLoading ||
    regenerateLoading ||
    reanalyzeLoading ||
    releaseLoading;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '40px 24px',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <button
          onClick={() => router.push(`/instructor/${assignmentId}`)}
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
          &larr; {assignment.title}
        </button>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px 0' }}>
          {he.instructor.calibration.title}
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: '0 0 24px 0' }}>
          {he.instructor.calibration.description}
        </p>

        {error && (
          <div
            style={{
              background: 'var(--error-soft)',
              color: 'var(--error)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            style={{
              background: 'var(--success-soft)',
              color: 'var(--success)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {notice}
          </div>
        )}

        {tabs.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <Tabs tabs={tabs} activeTab={activeTextId} onTabChange={(id) => setActiveTextId(id)} />
          </div>
        )}

        {activeText && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 24,
              alignItems: 'start',
            }}
          >
            <Card>
              <div style={{ padding: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-soft)', margin: 0 }}>
                    טקסט - {activeText.studentCode}
                  </h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => {
                        setIsEditMode((prev) => !prev);
                        setEditedText(activeText.textContent);
                      }}
                      disabled={isBusy && !isEditMode}
                    >
                      {isEditMode ? 'סגור עריכה' : 'ערוך טקסט'}
                    </Button>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={handleRegenerateText}
                      disabled={isBusy}
                    >
                      {regenerateLoading ? '...' : 'צור מחדש'}
                    </Button>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={handleReanalyzeActiveText}
                      disabled={isBusy}
                    >
                      {reanalyzeLoading ? '...' : 'נתח שוב'}
                    </Button>
                  </div>
                </div>

                {isEditMode ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <Textarea value={editedText} onChange={(event) => setEditedText(event.target.value)} rows={18} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                        שמירה תאפס ממצאי כיול קיימים לטקסט זה כדי למנוע אי התאמות.
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => {
                            setIsEditMode(false);
                            setEditedText(activeText.textContent);
                          }}
                          disabled={saveTextLoading}
                        >
                          ביטול
                        </Button>
                        <Button size="small" onClick={handleSaveText} disabled={saveTextLoading || !editedText.trim()}>
                          {saveTextLoading ? '...' : 'שמור טקסט'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      ref={textViewRef}
                      onMouseUp={onTextSelection}
                      onKeyUp={onTextSelection}
                      style={{
                        fontSize: 15,
                        lineHeight: 1.8,
                        color: 'var(--ink)',
                        whiteSpace: 'pre-wrap',
                        maxHeight: 600,
                        overflow: 'auto',
                        userSelect: 'text',
                        paddingInlineEnd: 4,
                      }}
                    >
                      {renderHighlightedText(activeText.textContent, activeText.rubricItems)}
                    </div>

                    <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-faint)' }}>
                      בחר/י קטע בטקסט כדי לשייך את הממצא החדש למיקום מדויק.
                    </div>
                  </>
                )}
              </div>
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeText.rubricItems.length === 0 && (
                <Card style={{ borderStyle: 'dashed' }}>
                  <div style={{ padding: 16, fontSize: 13, color: 'var(--ink-soft)' }}>
                    אין עדיין ממצאים לטקסט זה. אפשר להריץ ניתוח מחדש או לסמן ממצא ידני.
                  </div>
                </Card>
              )}

              {activeText.rubricItems.map((item) => {
                const sev =
                  (SEVERITY_COLORS[item.severity as Severity] ?? SEVERITY_COLORS.minor);
                return (
                  <Card
                    key={item.id}
                    borderAccent={item.confirmed === false ? 'var(--ink-faint)' : sev.color}
                    style={{
                      opacity: item.confirmed === false ? 0.5 : 1,
                    }}
                  >
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                        <StatusBadge color={sev.color} bg={sev.bg}>
                          {sev.label}
                        </StatusBadge>
                        <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{item.category}</span>
                      </div>

                      <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                        {item.description}
                      </p>

                      {item.flaggedText && (
                        <div
                          style={{
                            background: sev.bg,
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 13,
                            color: 'var(--ink-soft)',
                            marginBottom: 12,
                            borderInlineStart: `3px solid ${sev.color}`,
                          }}
                        >
                          &ldquo;{item.flaggedText}&rdquo;
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          size="small"
                          onClick={() => handleCalibrate('confirm', item.id)}
                          disabled={actionLoading === item.id || item.confirmed === true}
                          style={item.confirmed === true ? { background: 'var(--success)', color: '#fff' } : {}}
                        >
                          {he.instructor.calibration.confirm}
                        </Button>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => handleCalibrate('dismiss', item.id)}
                          disabled={actionLoading === item.id || item.confirmed === false}
                        >
                          {he.instructor.calibration.dismiss}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}

              <Card style={{ borderStyle: 'dashed' }}>
                <div style={{ padding: 16, display: 'grid', gap: 10 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                    {he.instructor.calibration.flagNew}
                  </h4>

                  {selectedRange ? (
                    <div
                      style={{
                        background: 'var(--accent-soft)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        fontSize: 12,
                        color: 'var(--ink)',
                      }}
                    >
                      טווח נבחר: {selectedRange.start}-{selectedRange.end}
                      {selectedRange.text ? ` | "${selectedRange.text.slice(0, 120)}"` : ''}
                      <button
                        onClick={() => setSelectedRange(null)}
                        style={{
                          marginInlineStart: 10,
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        נקה בחירה
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                      לא נבחר קטע. הממצא ישויך לתחילת הטקסט כברירת מחדל.
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <label style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>חומרה</span>
                      <select
                        value={newFindingSeverity}
                        onChange={(event) => setNewFindingSeverity(event.target.value as Severity)}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '8px 10px',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        <option value="critical">קריטי</option>
                        <option value="moderate">בינוני</option>
                        <option value="minor">קל</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>קטגוריה</span>
                      <input
                        value={newFindingCategory}
                        onChange={(event) => setNewFindingCategory(event.target.value)}
                        placeholder="למשל: citation_error"
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '8px 10px',
                          fontFamily: 'var(--font-body)',
                        }}
                      />
                    </label>
                  </div>

                  <Textarea
                    value={newFindingDesc}
                    onChange={(event) => setNewFindingDesc(event.target.value)}
                    placeholder={he.instructor.calibration.flagNewPlaceholder}
                    rows={3}
                  />

                  <div>
                    <Button
                      size="small"
                      onClick={handleFlagNew}
                      disabled={newFindingLoading || !newFindingDesc.trim() || isBusy}
                    >
                      {newFindingLoading ? '...' : he.workspace.add}
                    </Button>
                  </div>
                </div>
              </Card>

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <Button
                  onClick={handleRelease}
                  disabled={releaseLoading || isBusy}
                  style={{
                    width: '100%',
                    background: 'var(--success)',
                    color: '#fff',
                  }}
                >
                  {releaseLoading ? '...' : `${he.instructor.calibration.approved} - ${he.instructor.releaseToStudents}`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
