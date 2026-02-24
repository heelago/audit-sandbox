'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { he } from '@/locale/he';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';

interface AssignmentSummary {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  _count: { texts: number };
}

interface AccessRequestRow {
  id: string;
  fullName: string;
  email: string;
  institution: string | null;
  role: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  inviteCode: string | null;
  inviteEmailStatus: 'not_sent' | 'queued' | 'sent' | 'failed';
  inviteEmailAttemptedAt: string | null;
  inviteEmailSentAt: string | null;
  inviteEmailMessageId: string | null;
  inviteEmailError: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  draft: { color: 'var(--ink-faint)', bg: 'var(--neutral-soft)' },
  generating: { color: 'var(--warn)', bg: 'var(--warn-soft)' },
  analyzing: { color: 'var(--info)', bg: 'var(--info-soft)' },
  calibrating: { color: 'var(--accent)', bg: 'var(--accent-soft)' },
  active: { color: 'var(--success)', bg: 'var(--success-soft)' },
  grading: { color: 'var(--warn)', bg: 'var(--warn-soft)' },
  closed: { color: 'var(--ink-faint)', bg: 'var(--neutral-soft)' },
};

const EMAIL_STATUS_LABELS: Record<AccessRequestRow['inviteEmailStatus'], string> = {
  not_sent: 'טרם נשלח',
  queued: 'בתור שליחה',
  sent: 'נשלח',
  failed: 'נכשל',
};

