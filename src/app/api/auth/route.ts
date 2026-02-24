import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setSession, clearSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { isAccessAdminCode } from '@/lib/admin-access';
import { isDemoOpenLanding } from '@/lib/demo-mode';

const INVALID_CODE_ERROR = 'Invalid code. Please try again.';
const LOGIN_RATE_LIMIT_MESSAGE = 'Too many login attempts. Please try again in a few minutes.';
const ASSIGNMENT_NOT_AVAILABLE_ERROR = 'Assignment is not available to students yet.';
const TEMP_SERVER_ERROR = 'Temporary server error. Please try again shortly.';

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: INVALID_CODE_ERROR }, { status: 400 });
  }

  const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const action = payload.action;
  const code = payload.code;

  if (action === 'logout') {
    await clearSession();
    return NextResponse.json({ success: true });
  }

  const ip = getClientIp(request);
  const limit = checkRateLimit(`auth:${ip}`, 20, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: LOGIN_RATE_LIMIT_MESSAGE },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfterSeconds) },
      }
    );
  }

  if (typeof code !== 'string') {
    return NextResponse.json({ error: INVALID_CODE_ERROR }, { status: 400 });
  }

  const trimmedCode = code.trim().toUpperCase();
  const codePattern = /^[A-Z0-9]{4,16}$/;
  if (!codePattern.test(trimmedCode)) {
    return NextResponse.json({ error: INVALID_CODE_ERROR }, { status: 400 });
  }

  try {
    // Allow explicit admin access codes to login directly.
    if (isAccessAdminCode(trimmedCode)) {
      await setSession({
        role: 'instructor',
        code: trimmedCode,
      });
      return NextResponse.json({
        success: true,
        role: 'instructor',
        redirect: '/instructor',
      });
    }

    // Check if it's an approved instructor-access code.
    const approvedAccess = await prisma.instructorAccess.findUnique({
      where: { code: trimmedCode },
      select: { code: true, status: true },
    });

    if (approvedAccess && approvedAccess.status === 'active') {
      await prisma.instructorAccess.update({
        where: { code: approvedAccess.code },
        data: { lastLoginAt: new Date() },
      });
      await setSession({
        role: 'instructor',
        code: trimmedCode,
      });
      return NextResponse.json({
        success: true,
        role: 'instructor',
        redirect: '/instructor',
      });
    }

    // Check if it's an existing assignment-level instructor code.
    const assignment = await prisma.assignment.findFirst({
      where: { instructorCode: trimmedCode },
      select: { id: true },
    });

    if (assignment) {
      await setSession({
        role: 'instructor',
        code: trimmedCode,
        assignmentId: assignment.id,
      });
      return NextResponse.json({
        success: true,
        role: 'instructor',
        redirect: '/instructor',
      });
    }

    // Check if it's a student code.
    const text = await prisma.generatedText.findFirst({
      where: { studentCode: trimmedCode },
      select: {
        id: true,
        assignmentId: true,
        assignment: {
          select: { status: true },
        },
      },
    });

    if (text) {
      // Only allow access if assignment is active or later.
      const allowedStatuses = ['active', 'grading', 'closed'];
      if (!allowedStatuses.includes(text.assignment.status) && !isDemoOpenLanding()) {
        return NextResponse.json({ error: ASSIGNMENT_NOT_AVAILABLE_ERROR }, { status: 403 });
      }

      await setSession({
        role: 'student',
        code: trimmedCode,
        assignmentId: text.assignmentId,
        textId: text.id,
      });
      return NextResponse.json({
        success: true,
        role: 'student',
        redirect: `/student/${text.assignmentId}`,
      });
    }

    return NextResponse.json({ error: INVALID_CODE_ERROR }, { status: 401 });
  } catch (error) {
    console.error('Auth query failed', error);
    return NextResponse.json({ error: TEMP_SERVER_ERROR }, { status: 503 });
  }
}
