import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { SAMPLE_TEXT_1, SAMPLE_TEXT_2, SAMPLE_TEXT_3 } from '@/lib/mock-data';
import { countWords } from '@/lib/utils';
import { demoWriteBlockedResponse, isDemoReadOnly } from '@/lib/demo-mode';
import {
  GeminiApiError,
  generateAssignmentTextWithGemini,
  getGeminiGenerationAvailability,
  getGeminiGenerationModel,
} from '@/lib/ai/gemini';
import {
  normalizeStudentCodes,
  parsePlannedStudentCodes,
  serializePlannedStudentCodes,
} from '@/lib/assignment-roster';

const MOCK_TEXTS = [SAMPLE_TEXT_1, SAMPLE_TEXT_2, SAMPLE_TEXT_3];
const LOCKED_STATUSES = new Set(['active', 'grading', 'closed']);

type PlannedText = {
  studentCode: string;
  textContent: string;
  wordCount: number;
  generationMeta: string;
  status: string;
};

function formatGeminiError(error: unknown): string {
  if (error instanceof GeminiApiError) {
    if (error.status === 403) {
      return `Gemini access denied (403): ${error.message}. Check API key restrictions and enabled APIs in Google Cloud.`;
    }
    return `Gemini generation failed: ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return 'Unexpected generation error.';
}

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

  const assignment = await prisma.assignment.findFirst({
    where: {
      id,
      instructorCode: session.code,
    },
    include: { texts: true },
  });

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
  }

  if (LOCKED_STATUSES.has(assignment.status)) {
    return NextResponse.json(
      { error: 'Cannot generate new texts after assignment is active or closed.' },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const rawStudentCodes = body.studentCodes;
  const requireGemini = body.requireGemini !== false;
  const generationStage =
    typeof body.generationStage === 'string' ? body.generationStage.trim().toLowerCase() : null;
  const pilotCount =
    typeof body.pilotCount === 'number' && Number.isInteger(body.pilotCount)
      ? Math.max(1, Math.min(10, body.pilotCount))
      : 2;
  const payloadStudentCodes = Array.isArray(rawStudentCodes)
    ? rawStudentCodes.filter((code): code is string => typeof code === 'string')
    : null;

  const storedRosterCodes = parsePlannedStudentCodes(assignment.plannedStudentCodes);
  const studentCodes =
    payloadStudentCodes && payloadStudentCodes.length > 0
      ? normalizeStudentCodes(payloadStudentCodes)
      : storedRosterCodes;

  if (studentCodes.length === 0) {
    return NextResponse.json(
      { error: 'No planned student roster found. Add roster codes before generation.' },
      { status: 400 }
    );
  }

  if (payloadStudentCodes && payloadStudentCodes.length > 0 && studentCodes.length !== payloadStudentCodes.length) {
    return NextResponse.json(
      { error: 'Invalid or duplicate student codes were provided in payload.' },
      { status: 400 }
    );
  }

  const existingCodes = new Set(assignment.texts.map((text) => text.studentCode.toUpperCase()));
  const newCodes = studentCodes.filter((code) => !existingCodes.has(code));
  const codesToGenerate =
    generationStage === 'pilot' ? newCodes.slice(0, pilotCount) : newCodes;
  if (codesToGenerate.length === 0) {
    return NextResponse.json(
      { error: 'All provided student codes already have generated texts.' },
      { status: 400 }
    );
  }

  const geminiAvailability = getGeminiGenerationAvailability();
  const geminiEnabled = geminiAvailability.enabled;
  console.info('[generate] start', {
    assignmentId: id,
    requireGemini,
    geminiEnabled,
    generationStage: generationStage ?? 'full',
    rosterCount: studentCodes.length,
    toGenerate: codesToGenerate.length,
  });
  if (requireGemini && !geminiEnabled) {
    return NextResponse.json(
      {
        error: `Gemini generation is required but unavailable. ${geminiAvailability.reason ?? ''} Set GEMINI_API_KEY and ensure USE_MOCK_AI is not enabled.`,
      },
      { status: 503 }
    );
  }

  const previousStatus = assignment.status;
  await prisma.assignment.update({
    where: { id },
    data: {
      status: 'generating',
      modelVersion: geminiEnabled ? getGeminiGenerationModel() : assignment.modelVersion,
    },
  });
  await prisma.calibrationLog
    .create({
      data: {
        assignmentId: id,
        action: 'generation_started',
        notes: `mode:${geminiEnabled ? 'gemini' : 'mock-fallback'}; stage:${generationStage ?? 'full'}; planned:${codesToGenerate.length}`,
      },
    })
    .catch(() => undefined);

  const plannedTexts: PlannedText[] = [];
  try {
    for (let i = 0; i < codesToGenerate.length; i++) {
      const studentCode = codesToGenerate[i];
      if (geminiEnabled) {
        const generated = await generateAssignmentTextWithGemini({
          assignmentTitle: assignment.title,
          promptText: assignment.promptText,
          courseContext: assignment.courseContext,
          requirements: assignment.requirements,
          knownPitfalls: assignment.knownPitfalls,
          referenceMaterial: assignment.referenceMaterial,
          sectionBlueprint: assignment.sectionBlueprint,
          evaluationCriteria: assignment.evaluationCriteria,
          exemplarNotes: assignment.exemplarNotes,
          generationStrategy:
            assignment.generationStrategy === 'balanced_errors' ||
            assignment.generationStrategy === 'strict_truth'
              ? assignment.generationStrategy
              : 'natural',
          studentCode,
        });
        plannedTexts.push({
          studentCode,
          textContent: generated.textContent,
          wordCount: generated.wordCount,
          generationMeta: JSON.stringify(generated.meta),
          status: 'generated',
        });
        continue;
      }

      const mockText = MOCK_TEXTS[(assignment.texts.length + i) % MOCK_TEXTS.length];
      plannedTexts.push({
        studentCode,
        textContent: mockText,
        wordCount: countWords(mockText),
        generationMeta: JSON.stringify({
          provider: 'mock',
          model: 'mock-generation',
          generatedAt: new Date().toISOString(),
        }),
        status: 'generated',
      });
    }
  } catch (error) {
    await prisma.assignment.update({
      where: { id },
      data: { status: previousStatus },
    });
    const message = formatGeminiError(error);
    console.error('[generate] failed', { assignmentId: id, error: message });
    await prisma.calibrationLog
      .create({
        data: {
          assignmentId: id,
          action: 'generation_failed',
          notes: message,
        },
      })
      .catch(() => undefined);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const createdTexts = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const planned of plannedTexts) {
      const text = await tx.generatedText.create({
        data: {
          assignmentId: id,
          studentCode: planned.studentCode,
          textContent: planned.textContent,
          wordCount: planned.wordCount,
          generationMeta: planned.generationMeta,
          status: planned.status,
        },
      });
      created.push(text);
    }

    await tx.assignment.update({
      where: { id },
      data: {
        status: 'analyzing',
        plannedStudentCount: studentCodes.length,
        plannedStudentCodes: serializePlannedStudentCodes(studentCodes),
      },
    });
    return created;
  });
  await prisma.calibrationLog
    .create({
      data: {
        assignmentId: id,
        action: 'generation_completed',
        notes: `mode:${geminiEnabled ? 'gemini' : 'mock-fallback'}; created:${createdTexts.length}; pending:${newCodes.length - codesToGenerate.length}`,
      },
    })
    .catch(() => undefined);
  console.info('[generate] complete', {
    assignmentId: id,
    mode: geminiEnabled ? 'gemini' : 'mock-fallback',
    created: createdTexts.length,
    pending: newCodes.length - codesToGenerate.length,
  });

  return NextResponse.json({
    success: true,
    textsCreated: createdTexts.length,
    generationMode: geminiEnabled ? 'gemini' : 'mock-fallback',
    generationStage: generationStage ?? 'full',
    rosterCount: studentCodes.length,
    skippedExistingCodes: studentCodes.length - newCodes.length,
    pendingCodes: newCodes.length - codesToGenerate.length,
    texts: createdTexts.map((text) => ({
      id: text.id,
      studentCode: text.studentCode,
      wordCount: text.wordCount,
    })),
  });
}
