'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SearchIcon } from '@/components/icons';
import { he } from '@/locale/he';
import type { AnnotationType } from '@/components/ui/Badge';
import { parseSectionsFromText } from '@/lib/assignment-sections';
import { normalizeGeneratedText } from '@/lib/utils';
import type { AnnotationItem, EvidenceItem, TextSelection, TextData, AssignmentData } from '@/lib/types';
import { DocViewer } from '@/components/workspace/DocViewer';
import { AnnCard } from '@/components/workspace/AnnCard';
import { GuideTab } from '@/components/workspace/GuideTab';
import { AnnotationLegend } from '@/components/workspace/AnnotationLegend';
import { SelectionToolbar } from '@/components/workspace/SelectionToolbar';

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [textId, setTextId] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState('audit');
  const [loading, setLoading] = useState(true);

  /* ── Load data ──────────────────────────────────────────────── */
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
          setTextId(sessionData.textId);
          const myText = assignData.texts.find(
            (t: TextData) => t.id === sessionData.textId
          );
          if (myText) {
            setTextContent(normalizeGeneratedText(myText.textContent));
            setAnnotations(myText.annotations || []);
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

  /* ── Handlers ───────────────────────────────────────────────── */
  const handleSelect = useCallback(
    (sel: TextSelection) => setSelection(sel),
    []
  );

  const createAnnotation = async (typeId: AnnotationType) => {
    if (!selection || !textId) return;

    try {
      const res = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textId,
          type: typeId,
          locationStart: selection.start,
          locationEnd: selection.end,
          selectedText: selection.text,
        }),
      });

      if (res.ok) {
        const newAnn: AnnotationItem = await res.json();
        setAnnotations((prev) => [...prev, newAnn]);
        setActiveId(newAnn.id);
        setSidebarTab('audit');
      }
    } catch {
      // silently fail
    }

    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const updateNote = async (id: string, note: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, note } : a))
    );
    try {
      await fetch(`/api/annotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
    } catch {
      // silently fail
    }
  };

  const deleteAnnotation = async (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (activeId === id) setActiveId(null);
    try {
      await fetch(`/api/annotations/${id}`, { method: 'DELETE' });
    } catch {
      // silently fail
    }
  };

  const addEvidence = async (
    annotationId: string,
    type: string,
    content: string
  ) => {
    try {
      const res = await fetch(`/api/annotations/${annotationId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content }),
      });

      if (res.ok) {
        const newEvidence: EvidenceItem = await res.json();
        setAnnotations((prev) =>
          prev.map((a) =>
            a.id === annotationId
              ? { ...a, evidence: [...a.evidence, newEvidence] }
              : a
          )
        );
      }
    } catch {
      // silently fail
    }
  };

  /* ── Computed ────────────────────────────────────────────────── */
  const coverage =
    textContent.length > 0
      ? Math.round(
          (annotations.reduce(
            (s, a) => s + (a.locationEnd - a.locationStart),
            0
          ) /
            textContent.length) *
            100
        )
      : 0;
  const structuredSections = parseSectionsFromText(
    assignment?.sectionBlueprint ?? assignment?.promptText ?? ''
  );

  /* ── Loading state ──────────────────────────────────────────── */
  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          fontFamily: 'var(--font-body)',
          color: 'var(--ink-faint)',
        }}
      >
        ...
      </div>
    );
  }

  /* ── Main render ────────────────────────────────────────────── */
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--bg)',
        overflow: 'hidden',
        direction: 'rtl',
      }}
    >
      {/* ─── Main pane ─── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            padding: '10px 20px',
            background: 'var(--card)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <SearchIcon size={18} color="var(--accent)" />
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                }}
              >
                {he.app.name}
              </div>
              {assignment?.title && (
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px',
                    color: 'var(--ink-faint)',
                  }}
                >
                  {assignment.title}
                </div>
              )}
            </div>
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                color: 'var(--ink-faint)',
              }}
            >
              {annotations.length} {he.workspace.annotations} | {coverage}%{' '}
              {he.workspace.covered}
            </span>
            <button
              onClick={() =>
                router.push(`/student/${assignmentId}/report`)
              }
              style={{
                background: 'var(--accent)',
                color: '#FFF9F4',
                border: 'none',
                borderRadius: '7px',
                padding: '9px 18px',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
            >
              {he.workspace.generateReport}
            </button>
          </div>
        </div>

        {/* AI authorship banner */}
        <div
          style={{
            padding: '7px 20px',
            background: 'var(--info-soft)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              color: 'var(--info)',
              background: '#4A6F8B22',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            {he.workspace.aiAuthoredBadge}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11.5px',
              color: 'var(--ink-soft)',
            }}
          >
            {he.workspace.aiAuthoredMessage}
          </span>
        </div>

        {/* Selection toolbar */}
        {selection && (
          <SelectionToolbar
            onCreateAnnotation={createAnnotation}
            onDismiss={() => {
              setSelection(null);
              window.getSelection()?.removeAllRanges();
            }}
          />
        )}

        {/* Select hint */}
        {!selection && annotations.length === 0 && (
          <div
            style={{
              padding: '8px 20px',
              background: '#A68A2B14',
              borderBottom: '1px solid var(--border)',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: 'var(--ink-soft)',
              textAlign: 'center',
            }}
          >
            {he.workspace.selectHint}
          </div>
        )}

        {/* Document */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '28px 44px',
          }}
        >
          <DocViewer
            text={textContent}
            annotations={annotations}
            activeId={activeId}
            onSelect={handleSelect}
            onClickAnnotation={setActiveId}
          />
        </div>

        {/* Legend bar */}
        <AnnotationLegend />
      </div>

      {/* ─── Sidebar ─── */}
      <div
        style={{
          width: '370px',
          background: 'var(--card)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {[
            {
              id: 'audit',
              label: `${he.sidebar.auditTab} (${annotations.length})`,
            },
            { id: 'prompt', label: he.sidebar.promptTab },
            { id: 'guide', label: he.sidebar.guideTab },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px',
                background:
                  sidebarTab === tab.id ? 'var(--bg)' : 'var(--card)',
                border: 'none',
                borderBottom:
                  sidebarTab === tab.id
                    ? '2px solid var(--accent)'
                    : '2px solid transparent',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: sidebarTab === tab.id ? 600 : 400,
                color:
                  sidebarTab === tab.id
                    ? 'var(--ink)'
                    : 'var(--ink-faint)',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '12px',
          }}
        >
          {/* Audit tab */}
          {sidebarTab === 'audit' &&
            (annotations.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 16px',
                  color: 'var(--ink-faint)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  lineHeight: '1.8',
                }}
              >
                <div style={{ marginBottom: '10px', opacity: 0.5 }}>
                  <SearchIcon size={28} color="var(--ink-faint)" />
                </div>
                {he.workspace.emptyState}
                <div style={{ marginTop: '10px', fontSize: '11px' }}>
                  {he.workspace.emptyStateHint}
                </div>
              </div>
            ) : (
              [...annotations]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((ann) => (
                  <AnnCard
                    key={ann.id}
                    ann={ann}
                    onUpdateNote={updateNote}
                    onDelete={deleteAnnotation}
                    onAddEvidence={addEvidence}
                  />
                ))
            ))}

          {/* Prompt tab */}
          {sidebarTab === 'prompt' && (
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: 'var(--ink-soft)',
                lineHeight: '1.7',
                direction: 'rtl',
                textAlign: 'right',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: 'var(--ink)',
                  marginBottom: '10px',
                }}
              >
                {he.sidebar.promptTitle}
              </div>
              {structuredSections.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  {structuredSections.map((section) => (
                    <div
                      key={section.id}
                      style={{
                        background: 'var(--card-hover)',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        padding: '10px 12px',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                        חלק {section.order}: {section.title}
                      </div>
                      {section.task && (
                        <div style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: '1.6' }}>
                          {section.task}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div
                style={{
                  background: 'var(--bg)',
                  borderRadius: '8px',
                  padding: '14px',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '13.5px',
                  lineHeight: '1.7',
                  color: 'var(--ink)',
                  marginBottom: '12px',
                }}
              >
                {assignment?.promptText}
              </div>
              <div
                style={{
                  background: 'var(--accent-soft)',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #8B5E3C25',
                  fontSize: '12px',
                  lineHeight: '1.7',
                }}
              >
                <strong style={{ color: 'var(--accent)' }}>
                  {he.sidebar.aboutPrompt}
                </strong>
                <div
                  style={{ marginTop: '4px', color: 'var(--ink-soft)' }}
                >
                  {he.sidebar.promptReadOnly}
                </div>
                <div
                  style={{ marginTop: '6px', color: 'var(--ink-soft)' }}
                >
                  {he.sidebar.promptVariance}
                </div>
                <div
                  style={{ marginTop: '6px', color: 'var(--ink-soft)' }}
                >
                  {he.sidebar.promptScoring}
                </div>
              </div>
            </div>
          )}

          {/* Guide tab */}
          {sidebarTab === 'guide' && <GuideTab />}
        </div>
      </div>
    </div>
  );
}
