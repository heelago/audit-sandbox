export function getAccessAdminCodes(): string[] {
  const raw = process.env.ACCESS_ADMIN_CODES?.trim();
  if (raw) {
    return raw
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);
  }

  if (process.env.NODE_ENV !== 'production') {
    return ['PROF01'];
  }
  return [];
}

export function isAccessAdminCode(code: string | null | undefined): boolean {
  if (!code) return false;
  const normalized = code.trim().toUpperCase();
  if (!normalized) return false;
  return getAccessAdminCodes().includes(normalized);
}
