'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowIcon, annotationIcons, evidenceIcons } from '@/components/icons';
import { he } from '@/locale/he';
import { calculateCoverage } from '@/lib/utils';
import type { AnnotationType } from '@/components/ui/Badge';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const ANNOTATION_TYPES: {
  id: AnnotationType;
  label: string;
  color: string;
}[] = [
  { id: 'error', label: he.annotationTypes.error.label, color: '#B54D4D' },
  { id: 'verified', label: he.annotationTypes.verified.label, color: '#4D8B6A' },
  { id: 'alternative', label: he.annotationTypes.alternative.label, color: '#A68A2B' },
  { id: 'gap', label: he.annotationTypes.gap.label, color: '#9B6B42' },
  { id: 'nuance', label: he.annotationTypes.nuance.label, color: '#4A6F8B' },
  { id: 'accepted', label: he.annotationTypes.accepted.label, color: '#7A7568' },
];

const EVIDENCE_LABELS: Record<string, string> = {
  conversation: he.evidenceTypes.conversation.label,
  source: he.evidenceTypes.source.label,
  note: he.evidenceTypes.note.label,
};

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface EvidenceItem {
  id: string;
  type: string;
  content: string;
}

interface AnnotationItem {
  id: string;
  type: AnnotationType;
  locationStart: number;
  locationEnd: number;
  selectedText: string;
  note: string;
  evidence: EvidenceItem[];
  createdAt: string;
}

interface TextData {
  id: string;
  textContent: string;
  wordCount: number;
  annotations: AnnotationItem[];
}

interface AssignmentData {
  id: string;
  title: string;
  promptText: string;
  texts: TextData[];
}

