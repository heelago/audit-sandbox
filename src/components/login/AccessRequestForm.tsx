'use client';

import { useState } from 'react';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import styles from '@/app/page.module.css';

type AccessRequestResponse = {
  success?: boolean;
  message?: string;
  email?: {
    state?: 'queued' | 'failed';
  };
  error?: string;
};

const FALLBACK_ERROR_MESSAGE = 'שליחת ההרשמה נכשלה. נסו שוב בעוד כמה דקות.';
const NETWORK_ERROR_MESSAGE = 'שליחת ההרשמה נכשלה. בדקו את החיבור ונסו שוב.';
const SUCCESS_MESSAGE =
  'נרשמת לבטא בהצלחה. קוד הגישה נשלח עכשיו למייל שהזנת.';
const EMAIL_FAILED_MESSAGE =
  'ההרשמה נקלטה, אבל שליחת הקוד למייל נכשלה. נסו שוב בעוד דקה או כתבו ל-contact@h2eapps.com.';

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
      const data = (await res.json()) as AccessRequestResponse;
      if (!res.ok) {
        setRequestStatus({
          type: 'error',
          text: data.error || FALLBACK_ERROR_MESSAGE,
        });
        return;
      }

      const successText =
        data.email?.state === 'failed'
          ? EMAIL_FAILED_MESSAGE
          : data.message || SUCCESS_MESSAGE;
      setRequestStatus({
        type: 'success',
        text: successText,
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
        text: NETWORK_ERROR_MESSAGE,
      });
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className={styles.accessCard} id="request-access">
      <p className={styles.accessTitle}>הרשמה מהירה לבטא למרצים</p>
      <p className={styles.accessSubtitle}>
        ההרשמה אוטומטית: קוד גישה נשלח מיד למייל. בשלב הבטא אפשר ליצור עד 5 מטלות דוגמה.
        נשמח לפידבק על UX, לוגיקה ופיצ׳רים שחשובים לתחום שלך. לגרסה יציבה לכיתה:
        {' '}
        <strong>contact@h2eapps.com</strong>
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
            placeholder="מה תרצה/י לבדוק בבטא? (אופציונלי)"
            value={requestForm.message}
            onChange={(e) => setRequestForm((prev) => ({ ...prev, message: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          className={styles.accessSubmit}
          disabled={requestLoading || !requestForm.fullName.trim() || !requestForm.email.trim()}
        >
          {requestLoading ? 'שולח...' : 'קבלת קוד בטא למייל'}
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
