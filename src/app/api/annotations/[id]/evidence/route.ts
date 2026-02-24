import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { demoWriteBlockedResponse, isDemoReadOnly } from '@/lib/demo-mode';

const ALLOWED_EVIDENCE_TYPES = new Set(['conversation', 'source', 'note']);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (isDemoReadOnly()) {
    return demoWriteBlockedResponse();
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const type = payload.type;
  const content = payload.content;
  if (typeof type !== 'string' || !ALLOWED_EVIDENCE_TYPES.has(type)) {
    return NextResponse.json({ error: 'Invalid evidence type' }, { status: 400 });
  }
  if (typeof content !== 'string' || !content.trim() || content.length > 20000) {
    return NextResponse.json({ error: 'Invalid evidence content' }, { status: 400 });
  }

  // Verify ownership
  const annotation = await prisma.annotation.findUnique({
    where: { id },
    select: { textId: true },
  });

  if (!annotation || annotation.textId !== session.textId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const evidence = await prisma.evidence.create({
    data: {
      annotationId: id,
      type,
      content: content.trim(),
    },
  });

  return NextResponse.json(evidence);
}
