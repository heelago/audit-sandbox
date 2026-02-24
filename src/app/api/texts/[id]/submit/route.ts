import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { demoWriteBlockedResponse, isDemoReadOnly } from '@/lib/demo-mode';

export async function POST(
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

  // Verify the student owns this text
  if (session.textId !== id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const text = await prisma.generatedText.update({
    where: { id },
    data: { status: 'submitted' },
  });

  return NextResponse.json({ success: true, status: text.status });
}
