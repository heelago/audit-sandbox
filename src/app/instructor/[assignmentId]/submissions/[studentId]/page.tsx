'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { he } from '@/locale/he';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';

interface Evidence {
  id: string;
  type: string;
  content: string;
}

interface Annotation {
  id: string;
  type: string;
  locationStart: number;
  locationEnd: number;
  selectedText: string;
  note: string;
  evidence: Evidence[];
}

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

interface Score {
  id: string;
  tier1Raw: number;
  tier2Deductions: number;
  tier3Bonus: number;
  coverageScore: number;
  compositeRaw: number;
  normalizedFinal: number;
  professorOverride: number | null;
  professorNotes: string | null;
  releasedAt: string | null;
}

interface RubricMatch {
  annotationId: string;
  rubricItemId: string;
  matchConfidence: string;
  matchQuality: number;
}

interface TextItem {
  id: string;
  studentCode: string;
  studentName: string | null;
  textContent: string;
  annotations: Annotation[];
  rubricItems: RubricItem[];
  score: Score | null;
}

interface Assignment {
  id: string;
  title: string;
  texts: TextItem[];
}

const SEVERITY_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: 'var(--error)',   bg: 'var(--error-soft)',   label: 'קריטי' },
  moderate: { color: 'var(--warn)',    bg: 'var(--warn-soft)',    label: 'בינוני' },
  minor:    { color: 'var(--info)',    bg: 'var(--info-soft)',    label: 'קל' },
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high:   'גבוה',
  medium: 'בינוני',
  low:    'נמוך',
};

