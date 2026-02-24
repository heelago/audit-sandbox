export type PlantedSignalId =
  | 'empty_fluent_paragraph'
  | 'overconfident_unsourced_claim'
  | 'causal_leap'
  | 'overgeneralization'
  | 'concept_blur'
  | 'anachronism_or_timeline_mix'
  | 'invented_or_unverifiable_citation'
  | 'western_centric_framing'
  | 'methodology_ethics_omission'
  | 'wellness_drift_in_critical_theory'
  | 'legal_case_hallucination';

export type PlantedSignalSeverity = 'critical' | 'moderate' | 'minor';

export type PlantedSignalDefinition = {
  id: PlantedSignalId;
  label: string;
  generationHint: string;
  auditHint: string;
  category: string;
  defaultSeverity: PlantedSignalSeverity;
  cues: RegExp[];
};

export type DisciplinePresetId =
  | 'general_academic'
  | 'anthropology_qualitative'
  | 'ancient_medicine_history'
  | 'critical_theory_philosophy'
  | 'law_case_method'
  | 'medical_clinical_reasoning';

export type PlantedSignalPreset = {
  id: DisciplinePresetId;
  label: string;
  description: string;
  signalIds: PlantedSignalId[];
};

export type PresetSuggestionResult = {
  presetId: DisciplinePresetId;
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
};

export const PLANTED_SIGNALS_BLOCK_START = '[PLANTED_SIGNALS]';
export const PLANTED_SIGNALS_BLOCK_END = '[/PLANTED_SIGNALS]';

