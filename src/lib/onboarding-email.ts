import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';
import { getBetaAssignmentLimit } from '@/lib/beta-config';

export interface InstructorOnboardingEmailInput {
  fullName: string;
  email: string;
  inviteCode: string;
  institution?: string | null;
}

export interface InstructorOnboardingQueueResult {
  queuedId: string;
  collection: string;
}

export interface InstructorOnboardingDeliveryStatus {
  state: 'queued' | 'sent' | 'failed' | 'unknown';
  rawState: string | null;
  error: string | null;
}

const DEFAULT_COLLECTION = 'mail';

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDeliveryStatus(payload: unknown): InstructorOnboardingDeliveryStatus {
  const root = asObject(payload);
  const delivery = asObject(root?.delivery);
  const rawState =
    toNonEmptyString(delivery?.state) ??
    toNonEmptyString(delivery?.status) ??
    null;
  const normalized = rawState?.toUpperCase() ?? null;

  const errorValue = delivery?.error;
  const errorMessage =
    toNonEmptyString(errorValue) ??
    toNonEmptyString(asObject(errorValue)?.message) ??
    toNonEmptyString(root?.error) ??
    null;

  if (!normalized) {
    return {
      state: 'queued',
      rawState: null,
      error: errorMessage,
    };
  }
  if (
    normalized.includes('SUCCESS') ||
    normalized.includes('SENT') ||
    normalized.includes('DELIVERED')
  ) {
    return {
      state: 'sent',
      rawState: rawState ?? normalized,
      error: null,
    };
  }
  if (normalized.includes('ERROR') || normalized.includes('FAIL')) {
    return {
      state: 'failed',
      rawState: rawState ?? normalized,
      error: errorMessage ?? 'Unknown email delivery failure.',
    };
  }

  return {
    state: 'queued',
    rawState: rawState ?? normalized,
    error: errorMessage,
  };
}

function buildOnboardingText(input: InstructorOnboardingEmailInput): { subject: string; text: string; html: string } {
  const loginUrl =
    process.env.PUBLIC_APP_URL?.trim() || 'https://auditsandbox--h2eapps-unified.us-central1.hosted.app/';
  const betaAssignmentLimit = getBetaAssignmentLimit();
  const institutionLine = input.institution ? `מוסד: ${input.institution}\n` : '';
  const subject = 'קוד גישה לבטא של H2eApps';
  const text =
    `שלום ${input.fullName},\n\n` +
    `נרשמת בהצלחה לבטא של סביבת הביקורת.\n` +
    `${institutionLine}` +
    `קוד הגישה האישי שלך: ${input.inviteCode}\n\n` +
    `בשלב הבטא אפשר ליצור עד ${betaAssignmentLimit} מטלות דוגמה.\n` +
    `נשמח לפידבק על UX, לוגיקה ופיצ'רים שחסרים לתחום שלך.\n` +
    `לגרסה יציבה ולשימוש עם סטודנטים: contact@h2eapps.com\n\n` +
    `כניסה למערכת:\n${loginUrl}\n\n` +
    `יש להזין את הקוד במסך הכניסה.\n` +
    `אם לא ביקשת גישה, אפשר להתעלם מההודעה.\n\n` +
    `בהצלחה,\n` +
    `H2eApps`;

  const html =
    `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7;color:#1f2937">` +
    `<p>שלום ${escapeHtml(input.fullName)},</p>` +
    `<p>נרשמת בהצלחה לבטא של סביבת הביקורת.</p>` +
    (input.institution ? `<p><strong>מוסד:</strong> ${escapeHtml(input.institution)}</p>` : '') +
    `<p><strong>קוד הגישה האישי שלך:</strong> <span style="font-size:18px;letter-spacing:1px">${escapeHtml(input.inviteCode)}</span></p>` +
    `<p>בשלב הבטא אפשר ליצור עד <strong>${betaAssignmentLimit} מטלות דוגמה</strong>.</p>` +
    `<p>נשמח לפידבק על UX, לוגיקה ופיצ׳רים שחסרים לתחום שלך.</p>` +
    `<p>לגרסה יציבה ולשימוש עם סטודנטים: <a href="mailto:contact@h2eapps.com">contact@h2eapps.com</a></p>` +
    `<p><strong>כניסה למערכת:</strong><br/><a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></p>` +
    `<p>יש להזין את הקוד במסך הכניסה.</p>` +
    `<p style="margin-top:18px">בהצלחה,<br/>H2eApps</p>` +
    `</div>`;

  return { subject, text, html };
}