export default function StudentReviewPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;
  const studentId = params.studentId as string; // This is studentCode

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [scoringData, setScoringData] = useState<{
    matches: RubricMatch[];
    missedItems: string[];
    beyondRubricAnnotations: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Override fields
  const [overrideScore, setOverrideScore] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [beyondActionLoading, setBeyondActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`);
      if (!res.ok) throw new Error('Not found');
      const data: Assignment = await res.json();
      setAssignment(data);

      // Find the text for this student
      const text = data.texts.find((t) => t.studentCode === studentId);
      if (text && text.score) {
        setOverrideScore(text.score.professorOverride?.toString() || '');
        setOverrideNotes(text.score.professorNotes || '');
      }

      // Try to get scoring data (matches, beyond-rubric)
      if (text) {
        try {
          const scoreRes = await fetch(`/api/scoring/${text.id}`, { method: 'POST' });
          if (scoreRes.ok) {
            const scoreData = await scoreRes.json();
            setScoringData({
              matches: scoreData.scoring?.matches || [],
              missedItems: scoreData.scoring?.missedItems || [],
              beyondRubricAnnotations: scoreData.scoring?.beyondRubricAnnotations || [],
            });
          }
        } catch {
          // Scoring not available yet — that is fine
        }

        // Re-fetch assignment to get updated score
        const res2 = await fetch(`/api/assignments/${assignmentId}`);
        if (res2.ok) {
          const data2: Assignment = await res2.json();
          setAssignment(data2);
          const t2 = data2.texts.find((t) => t.studentCode === studentId);
          if (t2?.score) {
            setOverrideScore(t2.score.professorOverride?.toString() || '');
            setOverrideNotes(t2.score.professorNotes || '');
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const text = assignment?.texts.find((t) => t.studentCode === studentId);

  async function handleReleaseScore() {
    if (!text) return;
    setReleaseLoading(true);
    try {
      const body: Record<string, unknown> = { release: true };
      if (overrideScore) {
        body.overrideScore = Number(overrideScore);
      }
      if (overrideNotes.trim()) {
        body.notes = overrideNotes.trim();
      }

      const res = await fetch(`/api/scoring/${text.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Release failed');
      fetchData();
    } catch {
      setError('שגיאה בשחרור ציון');
    } finally {
      setReleaseLoading(false);
    }
  }

  async function handleBeyondAction(annotationId: string, action: 'confirm' | 'reject') {
    if (!text) return;
    setBeyondActionLoading(annotationId);
    try {
      // Use calibrate endpoint to flag or dismiss
      await fetch(`/api/assignments/${assignmentId}/calibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'confirm' ? 'flag_new' : 'dismiss',
          textId: text.id,
          description: `Beyond-rubric annotation ${action}: ${annotationId}`,
          notes: `Student annotation ${annotationId} — ${action}`,
        }),
      });
    } catch {
      // Silently fail
    } finally {
      setBeyondActionLoading(null);
    }
  }

  // Render text with all annotations highlighted
  function renderAnnotatedText(textContent: string, annotations: Annotation[]) {
    if (annotations.length === 0) {
      return <span>{textContent}</span>;
    }

    const sorted = [...annotations].sort((a, b) => a.locationStart - b.locationStart);
    const TYPE_COLORS: Record<string, string> = {
      error:       'var(--error-soft)',
      verified:    'var(--success-soft)',
      alternative: 'var(--warn-soft)',
      gap:         'var(--gap-soft)',
      nuance:      'var(--info-soft)',
      accepted:    'var(--neutral-soft)',
    };

    const segments: React.ReactNode[] = [];
    let lastEnd = 0;

    for (const ann of sorted) {
      if (ann.locationStart > lastEnd) {
        segments.push(
          <span key={`p-${lastEnd}`}>{textContent.slice(lastEnd, ann.locationStart)}</span>
        );
      }

      segments.push(
        <mark
          key={`ann-${ann.id}`}
          style={{
            backgroundColor: TYPE_COLORS[ann.type] || 'var(--neutral-soft)',
            padding: '2px 0',
            borderRadius: 2,
          }}
          title={ann.note}
        >
          {textContent.slice(ann.locationStart, ann.locationEnd)}
        </mark>
      );

      lastEnd = Math.max(lastEnd, ann.locationEnd);
    }

    if (lastEnd < textContent.length) {
      segments.push(<span key="end">{textContent.slice(lastEnd)}</span>);
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

  if (!assignment || !text) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--error)' }}>{error || 'לא נמצא'}</p>
        </div>
      </div>
    );
  }

  // Build tier data
  const matchedRubricIds = new Set(scoringData?.matches.map((m) => m.rubricItemId) || []);
  const matchedAnnotationIds = new Set(scoringData?.matches.map((m) => m.annotationId) || []);
  const beyondIds = new Set(scoringData?.beyondRubricAnnotations || []);

  const confirmedRubric = text.rubricItems.filter((r) => r.confirmed);

  // Tier 1: matched rubric items with their annotation
  const tier1 = scoringData?.matches.map((match) => {
    const rubric = confirmedRubric.find((r) => r.id === match.rubricItemId);
    const ann = text.annotations.find((a) => a.id === match.annotationId);
    return { match, rubric, annotation: ann };
  }).filter((t) => t.rubric && t.annotation) || [];

  // Tier 2: missed rubric items (confirmed but not matched)
  const tier2 = confirmedRubric.filter((r) => !matchedRubricIds.has(r.id));

  // Tier 3: beyond-rubric annotations
  const tier3 = text.annotations.filter(
    (a) => beyondIds.has(a.id) || (!matchedAnnotationIds.has(a.id) && a.type !== 'accepted')
  );

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
        {/* Back */}
        <button
          onClick={() => router.push(`/instructor/${assignmentId}/submissions`)}
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
          &larr; {he.instructor.submissions}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            {text.studentCode} — {text.studentName || 'סטודנט/ית'}
          </h1>
          {text.score && (
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: text.score.releasedAt ? 'var(--success)' : 'var(--ink)',
              }}
            >
              {text.score.professorOverride ?? text.score.normalizedFinal}
            </div>
          )}
        </div>

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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left: Annotated text */}
          <Card>
            <div style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-soft)', margin: '0 0 12px 0' }}>
                טקסט עם הערות
              </h3>
              <div
                style={{
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: 'var(--ink)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 600,
                  overflow: 'auto',
                }}
              >
                {renderAnnotatedText(text.textContent, text.annotations)}
              </div>
            </div>
          </Card>

          {/* Right: Tiers + Override */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Tier 1: Rubric Matches */}
            <Card borderAccent="var(--success)">
              <div style={{ padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px 0' }}>
                  {he.instructor.scoring.tier1}
                </h3>
                {tier1.length === 0 && (
                  <p style={{ color: 'var(--ink-faint)', fontSize: 14, margin: 0 }}>
                    אין התאמות מול רובריקה
                  </p>
                )}
                {tier1.map(({ match, rubric, annotation }) => {
                  if (!rubric || !annotation) return null;
                  const sev = SEVERITY_COLORS[rubric.severity] || SEVERITY_COLORS.minor;
                  return (
                    <div
                      key={match.rubricItemId}
                      style={{
                        padding: '12px 0',
                        borderBottom: '1px solid var(--border-light)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <StatusBadge color={sev.color} bg={sev.bg}>
                            {sev.label}
                          </StatusBadge>
                          <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                            {rubric.category}
                          </span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                          איכות: {match.matchQuality}/10 ({CONFIDENCE_LABELS[match.matchConfidence] || match.matchConfidence})
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--ink)', margin: '4px 0', lineHeight: 1.5 }}>
                        <strong>רובריקה:</strong> {rubric.description}
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '4px 0', lineHeight: 1.5 }}>
                        <strong>הערת הסטודנט/ית:</strong> {annotation.note || '—'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Tier 2: Misses */}
            <Card borderAccent="var(--error)">
              <div style={{ padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px 0' }}>
                  {he.instructor.scoring.tier2}
                </h3>
                {tier2.length === 0 && (
                  <p style={{ color: 'var(--ink-faint)', fontSize: 14, margin: 0 }}>
                    הסטודנט/ית זיהה/תה את כל פריטי הרובריקה
                  </p>
                )}
                {tier2.map((rubric) => {
                  const sev = SEVERITY_COLORS[rubric.severity] || SEVERITY_COLORS.minor;
                  return (
                    <div
                      key={rubric.id}
                      style={{
                        padding: '12px 0',
                        borderBottom: '1px solid var(--border-light)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <StatusBadge color={sev.color} bg={sev.bg}>
                          {sev.label}
                        </StatusBadge>
                        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                          {rubric.category}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--ink)', margin: '4px 0', lineHeight: 1.5 }}>
                        {rubric.description}
                      </p>
                      {rubric.flaggedText && (
                        <div
                          style={{
                            background: sev.bg,
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 12,
                            color: 'var(--ink-soft)',
                            marginTop: 6,
                            borderInlineStart: `3px solid ${sev.color}`,
                          }}
                        >
                          &ldquo;{rubric.flaggedText}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Tier 3: Beyond Rubric */}
            <Card borderAccent="var(--info)">
              <div style={{ padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px 0' }}>
                  {he.instructor.scoring.tier3}
                </h3>
                {tier3.length === 0 && (
                  <p style={{ color: 'var(--ink-faint)', fontSize: 14, margin: 0 }}>
                    אין הערות מעבר לרובריקה
                  </p>
                )}
                {tier3.map((ann) => (
                  <div
                    key={ann.id}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid var(--border-light)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <StatusBadge
                        color="var(--info)"
                        bg="var(--info-soft)"
                      >
                        {ann.type}
                      </StatusBadge>
                    </div>
                    {ann.selectedText && (
                      <div
                        style={{
                          background: 'var(--info-soft)',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 12,
                          color: 'var(--ink-soft)',
                          marginBottom: 6,
                          borderInlineStart: '3px solid var(--info)',
                        }}
                      >
                        &ldquo;{ann.selectedText}&rdquo;
                      </div>
                    )}
                    <p style={{ fontSize: 13, color: 'var(--ink)', margin: '4px 0', lineHeight: 1.5 }}>
                      {ann.note || '—'}
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <Button
                        size="small"
                        onClick={() => handleBeyondAction(ann.id, 'confirm')}
                        disabled={beyondActionLoading === ann.id}
                      >
                        {he.instructor.scoring.confirmBeyond}
                      </Button>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => handleBeyondAction(ann.id, 'reject')}
                        disabled={beyondActionLoading === ann.id}
                      >
                        {he.instructor.scoring.rejectBeyond}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Override panel */}
            <Card borderAccent="var(--accent)">
              <div style={{ padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px 0' }}>
                  {he.instructor.scoring.override}
                </h3>

                {text.score && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 4 }}>
                        {he.instructor.scoring.tier1}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
                        {text.score.tier1Raw}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 4 }}>
                        {he.instructor.scoring.tier2}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--error)' }}>
                        {text.score.tier2Deductions}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 4 }}>
                        {he.instructor.scoring.tier3}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--info)' }}>
                        +{text.score.tier3Bonus}
                      </div>
                    </div>
                  </div>
                )}

                {text.score && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'var(--accent-soft)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 20,
                    }}
                  >
                    <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
                      {he.instructor.scoring.composite}
                    </span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                      {text.score.normalizedFinal}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Input
                    label={he.instructor.scoring.override}
                    type="number"
                    value={overrideScore}
                    onChange={(e) => setOverrideScore(e.target.value)}
                    placeholder={he.instructor.scoring.overridePlaceholder}
                    min={0}
                    max={100}
                  />
                  <Textarea
                    label="הערות"
                    value={overrideNotes}
                    onChange={(e) => setOverrideNotes(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleReleaseScore}
                    disabled={releaseLoading}
                    style={{
                      background: 'var(--success)',
                      color: '#fff',
                    }}
                  >
                    {releaseLoading ? '...' : `שחרר ציון`}
                  </Button>
                  {text.score?.releasedAt && (
                    <p style={{ fontSize: 12, color: 'var(--success)', margin: 0 }}>
                      ציון שוחרר ב-{new Date(text.score.releasedAt).toLocaleDateString('he-IL')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
