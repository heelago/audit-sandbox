import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const ownedText = await prisma.generatedText.findFirst({
    where: {
      id,
      assignment: {
        instructorCode: session.code,
      },
    },
    select: { id: true },
  });

  if (!ownedText) {
    return NextResponse.json({ error: 'Text not found or access denied' }, { status: 404 });
  }

  const rubricItems = await prisma.rubricItem.findMany({
    where: { textId: id },
    orderBy: { locationStart: 'asc' },
  });

  return NextResponse.json(rubricItems);
}
