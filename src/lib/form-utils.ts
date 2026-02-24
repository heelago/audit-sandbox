import type { PlantedSignalId, DisciplinePresetId } from '@/lib/ai/planted-signals';
import { PLANTED_SIGNAL_PRESETS } from '@/lib/ai/planted-signals';
import type { GuidedSection } from '@/lib/types';

export function createEmptyGuidedSection(order: number): GuidedSection {
  return {
    id: `section_${Date.now()}_${order}_${Math.random().toString(36).slice(2, 6)}`,
    title: `חלק ${order}`,
    task: '',
    criteria: '',
    pitfalls: '',
  };
}

export function compactMultiline(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' | ')
    .trim();
}

export function mergeUniqueLines(baseText: string, additions: string[]): string {
  const existing = baseText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const seen = new Set(existing.map((line) => line.toLowerCase()));
  const merged = [...existing];
  for (const item of additions) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(trimmed);
  }
  return merged.join('\n');
}

export function sameIdSet(a: PlantedSignalId[], b: PlantedSignalId[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  for (const id of b) {
    if (!set.has(id)) return false;
  }
  return true;
}

export function resolvePresetForSignals(
  ids: PlantedSignalId[],
  defaultPresetId: DisciplinePresetId = 'general_academic',
): DisciplinePresetId {
  for (const preset of PLANTED_SIGNAL_PRESETS) {
    if (sameIdSet(preset.signalIds, ids)) {
      return preset.id;
    }
  }
  return defaultPresetId;
}
