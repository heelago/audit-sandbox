import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const MAX_JSON_BODY_BYTES = 2 * 1024 * 1024; // 2 MB

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function resolveRateLimitConfig(pathname: string, method: string): {
  key: string;
  limit: number;
  windowMs: number;
} {
  if (pathname === '/api/auth' && method === 'POST') {
    return { key: 'api:auth', limit: 25, windowMs: 15 * 60 * 1000 };
  }

  if (
    method === 'POST' &&
    (pathname.endsWith('/generate') || pathname.endsWith('/analyze') || pathname.endsWith('/regenerate'))
  ) {
    return { key: 'api:ai-mutate', limit: 30, windowMs: 10 * 60 * 1000 };
  }

  if (MUTATING_METHODS.has(method)) {
    return { key: 'api:mutate', limit: 240, windowMs: 5 * 60 * 1000 };
  }

  return { key: 'api:read', limit: 1200, windowMs: 5 * 60 * 1000 };
}

function parseOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function collectAllowedOrigins(request: NextRequest): Set<string> {
  const allowed = new Set<string>();

  // Canonical runtime origin as seen by Next.js.
  allowed.add(request.nextUrl.origin);

  // Host headers may differ behind Firebase proxies (e.g., hosted.app vs web.app).
  const host = request.headers.get('host');
  if (host) {
    allowed.add(`${request.nextUrl.protocol}//${host}`);
  }
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedHost) {
    const firstHost = forwardedHost.split(',')[0]?.trim();
    if (firstHost) {
      allowed.add(`${request.nextUrl.protocol}//${firstHost}`);
    }
  }

  // Optional explicit public URLs.
  const publicAppOrigin = parseOrigin(process.env.PUBLIC_APP_URL);
  if (publicAppOrigin) allowed.add(publicAppOrigin);

  const extraAllowed = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => parseOrigin(value.trim()))
    .filter((value): value is string => Boolean(value));
  for (const origin of extraAllowed) {
    allowed.add(origin);
  }

  return allowed;
}

function collectRequestHosts(request: NextRequest): Set<string> {
  const hosts = new Set<string>();

  if (request.nextUrl.host) {
    hosts.add(request.nextUrl.host.toLowerCase());
  }

  const host = request.headers.get('host');
  if (host) {
    hosts.add(host.trim().toLowerCase());
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedHost) {
    const firstHost = forwardedHost.split(',')[0]?.trim();
    if (firstHost) {
      hosts.add(firstHost.toLowerCase());
    }
  }

  return hosts;
}

function hasInvalidOrigin(request: NextRequest): boolean {
  const origin = parseOrigin(request.headers.get('origin'));
  if (!origin) return false;

  // Host-level same-origin validation is resilient to proxy protocol rewrites
  // (for example internal http between edge and runtime while browser is https).
  try {
    const originHost = new URL(origin).host.toLowerCase();
    if (collectRequestHosts(request).has(originHost)) {
      return false;
    }
  } catch {
    return true;
  }

  return !collectAllowedOrigins(request).has(origin);
}

function hasOversizedBody(request: NextRequest): boolean {
  const rawLength = request.headers.get('content-length');
  if (!rawLength) return false;
  const length = Number(rawLength);
  if (!Number.isFinite(length) || length <= 0) return false;
  return length > MAX_JSON_BODY_BYTES;
}

function shouldSkipOriginValidation(pathname: string): boolean {
  // Public intake endpoint: protected in-route by honeypot, min-fill timing,
  // per-IP/per-email rate limits, and optional reCAPTCHA.
  // Skipping strict origin checks here avoids false 403s behind proxy/domain setups.
  return pathname === '/api/access-requests';
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const method = request.method.toUpperCase();
  const ip = getClientIp(request);
  const config = resolveRateLimitConfig(request.nextUrl.pathname, method);
  const rate = checkRateLimit(`${config.key}:${ip}`, config.limit, config.windowMs);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSeconds) },
      }
    );
  }

  if (MUTATING_METHODS.has(method)) {
    if (!shouldSkipOriginValidation(request.nextUrl.pathname) && hasInvalidOrigin(request)) {
      return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    }
    if (hasOversizedBody(request)) {
      return NextResponse.json({ error: 'Request body too large.' }, { status: 413 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
