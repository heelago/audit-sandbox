export const STUDENT_CODE_PATTERN = /^[A-Z0-9]{4,16}$/;

export function normalizeStudentCodes(rawCodes: string[]): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const raw of rawCodes) {
    const code = raw.trim().toUpperCase();
    if (!STUDENT_CODE_PATTERN.test(code)) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    normalized.push(code);
  }

  return normalized;
}

export function parsePlannedStudentCodes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const asStrings = parsed.filter((value): value is string => typeof value === 'string');
    return normalizeStudentCodes(asStrings);
  } catch {
    return [];
  }
}

export function serializePlannedStudentCodes(codes: string[]): string {
  return JSON.stringify(normalizeStudentCodes(codes));
}

export function mergeStudentCodes(baseCodes: string[], additionalCodes: string[]): string[] {
  const merged = [...normalizeStudentCodes(baseCodes)];
  const seen = new Set(merged);

  for (const code of normalizeStudentCodes(additionalCodes)) {
    if (seen.has(code)) continue;
    seen.add(code);
    merged.push(code);
  }

  return merged;
}
