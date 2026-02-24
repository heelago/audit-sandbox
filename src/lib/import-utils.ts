import type { ImportTextEntry } from '@/lib/types';

export function parseImportEntries(raw: string): ImportTextEntry[] {
  const input = raw.trim();
  if (!input) return [];

  const asEntries = (value: unknown): ImportTextEntry[] => {
    if (!Array.isArray(value)) return [];
    const out: ImportTextEntry[] = [];
    for (const item of value) {
      if (typeof item === 'string') {
        const text = item.trim();
        if (text) out.push({ textContent: text });
        continue;
      }

      if (!item || typeof item !== 'object') continue;
      const source = item as Record<string, unknown>;
      const text =
        typeof source.textContent === 'string'
          ? source.textContent.trim()
          : typeof source.text === 'string'
            ? source.text.trim()
            : '';
      if (!text) continue;

      out.push({
        textContent: text,
        studentCode: typeof source.studentCode === 'string' ? source.studentCode.trim().toUpperCase() : undefined,
        sourceLabel: typeof source.sourceLabel === 'string' ? source.sourceLabel.trim() : undefined,
      });
    }
    return out;
  };

  if (input.startsWith('[') || input.startsWith('{')) {
    try {
      const parsed = JSON.parse(input) as unknown;
      if (Array.isArray(parsed)) return asEntries(parsed);
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).entries)) {
        return asEntries((parsed as Record<string, unknown>).entries);
      }
    } catch {
      return [];
    }
  }

  return input
    .split(/\n\s*(?:---|===)\s*\n/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((textContent) => ({ textContent }));
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function getGenerationProvider(meta: string | null | undefined): 'gemini' | 'mock' | 'upload' | 'unknown' {
  if (!meta) return 'unknown';
  try {
    const parsed = JSON.parse(meta) as { provider?: string };
    const provider = parsed.provider?.toLowerCase() ?? '';
    if (provider.includes('gemini')) return 'gemini';
    if (provider.includes('mock')) return 'mock';
    if (provider.includes('upload')) return 'upload';
  } catch {
    return 'unknown';
  }
  return 'unknown';
}

export function getGenerationProviderLabel(provider: 'gemini' | 'mock' | 'upload' | 'unknown'): string {
  if (provider === 'gemini') return 'Gemini';
  if (provider === 'mock') return 'דמו';
  if (provider === 'upload') return 'ייבוא';
  return 'לא ידוע';
}
