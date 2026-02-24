'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { he } from '@/locale/he';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { calculateCoverage } from '@/lib/utils';

interface Annotation {
  id: string;
  locationStart: number;
  locationEnd: number;
}

interface Score {
  id: string;
  normalizedFinal: number;
  releasedAt: string | null;
}

interface TextItem {
  id: string;
  studentCode: string;
  studentName: string | null;
  status: string;
  wordCount: number;
  textContent: string;
  annotations: Annotation[];
  score: Score | null;
}

interface Assignment {
  id: string;
  title: string;
  status: string;
  texts: TextItem[];
}

export default function SubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scoreAllLoading, setScoreAllLoading] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState(false);

  const fetchAssignment = useCallback(() => {
    setLoading(true);
    fetch(`/api/assignments/${assignmentId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => setAssignment(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  async function handleScoreAll() {
    if (!assignment) return;
    setScoreAllLoading(true);
    try {
      for (const text of assignment.texts) {
        if (text.annotations.length > 0) {
          const res = await fetch(`/api/scoring/${text.id}`, {
            method: 'POST',
          });
          if (!res.ok) {
            const data = await res.json();
            console.error(`Score failed for ${text.studentCode}:`, data.error);
          }
        }
      }
      fetchAssignment();
    } catch {
      setError('שגיאה בדירוג');
    } finally {
      setScoreAllLoading(false);
    }
  }

  async function handleReleaseGrades() {
    if (!assignment) return;
    setReleaseLoading(true);
    try {
      for (const text of assignment.texts) {
        if (text.score) {
          await fetch(`/api/scoring/${text.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ release: true }),
          });
        }
      }
      fetchAssignment();
    } catch {
      setError('שגיאה בשחרור ציונים');
    } finally {
      setReleaseLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center', color: 'var(--ink-soft)' }}>
          ...
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--error)' }}>{error || 'לא נמצא'}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '40px 24px',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Back */}
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

        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', margin: '0 0 24px 0' }}>
          {he.instructor.submissions}
        </h1>

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

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <Button onClick={handleScoreAll} disabled={scoreAllLoading}>
            {scoreAllLoading ? '...' : he.instructor.scoreAll}
          </Button>
          <Button
            variant="secondary"
            onClick={handleReleaseGrades}
            disabled={releaseLoading}
          >
            {releaseLoading ? '...' : he.instructor.releaseGrades}
          </Button>
        </div>

        {/* Table */}
        <Card>
          <div style={{ padding: 20, overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--ink-soft)', fontWeight: 600 }}>
                    קוד
                  </th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--ink-soft)', fontWeight: 600 }}>
                    שם
                  </th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--ink-soft)', fontWeight: 600 }}>
                    סטטוס
                  </th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--ink-soft)', fontWeight: 600 }}>
                    הערות
                  </th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--ink-soft)', fontWeight: 600 }}>
                    כיסוי %
                  </th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--ink-soft)', fontWeight: 600 }}>
                    ציון
                  </th>
                  <th style={{ padding: '10px 12px' }}></th>
                </tr>
              </thead>
              <tbody>
                {assignment.texts.map((t) => {
                  const coverage = calculateCoverage(
                    t.textContent.length,
                    t.annotations
                  );
                  const hasScore = t.score !== null;
                  const released = t.score?.releasedAt !== null && t.score?.releasedAt !== undefined;

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: 'var(--ink)' }}>
                        {t.studentCode}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--ink-soft)' }}>
                        {t.studentName || '—'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <StatusBadge
                          color={t.status === 'scored' ? 'var(--success)' : 'var(--ink-faint)'}
                          bg={t.status === 'scored' ? 'var(--success-soft)' : 'var(--neutral-soft)'}
                        >
                          {t.status}
                        </StatusBadge>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--ink-soft)' }}>
                        {t.annotations.length}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--ink-soft)' }}>
                        {coverage}%
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {hasScore ? (
                          <span
                            style={{
                              fontWeight: 600,
                              color: released ? 'var(--success)' : 'var(--ink)',
                            }}
                          >
                            {t.score!.normalizedFinal}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--ink-faint)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() =>
                            router.push(
                              `/instructor/${assignmentId}/submissions/${t.studentCode}`
                            )
                          }
                        >
                          צפה
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
