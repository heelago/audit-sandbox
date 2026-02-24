import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { demoWriteBlockedResponse, isDemoReadOnly } from '@/lib/demo-mode';

const ALLOWED_ANNOTATION_TYPES = new Set([
  'error',
  'verified',
  'alternative',
  'gap',
  'nuance',
  'accepted',
]);

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'student') {
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
  const textId = payload.textId;
  const type = payload.type;
  const locationStart = payload.locationStart;
  const locationEnd = payload.locationEnd;
  const selectedText = payload.selectedText;

  if (typeof textId !== 'string' || typeof type !== 'string' || typeof selectedText !== 'string') {
    return NextResponse.json({ error: 'Invalid annotation payload' }, { status: 400 });
  }
  if (!ALLOWED_ANNOTATION_TYPES.has(type)) {
    return NextResponse.json({ error: 'Unsupported annotation type' }, { status: 400 });
  }
  if (
    typeof locationStart !== 'number' ||
    typeof locationEnd !== 'number' ||
    !Number.isInteger(locationStart) ||
    !Number.isInteger(locationEnd) ||
    locationStart < 0 ||
    locationEnd <= locationStart
  ) {
    return NextResponse.json({ error: 'Invalid annotation location' }, { status: 400 });
  }
  if (!selectedText.trim() || selectedText.length > 5000) {
    return NextResponse.json({ error: 'Invalid annotation selection text' }, { status: 400 });
  }

  // Verify the student has access to this text
  if (session.textId !== textId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const annotation = await prisma.annotation.create({
    data: {
      textId,
      type,
      locationStart,
      locationEnd,
      selectedText,
      note: '',
    },
    include: { evidence: true },
  });

  return NextResponse.json(annotation);
}