/* ================================================================== */
/* Report Page                                                         */
/* ================================================================== */

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [textContent, setTextContent] = useState('');
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [assignRes, sessionRes] = await Promise.all([
          fetch(`/api/assignments/${assignmentId}`),
          fetch('/api/auth/session'),
        ]);

        if (!assignRes.ok) return;

        const assignData: AssignmentData = await assignRes.json();
        const sessionData = await sessionRes.json();
        setAssignment(assignData);

        if (sessionData?.textId) {
          const myText = assignData.texts.find(
            (t: TextData) => t.id === sessionData.textId
          );
          if (myText) {
            setTextContent(myText.textContent);
            setAnnotations(myText.annotations || []);

            // Mark text as submitted
            try {
              await fetch(`/api/texts/${sessionData.textId}/submit`, {
                method: 'POST',
              });
            } catch {
              // Ignore - non-critical
            }
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [assignmentId]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-body)',
          color: 'var(--ink-faint)',
        }}
      >
        ...
      </div>
    );
  }

  /* ── Computed values ─────────────────────────────────────────── */
  const totalChars = textContent.length;
  const coverage = calculateCoverage(
    totalChars,
    annotations.map((a) => ({
      locationStart: a.locationStart,
      locationEnd: a.locationEnd,
    }))
  );
  const uncheckedPct = 100 - coverage;
  const totalEvidence = annotations.reduce(
    (s, a) => s + (a.evidence?.length || 0),
    0
  );
  const withNotes = annotations.filter((a) => a.note?.trim()).length;

  const byType = ANNOTATION_TYPES.map((t) => ({
    ...t,
    items: annotations.filter((a) => a.type === t.id),
  })).filter((t) => t.items.length > 0);

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '24px',
        direction: 'rtl',
        textAlign: 'right',
      }}
    >
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '28px',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                fontWeight: 500,
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              {he.report.title}
            </h1>
            {assignment?.title && (
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--ink-faint)',
                  margin: '4px 0 0',
                }}
              >
                {assignment.title}
              </p>
            )}
          </div>
          <button
            onClick={() =>
              router.push(`/student/${assignmentId}/workspace`)
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--card)',
              color: 'var(--ink)',
              border: '1px solid var(--border)',
              borderRadius: '7px',
              padding: '9px 18px',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              direction: 'rtl',
            }}
          >
            <ArrowIcon size={14} color="var(--ink)" />{' '}
            {he.report.backToWorkspace}
          </button>
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            marginBottom: '24px',
          }}
        >
          {[
            {
              label: he.report.stats.annotations,
              value: annotations.length,
              sub: undefined,
            },
            {
              label: he.report.stats.coverage,
              value: `${coverage}%`,
              sub: `${uncheckedPct}% ${he.report.stats.unchecked}`,
            },
            {
              label: he.report.stats.evidence,
              value: totalEvidence,
              sub: undefined,
            },
            {
              label: he.report.stats.reflections,
              value: `${withNotes}/${annotations.length}`,
              sub: undefined,
            },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '14px 16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '11px',
                  color: 'var(--ink-faint)',
                  marginTop: '2px',
                }}
              >
                {stat.label}
              </div>
              {stat.sub && (
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '10px',
                    color: 'var(--ink-faint)',
                  }}
                >
                  {stat.sub}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Annotation breakdown */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--ink)',
              marginBottom: '10px',
            }}
          >
            {he.report.breakdown}
          </div>
          {byType.map((t) => {
            const Icon = annotationIcons[t.id];
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '5px',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '3px',
                    background: t.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12.5px',
                    color: 'var(--ink-soft)',
                    minWidth: '130px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {Icon && <Icon size={12} color={t.color} />} {t.label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: '6px',
                    background: 'var(--bg)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(
                        5,
                        (t.items.length /
                          Math.max(annotations.length, 1)) *
                          100
                      )}%`,
                      background: t.color,
                      borderRadius: '3px',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'var(--ink-faint)',
                    minWidth: '18px',
                    textAlign: 'left',
                  }}
                >
                  {t.items.length}
                </span>
              </div>
            );
          })}
        </div>

        {/* Detailed annotations grouped by type */}
        {byType.map((type) => {
          const Icon = annotationIcons[type.id];
          return (
            <div key={type.id} style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  paddingBottom: '6px',
                  borderBottom: `2px solid ${type.color}`,
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {Icon && <Icon size={15} color={type.color} />}{' '}
                {type.label} ({type.items.length})
              </h3>
              {type.items.map((ann) => (
                <div
                  key={ann.id}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px',
                  }}
                >
                  {/* Excerpt */}
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '12.5px',
                      color: 'var(--ink-soft)',
                      fontStyle: 'italic',
                      padding: '5px 10px',
                      background: 'var(--bg)',
                      borderRadius: '4px',
                      borderRight: `3px solid ${type.color}`,
                      marginBottom: '6px',
                      lineHeight: '1.7',
                    }}
                  >
                    &laquo;
                    {ann.selectedText.length > 220
                      ? ann.selectedText.slice(0, 220) + '...'
                      : ann.selectedText}
                    &raquo;
                  </div>
                  {/* Note */}
                  {ann.note && (
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '12.5px',
                        color: 'var(--ink)',
                        lineHeight: '1.7',
                        whiteSpace: 'pre-wrap',
                        marginBottom: '6px',
                      }}
                    >
                      {ann.note}
                    </div>
                  )}
                  {/* Evidence */}
                  {ann.evidence?.map((ev) => {
                    const EvIcon = evidenceIcons[ev.type] ?? null;
                    return (
                      <div
                        key={ev.id}
                        style={{
                          background: 'var(--bg)',
                          borderRadius: '5px',
                          padding: '5px 8px',
                          marginBottom: '3px',
                          fontSize: '11.5px',
                          fontFamily: 'var(--font-body)',
                          color: 'var(--ink-soft)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '5px',
                        }}
                      >
                        {EvIcon && <EvIcon size={12} color="var(--ink-soft)" />}
                        <span>
                          <strong>
                            {EVIDENCE_LABELS[ev.type] || ev.type}:
                          </strong>{' '}
                          {ev.content}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}

        {/* Empty state */}
        {annotations.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--ink-faint)',
              lineHeight: '1.8',
            }}
          >
            <div style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 500, color: 'var(--ink-soft)' }}>
              {he.workspace.emptyState}
            </div>
            <button
              onClick={() =>
                router.push(`/student/${assignmentId}/workspace`)
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '16px',
                background: 'var(--accent)',
                color: '#FFF9F4',
                border: 'none',
                borderRadius: '7px',
                padding: '10px 20px',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <ArrowIcon size={14} color="#FFF9F4" />{' '}
              {he.report.backToWorkspace}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
