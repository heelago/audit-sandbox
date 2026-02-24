import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { countWords } from '@/lib/utils';
import { demoWriteBlockedResponse, isDemoReadOnly } from '@/lib/demo-mode';
import { buildStudentVisiblePrompt, sanitizeTextInput } from '@/lib/security';

const EDITABLE_ASSIGNMENT_STATUSES = new Set(['draft', 'generating', 'analyzing', 'calibrating']);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (session.role === 'student' && session.textId !== id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (session.role === 'student') {
    const text = await prisma.generatedText.findUnique({
      where: { id },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            status: true,
            requirements: true,
          },
        },
        annotations: {
          include: { evidence: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!text) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...text,
      assignment: {
        id: text.assignment.id,
        title: text.assignment.title,
        status: text.assignment.status,
        promptText: buildStudentVisiblePrompt({
          title: text.assignment.title,
          requirements: text.assignment.requirements,
        }),
      },
    });
  }

  const text = await prisma.generatedText.findFirst({
    where: {
      id,
      assignment: { instructorCode: session.code },
    },
    include: {
      assignment: {
        select: {
          id: true,
          title: true,
          status: true,
          promptText: true,
        },
      },
      annotations: {
        include: { evidence: true },
        orderBy: { createdAt: 'desc' },
      },
      rubricItems: true,
      score: true,
    },
  });

  if (!text) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(text);
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
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.textContent !== 'string') {
    return NextResponse.json({ error: 'textContent is required' }, { status: 400 });
  }

  const nextTextContent = sanitizeTextInput(body.textContent, 20_000);
  if (!nextTextContent) {
    return NextResponse.json({ error: 'textContent must not be empty' }, { status: 400 });
  }
  const resetAnalysis = body.resetAnalysis !== false;

  const text = await prisma.generatedText.findFirst({
    where: {
      id,
      assignment: { instructorCode: session.code },
    },
    select: {
      id: true,
      assignmentId: true,
      assignment: { select: { status: true } },
    },
  });
  if (!text) {
    return NextResponse.json({ error: 'Text not found or access denied' }, { status: 404 });
  }
  if (!EDITABLE_ASSIGNMENT_STATUSES.has(text.assignment.status)) {
    return NextResponse.json(
      { error: 'Text can only be edited before assignment release.' },
      { status: 400 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedText = await tx.generatedText.update({
      where: { id },
      data: {
        textContent: nextTextContent,
        wordCount: countWords(nextTextContent),
        status: 'generated',
        difficultyRating: null,
        rawQualityScore: null,
      },
      select: {
        id: true,
        assignmentId: true,
        studentCode: true,
        wordCount: true,
        status: true,
      },
    });

    if (resetAnalysis) {
      await tx.rubricItem.deleteMany({ where: { textId: id } });
      await tx.agentAnalysisReport.deleteMany({ where: { textId: id } });
      await tx.score.deleteMany({ where: { textId: id } });
      await tx.assignment.update({
        where: { id: text.assignmentId },
        data: { status: 'analyzing' },
      });
      await tx.calibrationLog.create({
        data: {
          assignmentId: text.assignmentId,
          action: 'text_manual_edit',
          notes: `text:${id}; reset_analysis:true`,
        },
      });
    } else {
      await tx.calibrationLog.create({
        data: {
          assignmentId: text.assignmentId,
          action: 'text_manual_edit',
          notes: `text:${id}; reset_analysis:false`,
        },
      });
    }

    return updatedText;
  });

  return NextResponse.json({
    success: true,
    text: updated,
    resetAnalysis,
  });
}
