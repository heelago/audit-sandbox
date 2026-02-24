import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(null);
  return NextResponse.json({
    role: session.role,
    assignmentId: session.assignmentId,
    textId: session.textId,
  });
}
