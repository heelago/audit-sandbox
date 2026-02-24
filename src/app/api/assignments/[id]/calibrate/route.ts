import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { instructorOwnsAssignment } from '@/lib/access-control';
import { demoWriteBlockedResponse, isDemoReadOnly } from '@/lib/demo-mode';
import { sanitizeTextInput } from '@/lib/security';

const CALIBRATION_ACTIONS = new Set(['confirm', 'dismiss', 'flag_new']);
const ALLOWED_SEVERITIES = new Set(['critical', 'moderate', 'minor']);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (isDemoReadOnly()) {
    return demoWriteBlockedResponse();
  }

  const { id } = await params;
  const ownsAssignment = await instructorOwnsAssignment(id, session.code);
  if (!ownsAssignment) {
    return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const action = payload.action;
  if (typeof action !== 'string' || !CALIBRATION_ACTIONS.has(action)) {
    return NextResponse.json({ error: 'Invalid calibration action' }, { status: 400 });
  }

  let rubricItemIdForLog: string | null = null;

  if (action === 'confirm' || action === 'dismiss') {
    const rubricItemId = payload.rubricItemId;
    if (typeof rubricItemId !== 'string' || !rubricItemId) {
      return NextResponse.json({ error: 'rubricItemId is required' }, { status: 400 });
    }

    const rubricItem = await prisma.rubricItem.findFirst({
      where: {
        id: rubricItemId,
        text: {
          assignmentId: id,
        },
      },
      select: { id: true },
    });
    if (!rubricItem) {
      return NextResponse.json({ error: 'Rubric item not found' }, { status: 404 });
    }

    await prisma.rubricItem.update({
      where: { id: rubricItemId },
      data: { confirmed: action === 'confirm' },
    });
    rubricItemIdForLog = rubricItemId;
  }

  if (action === 'flag_new') {
    const textId = payload.textId;
    const description = payload.description;
    const severity = payload.severity;
    const category = payload.category;
    const locationStart = payload.locationStart;
    const locationEnd = payload.locationEnd;
    const flaggedText = payload.flaggedText;

    if (typeof textId !== 'string' || !textId) {
      return NextResponse.json({ error: 'textId is required' }, { status: 400 });
    }
    if (typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 });
    }
    const safeDescription = sanitizeTextInput(description, 1200);
    if (!safeDescription) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 });
    }

    const text = await prisma.generatedText.findFirst({
      where: {
        id: textId,
        assignmentId: id,
      },
      select: {
        id: true,
        textContent: true,
      },
    });
    if (!text) {
      return NextResponse.json({ error: 'Text not found for this assignment' }, { status: 404 });
    }

    const parsedSeverity =
      typeof severity === 'string' && ALLOWED_SEVERITIES.has(severity)
        ? severity
        : 'moderate';

    const textLength = text.textContent.length;
    const parsedLocationStart =
      typeof locationStart === 'number' && Number.isInteger(locationStart) && locationStart >= 0
        ? Math.min(locationStart, Math.max(0, textLength - 1))
        : 0;

    const defaultEnd =
      textLength > parsedLocationStart
        ? Math.min(textLength, parsedLocationStart + 120)
        : parsedLocationStart;

    const parsedLocationEnd =
      typeof locationEnd === 'number' &&
      Number.isInteger(locationEnd) &&
      locationEnd >= parsedLocationStart
        ? Math.min(locationEnd, textLength)
        : defaultEnd;

    const parsedFlaggedText =
      typeof flaggedText === 'string' && flaggedText.trim()
        ? sanitizeTextInput(flaggedText, 500)
        : text.textContent.slice(parsedLocationStart, parsedLocationEnd).trim() || null;

    await prisma.rubricItem.create({
      data: {
        textId,
        passSource: 'professor',
        severity: parsedSeverity,
        category:
          typeof category === 'string' && category.trim()
            ? sanitizeTextInput(category, 80).replace(/\s+/g, '_')
            : 'professor_finding',
        locationStart: parsedLocationStart,
        locationEnd: parsedLocationEnd,
        description: safeDescription,
        flaggedText: parsedFlaggedText,
        confirmed: true,
      },
    });
  }

  await prisma.calibrationLog.create({
    data: {
      assignmentId: id,
      action,
      rubricItemId: rubricItemIdForLog,
      notes: typeof payload.notes === 'string' && payload.notes.trim() ? payload.notes.trim() : null,
    },
  });

  return NextResponse.json({ success: true });
}