export default function InstructorDashboard() {
  const router = useRouter();
  const [dashboardView, setDashboardView] = useState<'pedagogy' | 'admin'>('pedagogy');
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequestRow[]>([]);
  const [canManageAccess, setCanManageAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessError, setAccessError] = useState('');
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const pendingAccessRequests = useMemo(
    () => accessRequests.filter((row) => row.status === 'pending'),
    [accessRequests]
  );
  const approvedAccessRequests = useMemo(
    () => accessRequests.filter((row) => row.status === 'approved' && !!row.inviteCode),
    [accessRequests]
  );

  const refreshAccessRequests = async () => {
    try {
      const res = await fetch('/api/access-requests');
      if (res.status === 403) {
        setCanManageAccess(false);
        setAccessRequests([]);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch access requests');
      }
      const rows = (await res.json()) as AccessRequestRow[];
      setCanManageAccess(true);
      setAccessError('');
      setAccessRequests(rows);
    } catch {
      setAccessError('טעינת בקשות גישה נכשלה');
    }
  };

  useEffect(() => {
    fetch('/api/assignments')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => setAssignments(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshAccessRequests().finally(() => setAccessLoading(false));
  }, []);

  useEffect(() => {
    if (dashboardView === 'admin' && !canManageAccess && !accessLoading) {
      setDashboardView('pedagogy');
    }
  }, [dashboardView, canManageAccess, accessLoading]);

  const processRequest = async (
    requestId: string,
    action: 'approve' | 'reject' | 'send_email' | 'refresh_email_status'
  ) => {
    setPendingActionId(requestId);
    setAccessError('');

    try {
      const res = await fetch(`/api/access-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = typeof data.details === 'string' ? `\n${data.details}` : '';
        throw new Error(`${data.error || 'הפעולה נכשלה'}${detail}`);
      }

      if (action === 'approve' && data.inviteCode) {
        const inviteCode = String(data.inviteCode);
        try {
          await navigator.clipboard.writeText(inviteCode);
        } catch {
          // Clipboard may be blocked; still show the code.
        }
        const emailState = typeof data?.email?.state === 'string' ? data.email.state : null;
        const emailLine =
          emailState === 'queued'
            ? '\nמייל הצטרפות נוסף אוטומטית לתור שליחה.'
            : emailState === 'failed'
              ? '\nשליחת המייל האוטומטית נכשלה. ניתן ללחוץ "שליחת מייל הצטרפות" בכרטיס המאושר.'
              : '';
        window.alert(
          `קוד גישה נוצר: ${inviteCode}\n(הקוד הועתק אם הדפדפן מאפשר זאת)${emailLine}`
        );
      }

      if (action === 'send_email') {
        window.alert('המייל נוסף לתור שליחה. לחצו על בדיקת סטטוס כדי לראות אם נשלח בפועל.');
      }

      if (action === 'refresh_email_status') {
        window.alert('סטטוס השליחה עודכן.');
      }

      await refreshAccessRequests();
    } catch (err) {
      setAccessError(err instanceof Error ? err.message : 'הפעולה נכשלה');
    } finally {
      setPendingActionId(null);
    }
  };

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      window.alert('הקוד הועתק.');
    } catch {
      window.alert(`לא ניתן להעתיק אוטומטית. הקוד הוא: ${code}`);
    }
  };

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            {he.instructor.dashboard}
          </h1>
          <Button onClick={() => router.push('/instructor/create')}>{he.instructor.createAssignment}</Button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 20,
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 6,
            background: 'var(--card)',
            width: 'fit-content',
          }}
        >
          <button
            type="button"
            onClick={() => setDashboardView('pedagogy')}
            style={{
              border: dashboardView === 'pedagogy' ? '1px solid var(--accent)' : '1px solid transparent',
              background: dashboardView === 'pedagogy' ? 'var(--accent-soft)' : 'transparent',
              color: dashboardView === 'pedagogy' ? 'var(--accent)' : 'var(--ink-soft)',
              borderRadius: 8,
              padding: '6px 12px',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            פדגוגיה
          </button>
          <button
            type="button"
            onClick={() => setDashboardView('admin')}
            style={{
              border: dashboardView === 'admin' ? '1px solid #2f789d' : '1px solid transparent',
              background: dashboardView === 'admin' ? '#e8f4fb' : 'transparent',
              color: dashboardView === 'admin' ? '#1f678a' : 'var(--ink-soft)',
              borderRadius: 8,
              padding: '6px 12px',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ניהול גישה
          </button>
        </div>

        {dashboardView === 'pedagogy' && loading && (
          <p style={{ color: 'var(--ink-soft)', textAlign: 'center', marginTop: 60 }}>
            ...
          </p>
        )}

        {dashboardView === 'pedagogy' && error && (
          <p style={{ color: 'var(--error)', textAlign: 'center', marginTop: 60 }}>
            {error}
          </p>
        )}

        {dashboardView === 'pedagogy' && !loading && !error && assignments.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              marginTop: 80,
              color: 'var(--ink-faint)',
            }}
          >
            <p style={{ fontSize: 18, marginBottom: 8 }}>אין מטלות עדיין</p>
            <p style={{ fontSize: 14 }}>צרו מטלה חדשה כדי להתחיל</p>
          </div>
        )}

        {dashboardView === 'pedagogy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {assignments.map((a) => {
              const statusKey = a.status as keyof typeof he.instructor.status;
              const statusLabel = he.instructor.status[statusKey] || a.status;
              const sc = STATUS_COLORS[a.status] || STATUS_COLORS.draft;
              const created = new Date(a.createdAt).toLocaleDateString('he-IL');

              return (
                <Card key={a.id} style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                  <div onClick={() => router.push(`/instructor/${a.id}`)} style={{ padding: 20 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 12,
                      }}
                    >
                      <h2
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: 'var(--ink)',
                          margin: 0,
                        }}
                      >
                        {a.title}
                      </h2>
                      <StatusBadge color={sc.color} bg={sc.bg}>
                        {statusLabel}
                      </StatusBadge>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 24,
                        fontSize: 14,
                        color: 'var(--ink-soft)',
                      }}
                    >
                      <span>{a._count.texts} טקסטים</span>
                      <span>{created}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {dashboardView === 'admin' && accessLoading && (
          <p style={{ color: 'var(--ink-soft)', textAlign: 'center', marginTop: 60 }}>טוען נתוני ניהול...</p>
        )}

        {dashboardView === 'admin' && !accessLoading && !canManageAccess && (
          <div
            style={{
              marginTop: 20,
              border: '1px solid var(--border)',
              background: 'var(--card)',
              borderRadius: 12,
              padding: 16,
              color: 'var(--ink-soft)',
              fontSize: 14,
            }}
          >
            אין הרשאת ניהול בקשות גישה עבור הקוד הנוכחי.
          </div>
        )}

        {dashboardView === 'admin' && canManageAccess && !accessLoading && (
          <div
            style={{
              marginTop: 4,
              border: '1px solid #d7e2ea',
              background: '#f8fbfd',
              borderRadius: 12,
              padding: 16,
              display: 'grid',
              gap: 16,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: '#29485a' }}>בקשות גישה למרצים</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#4e6776' }}>
                אישור בקשה יוצר קוד גישה ושולח אוטומטית מייל הצטרפות. אפשר לשלוח מחדש ידנית במקרה הצורך.
              </p>
            </div>

            {accessError && (
              <p style={{ margin: '0', color: 'var(--error)', fontSize: 12 }}>{accessError}</p>
            )}

            {pendingAccessRequests.length > 0 && (
              <div style={{ display: 'grid', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#35566b', fontWeight: 700 }}>ממתינות לאישור</p>
                {pendingAccessRequests.map((req) => (
                  <Card key={req.id} style={{ borderColor: '#d8e4ec' }}>
                    <div style={{ padding: 14, display: 'grid', gap: 8 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 10,
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <strong style={{ color: '#2f4d5f' }}>{req.fullName}</strong>
                        <span style={{ fontSize: 12, color: '#5b7280' }}>
                          {new Date(req.createdAt).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#45606e' }}>
                        <div>אימייל: {req.email}</div>
                        {req.institution && <div>מוסד: {req.institution}</div>}
                        {req.role && <div>תפקיד: {req.role}</div>}
                      </div>
                      {req.message && (
                        <div
                          style={{
                            fontSize: 12,
                            color: '#516b79',
                            lineHeight: 1.6,
                            background: '#fff',
                            border: '1px solid #dfe8ee',
                            borderRadius: 8,
                            padding: '8px 10px',
                          }}
                        >
                          {req.message}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Button
                          variant="secondary"
                          onClick={() => processRequest(req.id, 'reject')}
                          disabled={pendingActionId === req.id}
                        >
                          דחייה
                        </Button>
                        <Button onClick={() => processRequest(req.id, 'approve')} disabled={pendingActionId === req.id}>
                          אישור, הפקת קוד ושליחת מייל
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {approvedAccessRequests.length > 0 && (
              <div style={{ display: 'grid', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#35566b', fontWeight: 700 }}>אושר, סטטוס שליחת מייל</p>
                {approvedAccessRequests.map((req) => {
                  const isSending = pendingActionId === req.id;
                  const canSendEmail =
                    req.inviteEmailStatus === 'not_sent' || req.inviteEmailStatus === 'failed';
                  const sendLabel =
                    req.inviteEmailStatus === 'failed'
                      ? 'שליחה מחדש'
                      : req.inviteEmailStatus === 'sent'
                        ? 'נשלח'
                        : req.inviteEmailStatus === 'queued'
                          ? 'בתור'
                          : 'שליחת מייל הצטרפות';

                  return (
                    <Card key={req.id} style={{ borderColor: '#d8e4ec' }}>
                      <div style={{ padding: 14, display: 'grid', gap: 8 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 10,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                          }}
                        >
                          <strong style={{ color: '#2f4d5f' }}>{req.fullName}</strong>
                          <span style={{ fontSize: 12, color: '#5b7280' }}>{EMAIL_STATUS_LABELS[req.inviteEmailStatus]}</span>
                        </div>

                        <div style={{ fontSize: 13, color: '#45606e' }}>
                          <div>אימייל: {req.email}</div>
                          <div>קוד: {req.inviteCode}</div>
                          {req.inviteEmailMessageId && <div>מזהה הודעה: {req.inviteEmailMessageId}</div>}
                          {req.inviteEmailAttemptedAt && (
                            <div>ניסיון שליחה: {new Date(req.inviteEmailAttemptedAt).toLocaleString('he-IL')}</div>
                          )}
                          {req.inviteEmailSentAt && (
                            <div>נשלח בתאריך: {new Date(req.inviteEmailSentAt).toLocaleString('he-IL')}</div>
                          )}
                        </div>

                        {req.inviteEmailError && req.inviteEmailStatus === 'failed' && (
                          <div
                            style={{
                              fontSize: 12,
                              color: '#8b2f2f',
                              lineHeight: 1.6,
                              background: '#fff6f6',
                              border: '1px solid #f0d0d0',
                              borderRadius: 8,
                              padding: '8px 10px',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {req.inviteEmailError}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <Button variant="secondary" onClick={() => req.inviteCode && copyInviteCode(req.inviteCode)}>
                            העתקת קוד
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => processRequest(req.id, 'refresh_email_status')}
                            disabled={isSending || !req.inviteEmailMessageId}
                          >
                            בדיקת סטטוס
                          </Button>
                          <Button
                            onClick={() => processRequest(req.id, 'send_email')}
                            disabled={isSending || !canSendEmail}
                          >
                            {sendLabel}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
