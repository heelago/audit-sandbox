'use client';

import { useState } from 'react';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import styles from '@/app/page.module.css';

export function AccessRequestForm() {
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [requestStartedAtMs, setRequestStartedAtMs] = useState(() => Date.now());
  const [requestForm, setRequestForm] = useState({
    fullName: '',
    email: '',
    institution: '',
    role: '',
    message: '',
    website: '',
  });

  const { captchaSiteKey, getToken } = useRecaptcha();

  const submitAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestStatus(null);
    setRequestLoading(true);
    try {
      const captchaToken = captchaSiteKey ? await getToken() : null;

      const res = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: requestForm.fullName.trim(),
          email: requestForm.email.trim(),
          institution: requestForm.institution.trim() || undefined,
          role: requestForm.role.trim() || undefined,
          message: requestForm.message.trim() || undefined,
          website: requestForm.website,
          startedAtMs: requestStartedAtMs,
          captchaToken: captchaToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRequestStatus({
          type: 'error',
          text: data.error || 'שליחת הבקשה נכשלה. נסו שוב בעוד כמה דקות.',
        });
        return;
      }
      setRequestStatus({
        type: 'success',
        text: 'הבקשה נשלחה בהצלחה. לאחר אישור תקבלו קוד גישה אישי.',
      });
      setRequestForm({
        fullName: '',
        email: '',
        institution: '',
        role: '',
        message: '',
        website: '',
      });
      setRequestStartedAtMs(Date.now());
    } catch {
      setRequestStatus({
        type: 'error',
        text: 'שליחת הבקשה נכשלה. בדקו את החיבור ונסו שוב.',
      });
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className={styles.accessCard} id="request-access">
      <p className={styles.accessTitle}>בקשת גישה למרצים</p>
      <p className={styles.accessSubtitle}>
        מרצים שרוצים להתנסות במערכת יכולים להשאיר פרטים. לאחר אישור תקבלו קוד גישה אישי.
      </p>
      <form className={styles.accessForm} onSubmit={submitAccessRequest}>
        <div className={styles.accessHoneypotField} aria-hidden="true">
          <label htmlFor="access-website">Website</label>
          <input
            id="access-website"
            className={styles.accessInput}
            type="text"
            autoComplete="url"
            tabIndex={-1}
            value={requestForm.website}
            onChange={(e) => setRequestForm((prev) => ({ ...prev, website: e.target.value }))}
          />
        </div>
        <div className={styles.accessGrid}>
          <input
            className={styles.accessInput}
            type="text"
            placeholder="שם מלא"
            value={requestForm.fullName}
            onChange={(e) => setRequestForm((prev) => ({ ...prev, fullName: e.target.value }))}
            required
          />
          <input
            className={styles.accessInput}
            type="email"
            placeholder="אימייל"
            value={requestForm.email}
            onChange={(e) => setRequestForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            className={styles.accessInput}
            type="text"
            placeholder="מוסד / פקולטה (אופציונלי)"
            value={requestForm.institution}
            onChange={(e) => setRequestForm((prev) => ({ ...prev, institution: e.target.value }))}
          />
          <input
            className={styles.accessInput}
            type="text"
            placeholder="תפקיד (אופציונלי)"
            value={requestForm.role}
            onChange={(e) => setRequestForm((prev) => ({ ...prev, role: e.target.value }))}
          />
          <textarea
            className={styles.accessTextarea}
            placeholder="מה תרצו לבדוק בדמו? (אופציונלי)"
            value={requestForm.message}
            onChange={(e) => setRequestForm((prev) => ({ ...prev, message: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          className={styles.accessSubmit}
          disabled={requestLoading || !requestForm.fullName.trim() || !requestForm.email.trim()}
        >
          {requestLoading ? 'שולח...' : 'שליחת בקשת גישה'}
        </button>
        {requestStatus && (
          <p className={requestStatus.type === 'success' ? styles.accessStatusSuccess : styles.accessStatusError}>
            {requestStatus.text}
          </p>
        )}
      </form>
    </div>
  );
}
