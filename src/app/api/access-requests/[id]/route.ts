import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { isAccessAdminCode } from '@/lib/admin-access';
import {
  getInstructorOnboardingEmailDeliveryStatus,
  queueInstructorOnboardingEmail,
} from '@/lib/onboarding-email';
import { sanitizeOptionalTextInput } from '@/lib/security';
import { randomBytes } from 'node:crypto';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const EMAIL_ERROR_MAX_LEN = 700;

function generateSecureAccessCode(length: number): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'instructor' || !isAccessAdminCode(session.code)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const action = typeof payload.action === 'string' ? payload.action.trim().toLowerCase() : '';
  const reviewNotes = sanitizeOptionalTextInput(payload.reviewNotes, 600);

  if (
    action !== 'approve' &&
    action !== 'reject' &&
    action !== 'send_email' &&
    action !== 'refresh_email_status'
  ) {
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  }

  const target = await prisma.accessRequest.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      institution: true,
      status: true,
      inviteCode: true,
      inviteEmailStatus: true,
      inviteEmailAttemptedAt: true,
      inviteEmailSentAt: true,
      inviteEmailMessageId: true,
      inviteEmailError: true,
    },
  });
  if (!target) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (action === 'reject') {
    const updated = await prisma.accessRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedByCode: session.code,
        reviewNotes,
      },
      select: {
        id: true,
        status: true,
        reviewedAt: true,
        reviewedByCode: true,
        reviewNotes: true,
      },
    });
    return NextResponse.json({ success: true, request: updated });
  }

  if (action === 'send_email') {
    if (target.status !== 'approved' || !target.inviteCode) {
      return NextResponse.json(
        { error: 'Request must be approved before sending onboarding email.' },
        { status: 409 }
      );
    }

    const attemptedAt = new Date();
    try {
      const queued = await queueInstructorOnboardingEmail({
        fullName: target.fullName,
        email: target.email,
        inviteCode: target.inviteCode,
        institution: target.institution,
      });

      const updated = await prisma.accessRequest.update({
        where: { id: target.id },
        data: {
          inviteEmailStatus: 'queued',
          inviteEmailAttemptedAt: attemptedAt,
          inviteEmailSentAt: null,
          inviteEmailMessageId: queued.queuedId,
          inviteEmailError: null,
        },
        select: {
          id: true,
          status: true,
          inviteCode: true,
          inviteEmailStatus: true,
          inviteEmailAttemptedAt: true,
          inviteEmailSentAt: true,
          inviteEmailMessageId: true,
          inviteEmailError: true,
        },
      });

      return NextResponse.json({
        success: true,
        request: updated,
        email: {
          queuedId: queued.queuedId,
          collection: queued.collection,
        },
      });
    } catch (error) {
      const message = safeErrorMessage(error);
      await prisma.accessRequest.update({
        where: { id: target.id },
        data: {
          inviteEmailStatus: 'failed',
          inviteEmailAttemptedAt: attemptedAt,
          inviteEmailError: message,
        },
      });
      return NextResponse.json(
        {
          error: 'Failed to send onboarding email.',
          details: message,
        },
        { status: 502 }
      );
    }
  }

  if (action === 'refresh_email_status') {
    if (target.status !== 'approved') {
      return NextResponse.json(
        { error: 'Request must be approved before checking email status.' },
        { status: 409 }
      );
    }
    if (!target.inviteEmailMessageId) {
      return NextResponse.json(
        { error: 'No queued email message id found for this request.' },
        { status: 409 }
      );
    }

    try {
      const status = await getInstructorOnboardingEmailDeliveryStatus(target.inviteEmailMessageId);
      const now = new Date();
      const nextInviteEmailStatus =
        status.state === 'sent' ? 'sent' : status.state === 'failed' ? 'failed' : 'queued';

      const updated = await prisma.accessRequest.update({
        where: { id: target.id },
        data: {
          inviteEmailStatus: nextInviteEmailStatus,
          inviteEmailSentAt: status.state === 'sent' ? now : null,
          inviteEmailError:
            status.state === 'failed'
              ? safeErrorMessage(status.error ?? 'Email delivery failed.')
              : null,
          inviteEmailAttemptedAt: target.inviteEmailAttemptedAt ?? now,
        },
        select: {
          id: true,
          status: true,
          inviteCode: true,
          inviteEmailStatus: true,
          inviteEmailAttemptedAt: true,
          inviteEmailSentAt: true,
          inviteEmailMessageId: true,
          inviteEmailError: true,
        },
      });

      return NextResponse.json({
        success: true,
        request: updated,
        email: {
          state: status.state,
          rawState: status.rawState,
          error: status.error,
        },
      });
    } catch (error) {
      const message = safeErrorMessage(error);
      return NextResponse.json(
        {
          error: 'Failed to check onboarding email status.',
          details: message,
        },
        { status: 502 }
      );
    }
  }

  // Approve flow.
  if (
    target.status === 'approved' &&
    target.inviteCode &&
    target.inviteEmailStatus === 'sent'
  ) {
    return NextResponse.json({
      success: true,
      inviteCode: target.inviteCode,
      alreadyApproved: true,
      request: {
        id: target.id,
        status: 'approved',
        inviteCode: target.inviteCode,
        inviteEmailStatus: target.inviteEmailStatus,
        inviteEmailAttemptedAt: target.inviteEmailAttemptedAt,
        inviteEmailSentAt: target.inviteEmailSentAt,
        inviteEmailMessageId: target.inviteEmailMessageId,
        inviteEmailError: target.inviteEmailError,
        reviewedByCode: session.code,
      },
      email: {
        state: 'sent',
        skipped: true,
      },
    });
  }

  const existingAccess =
    target.inviteCode
      ? await prisma.instructorAccess.findUnique({
          where: { code: target.inviteCode },
          select: { code: true, status: true },
        })
      : null;

  const inviteCode =
    existingAccess?.code ??
    (await nextUniqueAccessCode());

  await prisma.$transaction(async (tx) => {
    if (!existingAccess) {
      await tx.instructorAccess.create({
        data: {
          code: inviteCode,
          fullName: target.fullName,
          email: target.email,
          institution: target.institution,
          status: 'active',
          createdByCode: session.code,
          sourceRequestId: target.id,
        },
      });
    } else if (existingAccess.status !== 'active') {
      await tx.instructorAccess.update({
        where: { code: existingAccess.code },
        data: {
          status: 'active',
          fullName: target.fullName,
          email: target.email,
          institution: target.institution,
          createdByCode: session.code,
          sourceRequestId: target.id,
        },
      });
    }

    await tx.accessRequest.update({
      where: { id: target.id },
      data: {
        status: 'approved',
        inviteCode,
        inviteEmailStatus: 'not_sent',
        inviteEmailAttemptedAt: null,
        inviteEmailSentAt: null,
        inviteEmailMessageId: null,
        inviteEmailError: null,
        reviewedAt: new Date(),
        reviewedByCode: session.code,
        reviewNotes,
      },
    });
  });

  const attemptedAt = new Date();
  let emailState: 'queued' | 'failed' = 'queued';
  let emailQueuedId: string | null = null;
  let emailError: string | null = null;
  try {
    const queued = await queueInstructorOnboardingEmail({
      fullName: target.fullName,
      email: target.email,
      inviteCode,
      institution: target.institution,
    });
    emailQueuedId = queued.queuedId;

    await prisma.accessRequest.update({
      where: { id: target.id },
      data: {
        inviteEmailStatus: 'queued',
        inviteEmailAttemptedAt: attemptedAt,
        inviteEmailSentAt: null,
        inviteEmailMessageId: queued.queuedId,
        inviteEmailError: null,
      },
    });
  } catch (error) {
    emailState = 'failed';
    emailError = safeErrorMessage(error);
    await prisma.accessRequest.update({
      where: { id: target.id },
      data: {
        inviteEmailStatus: 'failed',
        inviteEmailAttemptedAt: attemptedAt,
        inviteEmailSentAt: null,
        inviteEmailMessageId: null,
        inviteEmailError: emailError,
      },
    });
  }

  return NextResponse.json({
    success: true,
    inviteCode,
    request: {
      id: target.id,
      status: 'approved',
      inviteCode,
      inviteEmailStatus: emailState,
      inviteEmailAttemptedAt: attemptedAt,
      inviteEmailSentAt: null,
      inviteEmailMessageId: emailQueuedId,
      inviteEmailError: emailError,
      reviewedByCode: session.code,
    },
    email: {
      state: emailState,
      queuedId: emailQueuedId,
      error: emailError,
    },
  });
}
