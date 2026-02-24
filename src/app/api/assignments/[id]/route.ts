import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { instructorOwnsAssignment } from '@/lib/access-control';
import { demoWriteBlockedResponse, isDemoReadOnly } from '@/lib/demo-mode';
import { parsePlannedStudentCodes } from '@/lib/assignment-roster';
import { buildStudentVisiblePrompt, sanitizeOptionalTextInput, sanitizeTextInput } from '@/lib/security';

const ASSIGNMENT_STATUSES = new Set([
  'draft',
  'generating',
  'analyzing',
  'calibrating',
  'active',
  'grading',
  'closed',
]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (session.role === 'instructor') {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id,
        instructorCode: session.code,
      },
      select: {
        id: true,
        title: true,
        promptText: true,
        courseContext: true,
        requirements: true,
        knownPitfalls: true,
        referenceMaterial: true,
        sectionBlueprint: true,
        evaluationCriteria: true,
        exemplarNotes: true,
        generationStrategy: true,
        plannedStudentCount: true,
        plannedStudentCodes: true,
        modelVersion: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        texts: {
          include: {
            rubricItems: true,
            annotations: { include: { evidence: true } },
            score: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const plannedCodes = parsePlannedStudentCodes(assignment.plannedStudentCodes);
    const plannedCount = Math.max(
      assignment.plannedStudentCount ?? 0,
      plannedCodes.length,
      assignment.texts.length
    );
    return NextResponse.json({
      ...assignment,
      plannedStudentCodes: plannedCodes,
      plannedStudentCount: plannedCount,
    });
  }

  if (session.assignmentId !== id || !session.textId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      requirements: true,
      status: true,
      plannedStudentCount: true,
      texts: {
        where: { id: session.textId },
        select: {
          id: true,
          textContent: true,
          wordCount: true,
          status: true,
          annotations: {
            include: { evidence: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (assignment.texts.length === 0) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  return NextResponse.json({
    id: assignment.id,
    title: assignment.title,
    status: assignment.status,
    plannedStudentCount: assignment.plannedStudentCount,
    // Students get only public-facing instructions, never the internal generation prompt.
    promptText: buildStudentVisiblePrompt({
      title: assignment.title,
      requirements: assignment.requirements,
    }),
    sectionBlueprint: null,
    texts: assignment.texts,
  });
}

export async function PATCH(
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
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const data: Record<string, string | null> = {};
  const allowedStrategies = new Set(['natural', 'balanced_errors', 'strict_truth']);

  const title = sanitizeOptionalTextInput(payload.title, 180);
  if (title) {
    data.title = title;
  }
  const promptText = sanitizeOptionalTextInput(payload.promptText, 6000);
  if (promptText) {
    data.promptText = promptText;
  }
  if (typeof payload.courseContext === 'string') {
    data.courseContext = sanitizeTextInput(payload.courseContext, 1600) || null;
  }
  if (typeof payload.requirements === 'string') {
    data.requirements = sanitizeTextInput(payload.requirements, 3200) || null;
  }
  if (typeof payload.knownPitfalls === 'string') {
    data.knownPitfalls = sanitizeTextInput(payload.knownPitfalls, 3200) || null;
  }
  if (typeof payload.referenceMaterial === 'string') {
    data.referenceMaterial = sanitizeTextInput(payload.referenceMaterial, 8000) || null;
  }
  if (typeof payload.sectionBlueprint === 'string') {
    data.sectionBlueprint = sanitizeTextInput(payload.sectionBlueprint, 5000) || null;
  }
  if (typeof payload.evaluationCriteria === 'string') {
    data.evaluationCriteria = sanitizeTextInput(payload.evaluationCriteria, 6000) || null;
  }
  if (typeof payload.exemplarNotes === 'string') {
    data.exemplarNotes = sanitizeTextInput(payload.exemplarNotes, 6000) || null;
  }
  if (typeof payload.generationStrategy === 'string') {
    const normalized = payload.generationStrategy.trim().toLowerCase();
    if (allowedStrategies.has(normalized)) {
      data.generationStrategy = normalized;
    }
  }
  if (typeof payload.status === 'string' && ASSIGNMENT_STATUSES.has(payload.status)) {
    data.status = payload.status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const assignment = await prisma.assignment.update({
    where: { id },
    data,
    select: {
      id: true,
      title: true,
      promptText: true,
      courseContext: true,
      requirements: true,
      knownPitfalls: true,
      referenceMaterial: true,
      sectionBlueprint: true,
      evaluationCriteria: true,
      exemplarNotes: true,
      generationStrategy: true,
      plannedStudentCount: true,
      plannedStudentCodes: true,
      modelVersion: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const plannedCodes = parsePlannedStudentCodes(assignment.plannedStudentCodes);
  const plannedCount = Math.max(
    assignment.plannedStudentCount ?? 0,
    plannedCodes.length,
    0
  );
  return NextResponse.json({
    ...assignment,
    plannedStudentCodes: plannedCodes,
    plannedStudentCount: plannedCount,
  });
}
