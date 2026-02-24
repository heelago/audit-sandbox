import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { isAccessAdminCode } from '@/lib/admin-access';
import { sanitizeOptionalTextInput, sanitizeTextInput } from '@/lib/security';
import { checkRateLimit } from '@/lib/rate-limit';
import { queueInstructorOnboardingEmail } from '@/lib/onboarding-email';
import { randomBytes } from 'node:crypto';

const ACCESS_REQUEST_LIMIT_MESSAGE = 'Too many requests. Please try again in a few minutes.';
const ACCESS_REQUEST_VERIFICATION_FAILED_MESSAGE = 'Verification failed. Please try again.';
const AUTO_APPROVED_MESSAGE =
  'נרשמת לבטא בהצלחה. קוד הגישה נשלח עכשיו למייל שהזנת.';
const AUTO_APPROVED_RECENT_MESSAGE =
  'כבר התקבלה הרשמה מהאימייל הזה בדקות האחרונות. אם לא קיבלת קוד, אפשר לנסות שוב בעוד דקה.';
const DEFAULT_MIN_FORM_FILL_MS = 3000;
const DEFAULT_RECAPTCHA_MIN_SCORE = 0.5;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const EMAIL_ERROR_MAX_LEN = 700;

interface RecaptchaSiteVerifyResponse {
  success?: boolean;
  score?: number;
  action?: string;
  ['error-codes']?: string[];
}

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function getMinFillMs(): number {
  const raw = process.env.ACCESS_REQUEST_MIN_FILL_MS?.trim();
  if (!raw) return DEFAULT_MIN_FORM_FILL_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_MIN_FORM_FILL_MS;
  return Math.max(500, Math.round(parsed));
}

function getRecaptchaMinScore(): number {
  const raw = process.env.ACCESS_REQUEST_RECAPTCHA_MIN_SCORE?.trim();
  if (!raw) return DEFAULT_RECAPTCHA_MIN_SCORE;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_RECAPTCHA_MIN_SCORE;
  return Math.max(0, Math.min(1, parsed));
}

function generateSecureAccessCode(length: number): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

async function nextUniqueAccessCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = generateSecureAccessCode(10);
    const [accessHit, assignmentHit, studentHit] = await Promise.all([
      prisma.instructorAccess.findUnique({ where: { code: candidate }, select: { id: true } }),
      prisma.assignment.findFirst({ where: { instructorCode: candidate }, select: { id: true } }),
      prisma.generatedText.findFirst({ where: { studentCode: candidate }, select: { id: true } }),
    ]);
    if (!accessHit && !assignmentHit && !studentHit) {
      return candidate;
    }
  }
  throw new Error('Failed to generate unique access code.');
}

function safeErrorMessage(error: unknown): string {
  const text =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'unknown error';
  return text.slice(0, EMAIL_ERROR_MAX_LEN);
}

