import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { calculateScore } from '@/lib/scoring';
import { demoWriteBlockedResponse, isDemoReadOnly } from '@/lib/demo-mode';

async function getInstructorOwnedText(textId: string, instructorCode: string) {
  return prisma.generatedText.findFirst({
    where: {
      id: textId,
      assignment: {
        instructorCode,
      },
    },
    include: {
      annotations: { include: { evidence: true } },
      rubricItems: true,
    },
  });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ textId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (isDemoReadOnly()) {
    return demoWriteBlockedResponse();
  }

  const { textId } = await params;
  const text = await getInstructorOwnedText(textId, session.code);

  if (!text) {
    return NextResponse.json({ error: 'Text not found or access denied' }, { status: 404 });
  }

  const result = calculateScore(
    text.annotations,
    text.rubricItems,
    text.textContent.length
  );

  const score = await prisma.score.upsert({
    where: { textId },
    create: {
      textId,
      tier1Raw: result.tier1Raw,
      tier2Deductions: result.tier2Deductions,
      tier3Bonus: result.tier3Bonus,
      coverageScore: result.coverageScore,
      compositeRaw: result.compositeRaw,
      normalizedFinal: result.normalizedFinal,
    },
    update: {
      tier1Raw: result.tier1Raw,
      tier2Deductions: result.tier2Deductions,
      tier3Bonus: result.tier3Bonus,
      coverageScore: result.coverageScore,
      compositeRaw: result.compositeRaw,
      normalizedFinal: result.normalizedFinal,
    },
  });

  await prisma.rubricMatch.deleteMany({ where: { annotation: { textId } } });
  for (const match of result.matches) {
    await prisma.rubricMatch.create({
      data: {
        annotationId: match.annotationId,
        rubricItemId: match.rubricItemId,
        matchConfidence: match.matchConfidence,
        matchQuality: match.matchQuality,
      },
    });
  }

  await prisma.beyondRubricFinding.deleteMany({
    where: { annotation: { textId } },
  });
  for (const annotationId of result.beyondRubricAnnotations) {
    await prisma.beyondRubricFinding.create({
      data: { annotationId },
    });
  }

  await prisma.generatedText.update({
    where: { id: textId },
    data: { status: 'scored' },
  });

  return NextResponse.json({ score, scoring: result });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ textId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { textId } = await params;

  if (session.role === 'student') {
    if (session.textId !== textId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  } else {
    const ownedText = await prisma.generatedText.findFirst({
      where: {
        id: textId,
        assignment: { instructorCode: session.code },
      },
      select: { id: true },
    });
    if (!ownedText) {
      return NextResponse.json({ error: 'Text not found or access denied' }, { status: 404 });
    }
  }

  const score = await prisma.score.findUnique({
    where: { textId },
  });

  if (!score) {
    return NextResponse.json({ error: 'No score found' }, { status: 404 });
  }

  if (session.role === 'student' && !score.releasedAt) {
    return NextResponse.json({ error: 'Score not yet released' }, { status: 403 });
  }

  return NextResponse.json(score);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ textId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (isDemoReadOnly()) {
    return demoWriteBlockedResponse();
  }

  const { textId } = await params;
  const ownedText = await prisma.generatedText.findFirst({
    where: {
      id: textId,
      assignment: { instructorCode: session.code },
    },
    select: { id: true },
  });
  if (!ownedText) {
    return NextResponse.json({ error: 'Text not found or access denied' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const overrideScore = payload.overrideScore;
  const notes = payload.notes;
  const release = payload.release;

  const data: {
    professorAdjusted: boolean;
    professorOverride?: number;
    professorNotes?: string;
    releasedAt?: Date;
  } = {
    professorAdjusted: true,
  };

  if (typeof overrideScore === 'number' && Number.isFinite(overrideScore)) {
    data.professorOverride = Math.max(0, Math.min(100, overrideScore));
  }
  if (typeof notes === 'string') {
    data.professorNotes = notes.trim();
  }
  if (release === true) {
    data.releasedAt = new Date();
  }

  const score = await prisma.score.update({
    where: { textId },
    data,
  });

  return NextResponse.json(score);
}
