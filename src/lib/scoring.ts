import { matchAnnotationsToRubric, type MatchResult } from './matching';

interface AnnotationForScoring {
  id: string;
  type: string;
  locationStart: number;
  locationEnd: number;
  selectedText: string;
  note: string;
  evidence?: Array<{ id: string; type: string; content: string }>;
}

interface RubricItemForScoring {
  id: string;
  passSource: string;
  severity: string;
  category: string;
  locationStart: number;
  locationEnd: number;
  description: string;
  confirmed: boolean;
}

export interface ScoringResult {
  tier1Raw: number;
  tier2Deductions: number;
  tier3Bonus: number;
  coverageScore: number;
  compositeRaw: number;
  normalizedFinal: number;
  matches: MatchResult[];
  missedItems: string[]; // rubric item IDs
  beyondRubricAnnotations: string[]; // annotation IDs
}

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 3,
  moderate: 2,
  minor: 1,
};

export function calculateScore(
  annotations: AnnotationForScoring[],
  rubricItems: RubricItemForScoring[],
  textLength: number
): ScoringResult {
  const confirmedItems = rubricItems.filter((r) => r.confirmed);

  // Step 1: Match annotations to rubric
  const matches = matchAnnotationsToRubric(annotations, confirmedItems);
  const matchedRubricIds = new Set(matches.map((m) => m.rubricItemId));
  const matchedAnnotationIds = new Set(matches.map((m) => m.annotationId));

  // Step 2: Tier 1 — Rubric matches (max 60)
  let tier1Points = 0;
  let tier1MaxPossible = 0;

  for (const item of confirmedItems) {
    const weight = SEVERITY_WEIGHT[item.severity] || 1;
    tier1MaxPossible += 10 * weight; // max quality 10 × weight
  }

  for (const match of matches) {
    const item = confirmedItems.find((r) => r.id === match.rubricItemId);
    if (item) {
      const weight = SEVERITY_WEIGHT[item.severity] || 1;
      tier1Points += match.matchQuality * weight;
    }
  }

  const tier1Raw =
    tier1MaxPossible > 0
      ? Math.round((tier1Points / tier1MaxPossible) * 60 * 10) / 10
      : 0;

  // Step 3: Tier 2 — Missed items (max -20)
  const missedItems = confirmedItems
    .filter((r) => !matchedRubricIds.has(r.id))
    .map((r) => r.id);

  let tier2Deduction = 0;
  for (const itemId of missedItems) {
    const item = confirmedItems.find((r) => r.id === itemId);
    if (item) {
      const weight = SEVERITY_WEIGHT[item.severity] || 1;
      tier2Deduction += weight * 2;
    }
  }

  const tier2Max = confirmedItems.reduce(
    (sum, r) => sum + (SEVERITY_WEIGHT[r.severity] || 1) * 2,
    0
  );
  const tier2Deductions =
    tier2Max > 0
      ? -Math.round((tier2Deduction / tier2Max) * 20 * 10) / 10
      : 0;

  // Step 4: Tier 3 — Beyond rubric (max +20)
  const beyondRubricAnnotations = annotations
    .filter((a) => !matchedAnnotationIds.has(a.id))
    .filter((a) => a.type !== 'accepted') // accepted annotations aren't "beyond"
    .map((a) => a.id);

  // Give provisional bonus based on quality indicators
  let tier3Bonus = 0;
  for (const annId of beyondRubricAnnotations) {
    const ann = annotations.find((a) => a.id === annId);
    if (!ann) continue;
    let quality = 0;
    if (ann.note && ann.note.length > 30) quality += 2;
    if (ann.evidence && ann.evidence.length > 0) quality += 3;
    tier3Bonus += Math.min(5, quality);
  }
  tier3Bonus = Math.min(20, tier3Bonus);

  // Step 5: Coverage
  const covered = new Set<number>();
  for (const ann of annotations) {
    for (let i = ann.locationStart; i < ann.locationEnd; i++) {
      covered.add(i);
    }
  }
  const coverageScore =
    textLength > 0 ? Math.round((covered.size / textLength) * 100) : 0;

  // Coverage modifier
  const coverageMultiplier = coverageScore < 40 ? 0.8 : 1;

  // Step 6: Composite
  const compositeRaw =
    Math.round((tier1Raw * coverageMultiplier + tier2Deductions + tier3Bonus) * 10) / 10;
  const normalizedFinal = Math.round(Math.max(0, Math.min(100, compositeRaw)) * 10) / 10;

  return {
    tier1Raw,
    tier2Deductions,
    tier3Bonus,
    coverageScore,
    compositeRaw,
    normalizedFinal,
    matches,
    missedItems,
    beyondRubricAnnotations,
  };
}
