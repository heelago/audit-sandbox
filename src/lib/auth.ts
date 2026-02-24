import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE = 'audit-session';
const DEV_SESSION_SECRET = 'audit-sandbox-dev-secret-key';

export interface Session {
  role: 'instructor' | 'student';
  code: string;
  assignmentId?: string;
  textId?: string;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (secret && secret.length >= 16) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is missing or too short in production.');
  }

  return DEV_SESSION_SECRET;
}

function signPayload(payload: string): string {
  return createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
}

function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function decodeSession(value: string): Session | null {
  const parts = value.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSignature = signPayload(payload);

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;

  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded) as Session;
    if (!parsed || (parsed.role !== 'instructor' && parsed.role !== 'student')) {
      return null;
    }
    if (!parsed.code || typeof parsed.code !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setSession(session: Session): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie?.value) return null;
  return decodeSession(cookie.value);
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
