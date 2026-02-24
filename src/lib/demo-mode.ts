import { NextResponse } from 'next/server';

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);

export function isTruthy(value: string | undefined): boolean {
  if (!value) return false;
  return TRUTHY_VALUES.has(value.trim().toLowerCase());
}

export function isDemoService(): boolean {
  const serviceName = process.env.K_SERVICE?.toLowerCase() ?? '';
  return serviceName.includes('demo');
}

export function isDemoReadOnly(): boolean {
  return isTruthy(process.env.DEMO_READ_ONLY) || isDemoService();
}

export function isDemoOpenLanding(): boolean {
  return isTruthy(process.env.DEMO_OPEN_LANDING) || isDemoService();
}

export function demoWriteBlockedResponse() {
  return NextResponse.json(
    { error: 'Demo mode is read-only.' },
    { status: 403 }
  );
}
