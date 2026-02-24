import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateCode } from '@/lib/utils';
import { demoWriteBlockedResponse, isDemoReadOnly } from '@/lib/demo-mode';
import { getGeminiGenerationModel } from '@/lib/ai/gemini';
import {
  parsePlannedStudentCodes,
  serializePlannedStudentCodes,
} from '@/lib/assignment-roster';
import { sanitizeOptionalTextInput } from '@/lib/security';

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

  // Generate unique student codes
  const studentCodes: string[] = [];
  const existingCodes = new Set(
    (await prisma.generatedText.findMany({ select: { studentCode: true } })).map(
      (t: { studentCode: string }) => t.studentCode
    )
  );

  for (let i = 0; i < parsedStudentCount; i++) {
    let code: string;
    do {
      code = generateCode(6);
    } while (existingCodes.has(code) || studentCodes.includes(code));
    studentCodes.push(code);
  }

  const assignment = await prisma.assignment.create({
    data: {
      title: safeTitle,
      promptText: safePromptText,
        courseContext: sanitizeOptionalTextInput(courseContext, 1600),
        requirements: sanitizeOptionalTextInput(requirements, 3200),
        knownPitfalls: sanitizeOptionalTextInput(knownPitfalls, 3200),
        referenceMaterial:
          sanitizeOptionalTextInput(referenceMaterial, 8000),
        sectionBlueprint:
          sanitizeOptionalTextInput(sectionBlueprint, 5000),
        evaluationCriteria:
          sanitizeOptionalTextInput(evaluationCriteria, 6000),
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
