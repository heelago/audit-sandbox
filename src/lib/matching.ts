interface AnnotationLike {
  id: string;
  type: string;
  locationStart: number;
  locationEnd: number;
  selectedText: string;
  note: string;
  evidence?: Array<{ id: string; type: string; content: string }>;
}

interface RubricItemLike {
  id: string;
  passSource: string;
  severity: string;
  category: string;
  locationStart: number;
  locationEnd: number;
  description: string;
  confirmed: boolean;
}

export interface MatchResult {
  annotationId: string;
  rubricItemId: string;
  matchConfidence: 'high' | 'medium' | 'low';
  matchQuality: number;
}

const STOPWORDS = new Set([
  'של', 'את', 'על', 'עם', 'הוא', 'היא', 'זה', 'לא',
  'כי', 'אם', 'גם', 'אבל', 'או', 'the', 'a', 'an', 'is', 'are', 'was',
  'in', 'on', 'at', 'to', 'for', 'of', 'and', 'but', 'or', 'not',
  'אני', 'הם', 'הן', 'אנחנו', 'שלי', 'אין', 'יש', 'זו', 'כל',
  'מה', 'מי', 'עוד', 'רק', 'כמו', 'בין', 'אחר', 'לפי', 'דרך',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sא-ת]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function keywordOverlap(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));
  const intersection = [...tokens1].filter((t) => tokens2.has(t));
  const union = new Set([...tokens1, ...tokens2]);
  return union.size > 0 ? intersection.length / union.size : 0;
}

function locationOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): number {
  const overlapStart = Math.max(aStart, bStart);
  const overlapEnd = Math.min(aEnd, bEnd);
  if (overlapStart >= overlapEnd) return 0;
  const overlapLen = overlapEnd - overlapStart;
  const totalLen = Math.max(aEnd - aStart, bEnd - bStart);
  return totalLen > 0 ? overlapLen / totalLen : 0;
}

// Annotation type → rubric category compatibility
const TYPE_ALIGNMENT: Record<string, string[]> = {
  error: ['unverifiable_statistic', 'imprecise_claim', 'misattribution', 'factual'],
  verified: ['factual', 'citation'],
  alternative: ['western_centric_framing', 'missing_mechanism', 'disciplinary'],
  gap: ['missing_perspective', 'missing_recent_data', 'gap'],
  nuance: ['western_centric_framing', 'missing_mechanism', 'disciplinary', 'oversimplification'],
  accepted: [],
};

export function matchAnnotationsToRubric(
  annotations: AnnotationLike[],
  rubricItems: RubricItemLike[]
): MatchResult[] {
  const matches: MatchResult[] = [];
  const confirmedItems = rubricItems.filter((r) => r.confirmed);

  for (const ann of annotations) {
    for (const rubric of confirmedItems) {
      const locOverlap = locationOverlap(
        ann.locationStart,
        ann.locationEnd,
        rubric.locationStart,
        rubric.locationEnd
      );

      const semanticSim = keywordOverlap(
        ann.note + ' ' + ann.selectedText,
        rubric.description
      );

      const typeAligned = TYPE_ALIGNMENT[ann.type]?.some(
        (cat) =>
          rubric.category.includes(cat) || rubric.passSource.includes(cat.split('_')[0])
      );

      // Determine if there's a match
      const hasLocationMatch = locOverlap > 0.3;
      const hasSemanticMatch = semanticSim > 0.15;

      if (!hasLocationMatch && !hasSemanticMatch) continue;

      // Determine confidence
      let matchConfidence: 'high' | 'medium' | 'low';
      if (locOverlap > 0.6 && semanticSim > 0.2) {
        matchConfidence = 'high';
      } else if (hasLocationMatch || hasSemanticMatch) {
        matchConfidence = 'medium';
      } else {
        matchConfidence = 'low';
      }

      // Calculate quality (0-10)
      let quality = 0;

      // Did they identify the right issue? (+3)
      if (typeAligned || semanticSim > 0.2) quality += 3;
      else if (semanticSim > 0.1) quality += 1.5;

      // Did they provide correct information? (+3)
      if (ann.note && ann.note.length > 30) quality += 2;
      if (ann.note && ann.note.length > 100) quality += 1;

      // Did they attach evidence? (+2)
      if (ann.evidence && ann.evidence.length > 0) quality += 2;

      // Is their reasoning sound? (+2) - approximated by note length and semantic match
      if (semanticSim > 0.25 && ann.note && ann.note.length > 50) quality += 2;
      else if (semanticSim > 0.15) quality += 1;

      matches.push({
        annotationId: ann.id,
        rubricItemId: rubric.id,
        matchConfidence,
        matchQuality: Math.min(10, quality),
      });
    }
  }

  // Deduplicate: each annotation matches at most one rubric item (best match)
  const bestByAnnotation = new Map<string, MatchResult>();
  for (const m of matches) {
    const existing = bestByAnnotation.get(m.annotationId);
    if (!existing || m.matchQuality > existing.matchQuality) {
      bestByAnnotation.set(m.annotationId, m);
    }
  }

  // Also ensure each rubric item is matched at most once (best match)
  const bestByRubric = new Map<string, MatchResult>();
  for (const m of bestByAnnotation.values()) {
    const existing = bestByRubric.get(m.rubricItemId);
    if (!existing || m.matchQuality > existing.matchQuality) {
      bestByRubric.set(m.rubricItemId, m);
    }
  }

  return Array.from(bestByRubric.values());
}