async function verifyRecaptchaToken(
  token: string | null,
  ip: string
): Promise<{ enabled: boolean; ok: boolean }> {
  if (isTruthyEnv(process.env.ACCESS_REQUEST_RECAPTCHA_DISABLED)) {
    return { enabled: false, ok: true };
  }

  const secret = process.env.ACCESS_REQUEST_RECAPTCHA_SECRET?.trim();
  if (!secret) {
    return { enabled: false, ok: true };
  }

  if (!token) {
    return { enabled: true, ok: false };
  }

  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('response', token);
  if (ip && ip !== 'unknown') {
    params.set('remoteip', ip);
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      signal: AbortSignal.timeout(4500),
    });

    if (!response.ok) {
      return { enabled: true, ok: false };
    }

    const payload = (await response.json()) as RecaptchaSiteVerifyResponse;
    if (!payload.success) {
      return { enabled: true, ok: false };
    }

    if (payload.action && payload.action !== 'access_request') {
      return { enabled: true, ok: false };
    }

    if (typeof payload.score === 'number' && payload.score < getRecaptchaMinScore()) {
      return { enabled: true, ok: false };
    }

    return { enabled: true, ok: true };
  } catch {
    return { enabled: true, ok: false };
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'instructor' || !isAccessAdminCode(session.code)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get('status')?.trim().toLowerCase();
  const where = status && ['pending', 'approved', 'rejected'].includes(status) ? { status } : {};

  const requests = await prisma.accessRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      fullName: true,
      email: true,
      institution: true,
      role: true,
      message: true,
      status: true,
      reviewedAt: true,
      reviewedByCode: true,
      reviewNotes: true,
      inviteCode: true,
      inviteEmailStatus: true,
      inviteEmailAttemptedAt: true,
      inviteEmailSentAt: true,
      inviteEmailMessageId: true,
      inviteEmailError: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(requests);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const honeypot = sanitizeOptionalTextInput(payload.website, 180);
  const startedAtMs = toFiniteNumber(payload.startedAtMs);
  const captchaToken = sanitizeOptionalTextInput(payload.captchaToken, 2048);

  // Silent acceptance for obvious bots to reduce probing feedback.
  if (honeypot) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const fullNameRaw = sanitizeOptionalTextInput(payload.fullName, 120);
  const emailRaw = sanitizeOptionalTextInput(payload.email, 220);
  const institution = sanitizeOptionalTextInput(payload.institution, 180);
  const role = sanitizeOptionalTextInput(payload.role, 120);
  const message = sanitizeOptionalTextInput(payload.message, 2000);

  if (!fullNameRaw || !emailRaw) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }

  const fullName = sanitizeTextInput(fullNameRaw, 120);
  const email = normalizeEmail(emailRaw);
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
  }

  if (startedAtMs) {
    const elapsed = Date.now() - startedAtMs;
    if (elapsed < getMinFillMs()) {
      // Silent acceptance for likely scripted submissions.
      return NextResponse.json({ success: true }, { status: 200 });
    }
  }

  const ip = getClientIp(request);
  const limit = checkRateLimit(`access-request:${ip}`, 4, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: ACCESS_REQUEST_LIMIT_MESSAGE },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfterSeconds) },
      }
    );
  }
  const emailLimit = checkRateLimit(`access-request-email:${email}`, 6, 60 * 60 * 1000);
  if (!emailLimit.allowed) {
    return NextResponse.json(
      { error: ACCESS_REQUEST_LIMIT_MESSAGE },
      {
        status: 429,
        headers: { 'Retry-After': String(emailLimit.retryAfterSeconds) },
      }
    );
  }

  const captcha = await verifyRecaptchaToken(captchaToken, ip);
  if (!captcha.ok) {
    return NextResponse.json({ error: ACCESS_REQUEST_VERIFICATION_FAILED_MESSAGE }, { status: 400 });
  }

  const recentRequest = await prisma.accessRequest.findFirst({
    where: {
      email,
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true },
  });

  if (recentRequest) {
    const diffMs = Date.now() - recentRequest.createdAt.getTime();
    if (diffMs < 60 * 1000) {
      return NextResponse.json(
        { success: true, autoApproved: true, message: AUTO_APPROVED_RECENT_MESSAGE },
        { status: 200 }
      );
    }
  }

  const now = new Date();
  const autoReviewNote =
    'Auto-approved during open beta. Invite code issued immediately.';
  const existingActiveAccess = await prisma.instructorAccess.findFirst({
    where: { email, status: 'active' },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, code: true },
  });

  const inviteCode = existingActiveAccess?.code ?? (await nextUniqueAccessCode());

  const created = await prisma.$transaction(async (tx) => {
    const requestRow = await tx.accessRequest.create({
      data: {
        fullName,
        email,
        institution,
        role,
        message,
        status: 'approved',
        reviewedAt: now,
        reviewedByCode: 'AUTO_BETA',
        reviewNotes: autoReviewNote,
        inviteCode,
        inviteEmailStatus: 'not_sent',
      },
      select: { id: true, createdAt: true },
    });

    if (existingActiveAccess) {
      await tx.instructorAccess.update({
        where: { code: existingActiveAccess.code },
        data: {
          fullName,
          institution,
          sourceRequestId: requestRow.id,
        },
      });
    } else {
      await tx.instructorAccess.create({
        data: {
          code: inviteCode,
          fullName,
          email,
          institution,
          status: 'active',
          createdByCode: 'AUTO_BETA',
          sourceRequestId: requestRow.id,
        },
      });
    }

    return requestRow;
  });

  let inviteEmailStatus: 'queued' | 'failed' = 'queued';
  let inviteEmailAttemptedAt: Date | null = null;
  let inviteEmailMessageId: string | null = null;
  let inviteEmailError: string | null = null;

  try {
    const attemptedAt = new Date();
    inviteEmailAttemptedAt = attemptedAt;
    const queued = await queueInstructorOnboardingEmail({
      fullName,
      email,
      inviteCode,
      institution,
    });
    inviteEmailMessageId = queued.queuedId;

    await prisma.accessRequest.update({
      where: { id: created.id },
      data: {
        inviteEmailStatus: 'queued',
        inviteEmailAttemptedAt: attemptedAt,
        inviteEmailSentAt: null,
        inviteEmailMessageId: queued.queuedId,
        inviteEmailError: null,
      },
    });
  } catch (error) {
    inviteEmailStatus = 'failed';
    inviteEmailError = safeErrorMessage(error);
    inviteEmailAttemptedAt = new Date();
    await prisma.accessRequest.update({
      where: { id: created.id },
      data: {
        inviteEmailStatus: 'failed',
        inviteEmailAttemptedAt,
        inviteEmailSentAt: null,
        inviteEmailMessageId: null,
        inviteEmailError,
      },
    });
  }

  return NextResponse.json(
    {
      success: true,
      autoApproved: true,
      id: created.id,
      createdAt: created.createdAt,
      message: AUTO_APPROVED_MESSAGE,
      email: {
        state: inviteEmailStatus,
        attemptedAt: inviteEmailAttemptedAt,
        queuedId: inviteEmailMessageId,
        error: inviteEmailError,
      },
    },
    { status: 201 }
  );
}
