import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { isAccessAdminCode } from '@/lib/admin-access';
import { generateCode } from '@/lib/utils';
import { demoWriteBlockedResponse, isDemoReadOnly } from '@/lib/demo-mode';
import { getGeminiGenerationModel } from '@/lib/ai/gemini';
import {
  parsePlannedStudentCodes,
  serializePlannedStudentCodes,
} from '@/lib/assignment-roster';
import { sanitizeOptionalTextInput } from '@/lib/security';
import { getBetaAssignmentLimit } from '@/lib/beta-config';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const assignments = await prisma.assignment.findMany({
    where: { instructorCode: session.code },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
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
      texts: {
        select: {
          id: true,
          studentCode: true,
          studentName: true,
          status: true,
          wordCount: true,
        },
      },
      _count: {
        select: { texts: true },
      },
    },
  });

  return NextResponse.json(
    assignments.map((assignment) => {
      const plannedCodes = parsePlannedStudentCodes(assignment.plannedStudentCodes);
      const plannedCount = Math.max(
        assignment.plannedStudentCount ?? 0,
        plannedCodes.length,
        assignment._count.texts
      );
      return {
        ...assignment,
        plannedStudentCodes: plannedCodes,
        plannedStudentCount: plannedCount,
      };
    })
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (isDemoReadOnly()) {
    return demoWriteBlockedResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const {
    title,
    promptText,
    courseContext,
    requirements,
    knownPitfalls,
    referenceMaterial,
    sectionBlueprint,
    evaluationCriteria,
    exemplarNotes,
    generationStrategy,
    studentCount = 3,
  } = payload;

  const safeTitle = sanitizeOptionalTextInput(title, 180);
  const safePromptText = sanitizeOptionalTextInput(promptText, 6000);
  if (!safeTitle || !safePromptText) {
    return NextResponse.json(
      { error: 'Title and prompt are required' },
      { status: 400 }
    );
  }

  const parsedStudentCount = Number(studentCount);
  if (!Number.isInteger(parsedStudentCount) || parsedStudentCount < 1 || parsedStudentCount > 50) {
    return NextResponse.json({ error: 'Student count must be between 1 and 50' }, { status: 400 });
  }

  const allowedStrategies = new Set(['natural', 'balanced_errors', 'strict_truth']);
  const requestedStrategy =
    typeof generationStrategy === 'string' ? generationStrategy.trim().toLowerCase() : null;
  const normalizedStrategy =
    requestedStrategy && allowedStrategies.has(requestedStrategy)
      ? requestedStrategy
      : 'balanced_errors';

  if (!isAccessAdminCode(session.code)) {
    const currentCount = await prisma.assignment.count({
      where: { instructorCode: session.code },
    });
    const limit = getBetaAssignmentLimit();
    if (currentCount >= limit) {
      return NextResponse.json(
        {
          error: `בשלב הבטא אפשר ליצור עד ${limit} מטלות דוגמה. לפרויקט יציב בכיתה: contact@h2eapps.com`,
          code: 'BETA_ASSIGNMENT_LIMIT_REACHED',
          limit,
        },
        { status: 403 }
      );
    }
  }

  // Generate unique student codes without loading the full table into memory.
  const uniqueStudentCodes = new Set<string>();
  let generationRounds = 0;
  while (uniqueStudentCodes.size < parsedStudentCount && generationRounds < 20) {
    generationRounds += 1;
    const needed = parsedStudentCount - uniqueStudentCodes.size;
    const batchSize = Math.max(needed * 3, 12);
    const candidateSet = new Set<string>();
    while (candidateSet.size < batchSize) {
      candidateSet.add(generateCode(6));
    }
    for (const existing of uniqueStudentCodes) {
      candidateSet.delete(existing);
    }
    if (candidateSet.size === 0) continue;

    const candidateCodes = Array.from(candidateSet);
    const existingRows = await prisma.generatedText.findMany({
      where: { studentCode: { in: candidateCodes } },
      select: { studentCode: true },
    });
    const existingCodeSet = new Set(existingRows.map((row) => row.studentCode));

    for (const candidate of candidateCodes) {
      if (existingCodeSet.has(candidate)) continue;
      uniqueStudentCodes.add(candidate);
      if (uniqueStudentCodes.size >= parsedStudentCount) break;
    }
  }

  if (uniqueStudentCodes.size < parsedStudentCount) {
    return NextResponse.json(
      { error: 'Could not allocate unique student codes. Please retry.' },
      { status: 503 }
    );
  }

  const studentCodes = Array.from(uniqueStudentCodes);

  const assignment = await prisma.assignment.create({
    data: {
      title: safeTitle,
      promptText: safePromptText,
      courseContext: sanitizeOptionalTextInput(courseContext, 1600),
      requirements: sanitizeOptionalTextInput(requirements, 3200),
      knownPitfalls: sanitizeOptionalTextInput(knownPitfalls, 3200),
      referenceMaterial: sanitizeOptionalTextInput(referenceMaterial, 8000),
      sectionBlueprint: sanitizeOptionalTextInput(sectionBlueprint, 5000),
      evaluationCriteria: sanitizeOptionalTextInput(evaluationCriteria, 6000),
      exemplarNotes: sanitizeOptionalTextInput(exemplarNotes, 6000),
      generationStrategy: normalizedStrategy,
      plannedStudentCount: parsedStudentCount,
      plannedStudentCodes: serializePlannedStudentCodes(studentCodes),
      modelVersion: getGeminiGenerationModel(),
      instructorCode: session.code,
      status: 'draft',
    },
  });

  return NextResponse.json({
    assignment: {
      ...assignment,
      plannedStudentCodes: studentCodes,
      plannedStudentCount: parsedStudentCount,
    },
    studentCodes,
  });
}
