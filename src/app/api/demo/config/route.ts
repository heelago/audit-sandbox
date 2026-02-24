import { NextResponse } from 'next/server';
import { isDemoOpenLanding, isDemoReadOnly, isDemoService } from '@/lib/demo-mode';

export async function GET() {
  const demoService = isDemoService();
  const openLanding = isDemoOpenLanding();
  const readOnly = isDemoReadOnly();

  return NextResponse.json({
    demoService,
    openLanding,
    readOnly,
    quickCodes: {
      instructor: 'PROF01',
      students: ['STU001', 'STU002', 'STU003'],
    },
  });
}
