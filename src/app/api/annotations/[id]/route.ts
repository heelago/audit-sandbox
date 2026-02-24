import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { demoWriteBlockedResponse, isDemoReadOnly } from '@/lib/demo-mode';

export async function PUT(
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
  const note = payload.note;
  if (typeof note !== 'string' || note.length > 10000) {
    return NextResponse.json({ error: 'Invalid annotation note' }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.annotation.findUnique({
    where: { id },
    select: { textId: true },
  });

  if (!existing || existing.textId !== session.textId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const annotation = await prisma.annotation.update({
    where: { id },
    data: { note },
    include: { evidence: true },
  });

  return NextResponse.json(annotation);
}

export async function DELETE(
  _request: NextRequest,
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

  // Verify ownership
  const existing = await prisma.annotation.findUnique({
    where: { id },
    select: { textId: true },
  });

  if (!existing || existing.textId !== session.textId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  await prisma.annotation.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
