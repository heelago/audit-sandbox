'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SearchIcon } from '@/components/icons';
import { he } from '@/locale/he';
import { parseSectionsFromText, truncateTextToWords } from '@/lib/assignment-sections';
import { countWords, normalizeGeneratedText } from '@/lib/utils';

interface TextData {
  id: string;
  textContent: string;
  wordCount: number;
}

interface AssignmentData {
  id: string;
  title: string;
  promptText: string;
  sectionBlueprint?: string | null;
  texts: TextData[];
}

export default function StudentLandingPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [textId, setTextId] = useState<string | null>(null);
  const [studentText, setStudentText] = useState<TextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [assignRes, sessionRes] = await Promise.all([
          fetch(`/api/assignments/${assignmentId}`),
          fetch('/api/auth/session'),
        ]);

        if (!assignRes.ok) {
          setError('Unable to load assignment');
          return;
        }

        const assignData: AssignmentData = await assignRes.json();
        const sessionData = await sessionRes.json();
        setAssignment(assignData);

        if (sessionData?.textId) {
          setTextId(sessionData.textId);
          const myText = assignData.texts.find(
            (t: TextData) => t.id === sessionData.textId
          );
          if (myText) setStudentText(myText);
        }
      } catch {
        setError('Network error');
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
          fontSize: '14px',
          color: 'var(--ink-faint)',
        }}
      >
        ...
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--error)',
        }}
      >
        {error || 'Assignment not found'}
      </div>
    );
  }

  const normalizedStudentText = studentText ? normalizeGeneratedText(studentText.textContent) : '';
  const textPreview = normalizedStudentText ? truncateTextToWords(normalizedStudentText, 800) : '';
  const sections = parseSectionsFromText(assignment.sectionBlueprint ?? assignment.promptText);

  const wordCount = normalizedStudentText ? countWords(normalizedStudentText) : studentText?.wordCount ?? 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        direction: 'rtl',
        textAlign: 'right',
      }}
    >
      <div style={{ maxWidth: '680px', width: '100%', textAlign: 'center' }}>
        {/* Icon */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'var(--accent-soft)',
            border: '1.5px solid #8B5E3C33',
            marginBottom: '14px',
          }}
        >
          <SearchIcon size={24} color="var(--accent)" />
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '38px',
            fontWeight: 500,
            color: 'var(--ink)',
            margin: '0 0 6px',
          }}
        >
          {he.app.name}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            color: 'var(--ink-soft)',
            margin: '0 0 6px',
            fontWeight: 300,
          }}
        >
          {he.app.tagline}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--ink-faint)',
            margin: '0 0 32px',
            maxWidth: '500px',
            display: 'inline-block',
            lineHeight: '1.7',
          }}
        >
          {he.app.description}
        </p>

        {/* Main Card */}
        <div
          style={{
            background: 'var(--card)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '28px',
            textAlign: 'right',
            boxShadow: '0 1px 12px rgba(0,0,0,0.03)',
          }}
        >
          {/* Prompt */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--ink-soft)',
                  letterSpacing: '0.3px',
                }}
              >
                {he.landing.assignmentPrompt}
              </label>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  color: 'var(--accent)',
                  background: 'var(--accent-soft)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 600,
                }}
              >
                {he.landing.readOnly}
              </span>
            </div>
            <div
              style={{
                padding: '14px',
                background: 'var(--bg)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                color: 'var(--ink)',
                lineHeight: '1.7',
                direction: 'rtl',
                textAlign: 'right',
              }}
            >
              {assignment.promptText}
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                color: 'var(--ink-faint)',
                margin: '6px 0 0',
                fontStyle: 'italic',
                lineHeight: '1.6',
              }}
            >
              {he.landing.promptNote}
            </p>
          </div>

          {sections.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--ink-soft)',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                חלקי המטלה
              </label>
              <div style={{ display: 'grid', gap: '8px' }}>
                {sections.map((section) => (
                  <div
                    key={section.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: 'var(--card-hover)',
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
            </div>
          )}

          {/* Assignment Title */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--ink-soft)',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              {he.landing.assignmentTitle}
            </label>
            <div
              style={{
                padding: '9px 12px',
                border: '1px solid var(--border)',
                borderRadius: '7px',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                background: 'var(--card-hover)',
                color: 'var(--ink)',
                direction: 'rtl',
                textAlign: 'right',
              }}
            >
              {assignment.title}
            </div>
          </div>

          {/* AI Text Preview */}
          {studentText && (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <label
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--ink-soft)',
                  }}
                >
                  {he.landing.aiGeneratedText}
                </label>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '10px',
                    color: 'var(--info)',
                    background: 'var(--info-soft)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 600,
                  }}
                >
                  {he.landing.aiAuthored}
                </span>
              </div>
              <div
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '14px',
                  maxHeight: '360px',
                  overflowY: 'auto',
                  fontFamily: 'var(--font-display)',
                  fontSize: '13px',
                  color: 'var(--ink)',
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap',
                  direction: 'rtl',
                  textAlign: 'right',
                }}
              >
                {textPreview}
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '11px',
                  color: 'var(--ink-faint)',
                  margin: '6px 0 0',
                }}
              >
                {wordCount} {he.landing.wordCount} — {he.landing.textNote}
              </p>
            </>
          )}

          {/* Begin Audit Button */}
          <button
            onClick={() =>
              router.push(`/student/${assignmentId}/workspace`)
            }
            style={{
              marginTop: '20px',
              width: '100%',
              padding: '12px 18px',
              background: 'var(--accent)',
              color: '#FFF9F4',
              border: 'none',
              borderRadius: '7px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
          >
            {he.landing.beginAudit}
          </button>
        </div>

        {/* Process Steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            marginTop: '28px',
          }}
        >
          {he.landing.steps.map((step, i) => (
            <div key={i} style={{ padding: '10px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'var(--ink)',
                  color: 'var(--bg)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                }}
              >
                {step.title}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '11px',
                  color: 'var(--ink-faint)',
                  lineHeight: '1.5',
                }}
              >
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
