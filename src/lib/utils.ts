export function generateCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function normalizeGeneratedText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  try {
    const parsed = JSON.parse(trimmed) as { text?: unknown };
    if (parsed && typeof parsed === 'object' && typeof parsed.text === 'string' && parsed.text.trim()) {
      return parsed.text.trim();
    }
  } catch {
    // Fall through to regex salvage.
  }

  const match = trimmed.match(/"text"\s*:\s*"((?:\\.|[\s\S])*?)"/);
  if (match?.[1]) {
    try {
      return JSON.parse(`"${match[1]}"`) as string;
    } catch {
      return match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
  }

  return text;
}

export function calculateCoverage(
  textLength: number,
  annotations: Array<{ locationStart: number; locationEnd: number }>
): number {
  if (textLength === 0) return 0;
  const covered = new Set<number>();
  for (const ann of annotations) {
    for (let i = ann.locationStart; i < ann.locationEnd; i++) {
      covered.add(i);
    }
  }
  return Math.round((covered.size / textLength) * 100);
}
