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
} from '@/lib/ai/gemini';

const LOCKED_STATUSES = new Set(['active', 'grading', 'closed']);
const MOCK_TEXTS = [SAMPLE_TEXT_1, SAMPLE_TEXT_2, SAMPLE_TEXT_3];

function formatGeminiError(error: unknown): string {
  if (error instanceof GeminiApiError) {
    if (error.status === 403) {
      return `Gemini access denied (403): ${error.message}. Check API key restrictions and enabled APIs in Google Cloud.`;
    }
    return `Gemini regeneration failed: ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return 'Unexpected regeneration error.';
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
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const requireGemini = body.requireGemini !== false;

  const text = await prisma.generatedText.findFirst({
    where: {
      id,
      assignment: { instructorCode: session.code },
    },
    select: {
      id: true,
      studentCode: true,
      assignmentId: true,
      assignment: {
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
          status: true,
        },
      },
    },
  });

  if (!text) {
    return NextResponse.json({ error: 'Text not found or access denied' }, { status: 404 });
  }
  if (LOCKED_STATUSES.has(text.assignment.status)) {
    return NextResponse.json(
      { error: 'Cannot regenerate text after assignment is active or closed.' },
      { status: 400 }
    );
  }

  const geminiAvailability = getGeminiGenerationAvailability();
  if (requireGemini && !geminiAvailability.enabled) {
    return NextResponse.json(
      {
        error: `Gemini regeneration is required but unavailable. ${geminiAvailability.reason ?? ''}`,
      },
      { status: 503 }
    );
  }

  const previousAssignmentStatus = text.assignment.status;
  await prisma.$transaction(async (tx) => {
    await tx.generatedText.update({
      where: { id: text.id },
      data: { status: 'generating' },
    });
    await tx.assignment.update({
      where: { id: text.assignmentId },
      data: { status: 'generating' },
    });
  });

  try {
    const generated = geminiAvailability.enabled
      ? await generateAssignmentTextWithGemini({
          assignmentTitle: text.assignment.title,
          promptText: text.assignment.promptText,
          courseContext: text.assignment.courseContext,
          requirements: text.assignment.requirements,
          knownPitfalls: text.assignment.knownPitfalls,
          referenceMaterial: text.assignment.referenceMaterial,
          sectionBlueprint: text.assignment.sectionBlueprint,
          evaluationCriteria: text.assignment.evaluationCriteria,
          exemplarNotes: text.assignment.exemplarNotes,
          generationStrategy:
            text.assignment.generationStrategy === 'balanced_errors' ||
            text.assignment.generationStrategy === 'strict_truth'
              ? text.assignment.generationStrategy
              : 'natural',
          studentCode: text.studentCode,
        })
      : {
          textContent: MOCK_TEXTS[Math.floor(Math.random() * MOCK_TEXTS.length)],
          wordCount: 0,
          meta: {
            provider: 'mock',
            model: 'mock-regenerate',
            generatedAt: new Date().toISOString(),
          },
        };

    const textContent = generated.textContent.trim();
    const wordCount = generated.wordCount > 0 ? generated.wordCount : countWords(textContent);

    await prisma.$transaction(async (tx) => {
      await tx.generatedText.update({
        where: { id: text.id },
        data: {
          textContent,
          wordCount,
          generationMeta: JSON.stringify(generated.meta),
          status: 'generated',
          difficultyRating: null,
          rawQualityScore: null,
        },
      });
      await tx.rubricItem.deleteMany({ where: { textId: text.id } });
      await tx.agentAnalysisReport.deleteMany({ where: { textId: text.id } });
      await tx.score.deleteMany({ where: { textId: text.id } });
      await tx.assignment.update({
        where: { id: text.assignmentId },
        data: { status: 'analyzing' },
      });
      await tx.calibrationLog.create({
        data: {
          assignmentId: text.assignmentId,
          action: 'text_regenerated',
          notes: `text:${text.id}; mode:${geminiAvailability.enabled ? 'gemini' : 'mock-fallback'}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      textId: text.id,
      mode: geminiAvailability.enabled ? 'gemini' : 'mock-fallback',
    });
  } catch (error) {
    await prisma.$transaction(async (tx) => {
      await tx.generatedText.update({
        where: { id: text.id },
        data: { status: 'generated' },
      });
      await tx.assignment.update({
        where: { id: text.assignmentId },
        data: { status: previousAssignmentStatus },
      });
      await tx.calibrationLog.create({
        data: {
          assignmentId: text.assignmentId,
          action: 'text_regeneration_failed',
          notes: formatGeminiError(error),
        },
      });
    });
    return NextResponse.json({ error: formatGeminiError(error) }, { status: 502 });
  }
}
