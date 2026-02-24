import { NextResponse } from 'next/server';

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export async function GET() {
  const siteKey = isTruthyEnv(process.env.ACCESS_REQUEST_RECAPTCHA_DISABLED)
    ? ''
    : process.env.ACCESS_REQUEST_RECAPTCHA_SITE_KEY?.trim() || '';
  return NextResponse.json(
    { siteKey },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
