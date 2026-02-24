import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { demoWriteBlockedResponse, isDemoReadOnly } from '@/lib/demo-mode';

export async function POST(
  _request: NextRequest,
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
    select: { id: true },
  });

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
  }

  await prisma.generatedText.updateMany({
    where: { assignmentId: id },
    data: { status: 'assigned' },
  });

  await prisma.assignment.update({
    where: { id },
    data: { status: 'active' },
  });

  return NextResponse.json({ success: true });
}
