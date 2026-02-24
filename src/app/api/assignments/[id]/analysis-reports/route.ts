import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  const url = new URL(request.url);
  const textId = url.searchParams.get('textId');
  const latestOnly = url.searchParams.get('latest') === '1';
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 25)));

  const reports = await prisma.agentAnalysisReport.findMany({
    where: {
      assignmentId: id,
      ...(textId ? { textId } : {}),
    },
    include: {
      agentRuns: {
        orderBy: { createdAt: 'asc' },
      },
      findings: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: latestOnly ? undefined : limit,
  });

  const payload = latestOnly
    ? Object.values(
        reports.reduce<Record<string, (typeof reports)[number]>>((acc, report) => {
          if (!acc[report.textId]) acc[report.textId] = report;
          return acc;
        }, {})
      ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    : reports;

  return NextResponse.json({
    assignmentId: id,
    count: payload.length,
    reports: payload,
  });
}