function parseAlertRecipients(): string[] {
  const raw = process.env.ACCESS_REQUEST_ALERT_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 3 && item.includes('@'));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function queueInstructorOnboardingEmail(
  input: InstructorOnboardingEmailInput
): Promise<InstructorOnboardingQueueResult> {
  const collection = process.env.FIREBASE_EMAIL_COLLECTION?.trim() || DEFAULT_COLLECTION;
  const firestore = getFirebaseAdminFirestore();
  const message = buildOnboardingText(input);

  const doc = await firestore.collection(collection).add({
    to: [input.email],
    message: {
      subject: message.subject,
      text: message.text,
      html: message.html,
    },
    metadata: {
      type: 'instructor-onboarding',
      inviteCode: input.inviteCode,
      institution: input.institution ?? null,
    },
    createdAt: new Date().toISOString(),
  });

  return {
    queuedId: doc.id,
    collection,
  };
}

export interface AccessRequestAlertInput {
  fullName: string;
  email: string;
  institution?: string | null;
  role?: string | null;
  message?: string | null;
  requestId: string;
  createdAtIso: string;
}

export async function queueAccessRequestAlertEmail(input: AccessRequestAlertInput): Promise<{
  queued: boolean;
  queuedId: string | null;
  reason: string | null;
}> {
  const to = parseAlertRecipients();
  if (to.length === 0) {
    return {
      queued: false,
      queuedId: null,
      reason: 'ACCESS_REQUEST_ALERT_EMAILS is not configured.',
    };
  }

  const collection = process.env.FIREBASE_EMAIL_COLLECTION?.trim() || DEFAULT_COLLECTION;
  const firestore = getFirebaseAdminFirestore();
  const appUrl = process.env.PUBLIC_APP_URL?.trim() || 'https://auditsandbox--h2eapps-unified.us-central1.hosted.app/';
  const subject = 'New instructor access request';
  const text = [
    'A new instructor access request was submitted.',
    '',
    `Name: ${input.fullName}`,
    `Email: ${input.email}`,
    `Institution: ${input.institution ?? '-'}`,
    `Role: ${input.role ?? '-'}`,
    `Message: ${input.message ?? '-'}`,
    `Request ID: ${input.requestId}`,
    `Created At: ${input.createdAtIso}`,
    '',
    `Review in dashboard: ${appUrl}`,
  ].join('\n');

  const html =
    `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">` +
    `<p><strong>New instructor access request</strong></p>` +
    `<p>Name: ${escapeHtml(input.fullName)}<br/>` +
    `Email: ${escapeHtml(input.email)}<br/>` +
    `Institution: ${escapeHtml(input.institution ?? '-')}<br/>` +
    `Role: ${escapeHtml(input.role ?? '-')}<br/>` +
    `Request ID: ${escapeHtml(input.requestId)}<br/>` +
    `Created At: ${escapeHtml(input.createdAtIso)}</p>` +
    `<p>Message:<br/>${escapeHtml(input.message ?? '-')}</p>` +
    `<p><a href="${escapeHtml(appUrl)}">Open dashboard</a></p>` +
    `</div>`;

  const doc = await firestore.collection(collection).add({
    to,
    message: {
      subject,
      text,
      html,
    },
    metadata: {
      type: 'access-request-alert',
      requestId: input.requestId,
    },
    createdAt: new Date().toISOString(),
  });

  return {
    queued: true,
    queuedId: doc.id,
    reason: null,
  };
}

export async function getInstructorOnboardingEmailDeliveryStatus(
  messageId: string
): Promise<InstructorOnboardingDeliveryStatus> {
  const collection = process.env.FIREBASE_EMAIL_COLLECTION?.trim() || DEFAULT_COLLECTION;
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(collection).doc(messageId).get();
  if (!snapshot.exists) {
    return {
      state: 'unknown',
      rawState: null,
      error: 'Queued email document not found.',
    };
  }
  return parseDeliveryStatus(snapshot.data());
}