export const PLANTED_SIGNAL_LIBRARY: PlantedSignalDefinition[] = [
  {
    id: 'empty_fluent_paragraph',
    label: 'פסקה רהוטה אך חלולה',
    generationHint:
      'שלב/י לפחות פסקה אחת שנשמעת אקדמית ומשכנעת אך כמעט אינה מוסיפה טענה, ראיה או ניתוח חדש.',
    auditHint:
      'חפש/י פסקאות ארוכות עם ניסוח גבוה אך מעט מאוד תוכן בדיק, טענה מדויקת או עיגון במקור.',
    category: 'aiism_empty_fluent_paragraph',
    defaultSeverity: 'moderate',
    cues: [
      /(לסיכום|באופן כללי|ניכר כי|חשוב לציין|מנקודת מבט רחבה|ניתן לומר)/g,
      /(במובנים רבים|באופן עמוק|בצורה משמעותית)/g,
    ],
  },
  {
    id: 'overconfident_unsourced_claim',
    label: 'ביטחון יתר ללא ביסוס',
    generationHint:
      'שלב/י לפחות טענה נחרצת מאוד (ודאית) ללא מקור, ראיה או הסתייגות מספקת.',
    auditHint:
      'אתר/י ניסוחים ודאיים מדי ללא ציטוט, מקור ברור, נתון ניתן לאימות או הסתייגות מתודולוגית.',
    category: 'aiism_overconfident_unsourced_claim',
    defaultSeverity: 'critical',
    cues: [/(אין ספק|ללא ספק|ברור ש|חד[- ]?משמעית|מוכח כי|בוודאות)/g],
  },
  {
    id: 'causal_leap',
    label: 'קפיצה מקורלציה לסיבתיות',
    generationHint:
      'שלב/י לפחות נקודה אחת שבה מוצגת סיבתיות ישירה למרות שהביסוס בפועל מתאר לכל היותר קשר או מתאם.',
    auditHint:
      'בדוק/י אם הטקסט מציג סיבתיות חזקה בלי ניסוי, מנגנון, או עיצוב מחקרי שמצדיק זאת.',
    category: 'logic_causal_leap',
    defaultSeverity: 'critical',
    cues: [/(מכאן ש|ולכן ברור כי|גורם ישיר|מוכיח ש|כתוצאה ישירה)/g],
  },
  {
    id: 'overgeneralization',
    label: 'הכללה גורפת',
    generationHint:
      'שלב/י הכללה רחבה מדי מתופעה נקודתית (למשל מעבר ממקרה אחד ל"כל" המקרים).',
    auditHint:
      'חפש/י מעבר לא מוצדק ממקרה ספציפי לטענה אוניברסלית.',
    category: 'disciplinary_overgeneralization',
    defaultSeverity: 'moderate',
    cues: [/(תמיד|לעולם|בכל המקרים|כל החברות|כלל האנשים|באופן אוניברסלי)/g],
  },
  {
    id: 'concept_blur',
    label: 'טשטוש מושגים',
    generationHint:
      'שלב/י בלבול עדין בין מושגים קרובים אך לא זהים, בלי לסמן שמדובר בהכללה.',
    auditHint:
      'אתר/י מקרים שבהם מושגים מובחנים מוצגים כשקולים, או שימוש לא עקבי במונחים מרכזיים.',
    category: 'disciplinary_concept_blur',
    defaultSeverity: 'moderate',
    cues: [/(זהה ל|אותו דבר כמו|ללא הבדל בין|במילים אחרות בדיוק)/g],
  },
  {
    id: 'anachronism_or_timeline_mix',
    label: 'ערבוב צירי זמן',
    generationHint:
      'שלב/י אנכרוניזם או ערבוב תקופות/אסכולות כך שהטיעון יישמע עקבי לשונית אך יהיה בעייתי היסטורית.',
    auditHint:
      'בדוק/י אם הטקסט מערבב תקופות, מחברים או אסכולות שלא יכלו להופיע יחד בציר הזמן.',
    category: 'chronology_anachronism',
    defaultSeverity: 'critical',
    cues: [/(במאה ה-?\d+.*לפנה["׳]?ס.*המאה ה-?\d+ לספירה|היפוקרטי.*גלנוס|גלנוס.*היפוקרטי)/g],
  },
  {
    id: 'invented_or_unverifiable_citation',
    label: 'מקור לא ניתן לאימות',
    generationHint:
      'שלב/י הפניה שנשמעת סמכותית אך קשה לאימות (שם מקור עמום, ציטוט חלקי, או ייחוס לא ברור).',
    auditHint:
      'בדוק/י אם ההפניות כוללות פרטים מלאים, ניתנות לאיתור, ומתאימות בפועל לטענה המצוטטת.',
    category: 'citation_unverifiable_source',
    defaultSeverity: 'critical',
    cues: [
      /(ראו למשל|מחקר מראה ש|על פי המאמר|לפי כתב העת)/g,
      /(Smith v\\.|Journal of|pp\\.|doi:)/gi,
    ],
  },
  {
    id: 'western_centric_framing',
    label: 'מסגור מערבי-צנטרי',
    generationHint:
      'שלב/י ניסוח שמציג מסגרת מערבית כברירת מחדל אוניברסלית, במיוחד בהשוואות בין תרבויות.',
    auditHint:
      'בדוק/י אם ההסבר מניח שהקשר מערבי הוא "הנורמה" ומקטין מורכבות של הקשרים תרבותיים אחרים.',
    category: 'disciplinary_western_centric_framing',
    defaultSeverity: 'moderate',
    cues: [/(פרימיטיבי|מסורתי לעומת מתקדם|אוניברסלי מטבעו|כמקובל במערב)/g],
  },
  {
    id: 'methodology_ethics_omission',
    label: 'השמטת מתודולוגיה/אתיקה',
    generationHint:
      'השמט/י דיון במגבלות מתודולוגיות או באתיקה מחקרית גם כאשר הן קריטיות להבנת הטענה.',
    auditHint:
      'בדוק/י אם הטקסט מדלג על אתיקה מחקרית, מגבלות דגימה, או תנאי ייצור הידע.',
    category: 'methodology_ethics_gap',
    defaultSeverity: 'moderate',
    cues: [/(מדגם|תצפית משתתפת|אתיקה|הטיה|קולוניאל|שיקולי מחקר)/g],
  },
  {
    id: 'wellness_drift_in_critical_theory',
    label: 'גלישה לשיח טיפולי בתיאוריה ביקורתית',
    generationHint:
      'במסגרת טקסט ביקורתי-פילוסופי, גלוש/י לפתרונות אישיים של Well-being במקום ניתוח מבני-חברתי.',
    auditHint:
      'חפש/י מעבר משיח כוח/מבנה לשיח של "ניהול עצמי" ו-Wellness כאילו זו נקודת הסיום של הטיעון.',
    category: 'critical_theory_wellness_drift',
    defaultSeverity: 'moderate',
    cues: [/(wellness|רווחה אישית|ניהול סטרס|איזון חיים|התפתחות אישית)/gi],
  },
  {
    id: 'legal_case_hallucination',
    label: 'תקדים משפטי מפוברק/מעוות',
    generationHint:
      'בכתיבה משפטית, שלב/י אזכור פסיקה שנשמעת תקינה פורמלית אך לא ניתנת לאימות מלא או מותאמת בכוח למסקנה.',
    auditHint:
      'אמת/י תקדימים, מספרי תיקים וציטוטים; בדוק/י התאמה אמיתית בין ההלכה המוזכרת לבין המסקנה בטקסט.',
    category: 'law_hallucinated_case_law',
    defaultSeverity: 'critical',
    cues: [/(v\.\s?[A-Z][a-z]+|F\.\s?Supp\.|U\.S\.|No\.\s?\d{2,}|Montreal Convention)/g],
  },
];

export const PLANTED_SIGNAL_PRESETS: PlantedSignalPreset[] = [
  {
    id: 'general_academic',
    label: 'אקדמי כללי',
    description: 'סט ברירת מחדל מאוזן כמעט לכל מטלה עיונית.',
    signalIds: [
      'empty_fluent_paragraph',
      'overconfident_unsourced_claim',
      'causal_leap',
      'invented_or_unverifiable_citation',
    ],
  },
  {
    id: 'anthropology_qualitative',
    label: 'אנתרופולוגיה איכותנית',
    description: 'דגש על מסגור תרבותי, אתיקה ומורכבות דיסציפלינרית.',
    signalIds: [
      'western_centric_framing',
      'overgeneralization',
      'methodology_ethics_omission',
      'empty_fluent_paragraph',
    ],
  },
  {
    id: 'ancient_medicine_history',
    label: 'היסטוריה של הרפואה העתיקה',
    description: 'דגש על אנכרוניזם, ערבוב תקופות, ואמינות מקורות.',
    signalIds: [
      'anachronism_or_timeline_mix',
      'concept_blur',
      'invented_or_unverifiable_citation',
      'overconfident_unsourced_claim',
    ],
  },
  {
    id: 'critical_theory_philosophy',
    label: 'פילוסופיה ותיאוריה ביקורתית',
    description: 'דגש על היסט מביקורת מבנית לשיח טיפולי-אישי.',
    signalIds: [
      'wellness_drift_in_critical_theory',
      'concept_blur',
      'empty_fluent_paragraph',
      'causal_leap',
    ],
  },
  {
    id: 'law_case_method',
    label: 'משפטים (Case Method)',
    description: 'דגש על ציטוטים משפטיים, תקדימים ויישום הלכה.',
    signalIds: [
      'legal_case_hallucination',
      'invented_or_unverifiable_citation',
      'overconfident_unsourced_claim',
      'causal_leap',
    ],
  },
  {
    id: 'medical_clinical_reasoning',
    label: 'רפואה/חשיבה קלינית',
    description: 'דגש על קפיצות סיבתיות, הכללות, וביטחון יתר.',
    signalIds: [
      'causal_leap',
      'overgeneralization',
      'overconfident_unsourced_claim',
      'concept_blur',
    ],
  },
];

const PRESET_KEYWORDS: Record<DisciplinePresetId, string[]> = {
  general_academic: ['מטלה', 'analysis', 'essay', 'אקדמי'],
  anthropology_qualitative: [
    'אנתרופולוג',
    'טקס',
    'לימינל',
    'אתנוגרפ',
    'תצפית משתתפת',
    'תרבות',
    'קהילה',
    'rites of passage',
  ],
  ancient_medicine_history: [
    'יוון',
    'היפוקרט',
    'גלנוס',
    'רפואה עתיקה',
    'רחם נודד',
    'כבד',
    'לב',
    'מיתולוגיה',
    'antiquity',
  ],
  critical_theory_philosophy: [
    'פוקו',
    'האן',
    'byung',
    'burnout',
    'חברת המשמעת',
    'חברת ההישגיות',
    'ניצול עצמי',
    'שחיקה',
    'תיאוריה ביקורתית',
  ],
  law_case_method: [
    'תזכיר משפטי',
    'משפט',
    'תקדים',
    'פסק דין',
    'irac',
    'אמנת מונטריאול',
    'case law',
    'federal',
    'lexis',
    'avianca',
  ],
  medical_clinical_reasoning: [
    'רפואה',
    'קליני',
    'אבחנה',
    'diagnosis',
    'מטופל',
    'פתופיזיולוג',
    'פרוגנוז',
    'טיפול',
  ],
};

function normalizedTextForSuggestion(parts: Array<string | null | undefined>): string {
  return parts
    .filter((part): part is string => typeof part === 'string')
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function suggestPlantedSignalPreset(input: {
  title?: string | null;
  courseContext?: string | null;
  task?: string | null;
  requirements?: string | null;
  sectionBlueprint?: string | null;
  referenceMaterial?: string | null;
}): PresetSuggestionResult {
  const corpus = normalizedTextForSuggestion([
    input.title,
    input.courseContext,
    input.task,
    input.requirements,
    input.sectionBlueprint,
    input.referenceMaterial,
  ]);

  if (!corpus) {
    return {
      presetId: 'general_academic',
      confidence: 'low',
      matchedKeywords: [],
    };
  }

  const candidates = (Object.keys(PRESET_KEYWORDS) as DisciplinePresetId[])
    .filter((id) => id !== 'general_academic')
    .map((id) => {
      const matched = PRESET_KEYWORDS[id].filter((keyword) => corpus.includes(keyword.toLowerCase()));
      return { id, matched, score: matched.length };
    })
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  if (!best || best.score <= 0) {
    return {
      presetId: 'general_academic',
      confidence: 'low',
      matchedKeywords: [],
    };
  }

  return {
    presetId: best.id,
    confidence: best.score >= 3 ? 'high' : best.score === 2 ? 'medium' : 'low',
    matchedKeywords: best.matched.slice(0, 4),
  };
}

const SIGNAL_BY_ID = new Map<PlantedSignalId, PlantedSignalDefinition>(
  PLANTED_SIGNAL_LIBRARY.map((signal) => [signal.id, signal])
);

function dedupeIds(ids: string[]): PlantedSignalId[] {
  const out: PlantedSignalId[] = [];
  const seen = new Set<PlantedSignalId>();
  for (const raw of ids) {
    const id = raw.trim().toLowerCase() as PlantedSignalId;
    if (!SIGNAL_BY_ID.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function getPlantedSignalById(id: PlantedSignalId): PlantedSignalDefinition {
  return SIGNAL_BY_ID.get(id)!;
}

export function getPlantedSignalPresetById(
  id: DisciplinePresetId
): PlantedSignalPreset | null {
  return PLANTED_SIGNAL_PRESETS.find((preset) => preset.id === id) ?? null;
}

export function extractPlantedSignalIds(raw: string | null | undefined): PlantedSignalId[] {
  if (!raw) return [];
  const text = raw.trim();
  if (!text) return [];

  const blockRegex = new RegExp(
    `${PLANTED_SIGNALS_BLOCK_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${PLANTED_SIGNALS_BLOCK_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'i'
  );
  const blockMatch = text.match(blockRegex);
  if (!blockMatch?.[1]) return [];

  const fromLines = blockMatch[1]
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/)[0] ?? line);
  return dedupeIds(fromLines);
}

export function stripPlantedSignalsBlock(raw: string | null | undefined): string {
  if (!raw) return '';
  const blockRegex = new RegExp(
    `\\n?${PLANTED_SIGNALS_BLOCK_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${PLANTED_SIGNALS_BLOCK_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`,
    'gi'
  );
  return raw.replace(blockRegex, '').trim();
}

export function buildPlantedSignalsBlock(ids: PlantedSignalId[]): string {
  if (ids.length === 0) return '';
  const lines = ids.map((id) => `- ${id}`);
  return [PLANTED_SIGNALS_BLOCK_START, ...lines, PLANTED_SIGNALS_BLOCK_END].join('\n');
}

export function upsertPlantedSignalBlock(
  raw: string | null | undefined,
  ids: PlantedSignalId[]
): string {
  const base = stripPlantedSignalsBlock(raw);
  const block = buildPlantedSignalsBlock(ids);
  if (!block) return base;
  return base ? `${base}\n\n${block}` : block;
}

export function summarizePlantedSignalHints(
  ids: PlantedSignalId[],
  mode: 'generation' | 'audit'
): string[] {
  return ids
    .map((id) => SIGNAL_BY_ID.get(id))
    .filter((signal): signal is PlantedSignalDefinition => Boolean(signal))
    .map((signal) => (mode === 'generation' ? signal.generationHint : signal.auditHint));
}

export type PlantedSignalDetection = {
  id: PlantedSignalId;
  label: string;
  category: string;
  severity: PlantedSignalSeverity;
  start: number;
  end: number;
  quote: string;
  description: string;
};

export function detectPlantedSignalsInText(
  text: string,
  ids: PlantedSignalId[]
): PlantedSignalDetection[] {
  if (!text.trim() || ids.length === 0) return [];
  const detections: PlantedSignalDetection[] = [];

  for (const id of ids) {
    const signal = SIGNAL_BY_ID.get(id);
    if (!signal) continue;

    let found: { index: number; matchText: string } | null = null;
    for (const cue of signal.cues) {
      const regex = new RegExp(cue.source, cue.flags);
      const match = regex.exec(text);
      if (match && typeof match.index === 'number') {
        found = {
          index: match.index,
          matchText: match[0],
        };
        break;
      }
    }

    // If no direct cue was found, still create a weak heuristic anchor near start.
    const start = found ? found.index : 0;
    const end = Math.min(
      text.length,
      found ? found.index + Math.max(found.matchText.length, 120) : 180
    );
    const quote = text.slice(start, end).trim() || text.slice(0, Math.min(text.length, 180)).trim();

    detections.push({
      id,
      label: signal.label,
      category: signal.category,
      severity: signal.defaultSeverity,
      start,
      end,
      quote,
      description: `זוהה אות כשל אפשרי: ${signal.label}. ${signal.auditHint}`,
    });
  }

  return detections;
}
