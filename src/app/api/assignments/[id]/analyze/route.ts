import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getMockRubricItems } from '@/lib/mock-data';
import { demoWriteBlockedResponse, isDemoReadOnly } from '@/lib/demo-mode';
import { isGeminiModeEnabled, runMultiAgentAuditWithGemini } from '@/lib/ai/gemini';
import {
  detectPlantedSignalsInText,
  extractPlantedSignalIds,
} from '@/lib/ai/planted-signals';

type PlannedRubricItem = {
  passSource: string;
  severity: 'critical' | 'moderate' | 'minor';
  category: string;
  locationStart: number;
  locationEnd: number;
  description: string;
  idealResponse: string | null;
  flaggedText: string | null;
  confidence: number | null;
  confirmed: boolean;
};

type PlannedAgentRun = {
  agentId: string;
  agentName: string;
  summary: string;
  findingsCount: number;
  error: string | null;
};

type TextAnalysisPlan = {
  textId: string;
  items: PlannedRubricItem[];
  difficultyRating: number;
  rawQualityScore: number;
  report: {
    mode: string;
    summary: string;
    modelVersion: string | null;
    totals: {
      critical: number;
      moderate: number;
      minor: number;
    };
    errors: string[];
    agentRuns: PlannedAgentRun[];
  };
};

function normalizeSeverity(value: string): 'critical' | 'moderate' | 'minor' {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'critical' || normalized === 'moderate' || normalized === 'minor') {
    return normalized;
  }
  if (normalized === 'major' || normalized === 'high') return 'critical';
  if (normalized === 'low') return 'minor';
  return 'moderate';
}

function normalizeCategory(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_\-\u0590-\u05fe]/g, '')
    .slice(0, 64) || 'analysis';
}

function resolveRange(text: string, flaggedText: string | null): { start: number; end: number; quote: string | null } {
  if (flaggedText) {
    const direct = text.indexOf(flaggedText);
    if (direct !== -1) {
      return { start: direct, end: direct + flaggedText.length, quote: flaggedText };
    }

    const compactFlagged = flaggedText.replace(/\s+/g, ' ').trim();
    if (compactFlagged) {
      const compactSource = text.replace(/\s+/g, ' ');
      const compactIndex = compactSource.indexOf(compactFlagged);
      if (compactIndex !== -1) {
        const start = Math.max(0, compactIndex - 4);
        const end = Math.min(text.length, start + compactFlagged.length + 8);
        return {
          start,
          end,
          quote: text.slice(start, end),
        };
      }
    }
  }

  const fallbackStart = 0;
  const fallbackEnd = Math.min(text.length, 160);
  return {
    start: fallbackStart,
    end: fallbackEnd,
    quote: text.slice(fallbackStart, fallbackEnd),
  };
}

function toPlannedFromMock(textContent: string): PlannedRubricItem[] {
  return getMockRubricItems(textContent).map((item) => ({
    passSource: item.passSource,
    severity: normalizeSeverity(item.severity),
    category: item.category,
    locationStart: item.locationStart,
    locationEnd: item.locationEnd,
    description: item.description,
    idealResponse: item.idealResponse ?? null,
    flaggedText: item.flaggedText ?? null,
    confidence: null,
    confirmed: true,
  }));
}

function estimateScores(items: PlannedRubricItem[]): { difficultyRating: number; rawQualityScore: number } {
  const critical = items.filter((item) => item.severity === 'critical').length;
  const moderate = items.filter((item) => item.severity === 'moderate').length;
  const minor = items.filter((item) => item.severity === 'minor').length;
  const difficultyRating = Number(
    Math.min(10, 4.2 + critical * 1.25 + moderate * 0.7 + minor * 0.25).toFixed(1)
  );
  const rawQualityScore = Number(
    Math.max(25, 92 - critical * 12 - moderate * 7 - minor * 3).toFixed(1)
  );
  return { difficultyRating, rawQualityScore };
}

function parseAnalyzeBody(body: unknown): {
  textIds: string[] | null;
  forceReanalyze: boolean;
  customAgents: unknown;
  maxFindingsPerAgent: number | null;
} {
  if (!body || typeof body !== 'object') {
    return {
      textIds: null,
      forceReanalyze: false,
      customAgents: undefined,
      maxFindingsPerAgent: null,
    };
  }
  const payload = body as Record<string, unknown>;
  const textIds = Array.isArray(payload.textIds)
    ? payload.textIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : null;

  return {
    textIds: textIds && textIds.length > 0 ? textIds : null,
    forceReanalyze: payload.forceReanalyze === true,
    customAgents: payload.agentTemplates,
    maxFindingsPerAgent:
      typeof payload.maxFindingsPerAgent === 'number' && Number.isFinite(payload.maxFindingsPerAgent)
        ? Math.max(1, Math.min(12, Math.round(payload.maxFindingsPerAgent)))
        : null,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (isDemoReadOnly()) {
    return demoWriteBlockedResponse();
  }

  const { id } = await params;

  const assignment = await prisma.assignment.findFirst({
    where: {
      id,
      instructorCode: session.code,
    },
    include: { texts: { include: { rubricItems: true } } },
  });

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
  }

  if (assignment.texts.length === 0) {
    return NextResponse.json({ error: 'No texts to analyze' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const parsedBody = parseAnalyzeBody(body);

  const selectedTexts = parsedBody.textIds
    ? assignment.texts.filter((text) => parsedBody.textIds?.includes(text.id))
    : assignment.texts;
  if (selectedTexts.length === 0) {
    return NextResponse.json({ error: 'No matching texts found for analysis.' }, { status: 400 });
  }

  const textsToProcess = parsedBody.forceReanalyze
    ? selectedTexts
    : selectedTexts.filter((text) => text.rubricItems.length === 0);
  if (textsToProcess.length === 0) {
    return NextResponse.json({
      success: true,
      rubricItemsCreated: 0,
      analyzedTexts: 0,
      skipped: selectedTexts.length,
      note: 'All selected texts already have rubric items. Pass forceReanalyze=true to rerun.',
    });
  }

  const geminiEnabled = isGeminiModeEnabled();
  console.info('[analyze] start', {
    assignmentId: id,
    geminiEnabled,
    selectedTexts: selectedTexts.length,
    textsToProcess: textsToProcess.length,
    forceReanalyze: parsedBody.forceReanalyze,
  });
  const plans: TextAnalysisPlan[] = [];
  for (const text of textsToProcess) {
    if (geminiEnabled) {
      const result = await runMultiAgentAuditWithGemini({
        assignmentTitle: assignment.title,
        promptText: assignment.promptText,
        courseContext: assignment.courseContext,
        requirements: assignment.requirements,
        knownPitfalls: assignment.knownPitfalls,
        referenceMaterial: assignment.referenceMaterial,
        sectionBlueprint: assignment.sectionBlueprint,
        evaluationCriteria: assignment.evaluationCriteria,
        exemplarNotes: assignment.exemplarNotes,
        textContent: text.textContent,
        customAgents: parsedBody.customAgents,
        maxFindingsPerAgent: parsedBody.maxFindingsPerAgent ?? undefined,
      });

      const agentItems = result.findings.map((finding) => {
        const range = resolveRange(text.textContent, finding.flaggedText);
        return {
          passSource: finding.passSource,
          severity: finding.severity,
          category: normalizeCategory(finding.category),
          locationStart: range.start,
          locationEnd: range.end,
          description: finding.description,
          idealResponse: finding.idealResponse,
          flaggedText: finding.flaggedText ?? range.quote,
          confidence: finding.confidence,
          confirmed: true,
        } satisfies PlannedRubricItem;
      });

      if (agentItems.length === 0) {
        const plantedSignals = extractPlantedSignalIds(assignment.knownPitfalls);
        const heuristicDetections = detectPlantedSignalsInText(text.textContent, plantedSignals);

        if (heuristicDetections.length > 0) {
          for (const detection of heuristicDetections) {
            agentItems.push({
              passSource: 'system:planted_signal_heuristic',
              severity: detection.severity,
              category: normalizeCategory(detection.category),
              locationStart: detection.start,
              locationEnd: detection.end,
              description: detection.description,
              idealResponse: `יש לאמת ולהסביר מדוע "${detection.label}" פוגע באיכות התוכן.`,
              flaggedText: detection.quote,
              confidence: 0.25,
              confirmed: true,
            });
          }
          result.errors.push(
            'Gemini returned no findings; inserted planted-signal heuristic findings.'
          );
        } else {
          // Avoid blocking instructors when models return empty findings after a long run.
          const fallbackRangeEnd = Math.min(text.textContent.length, 180);
          agentItems.push({
            passSource: 'system:manual_review',
            severity: 'moderate',
            category: 'manual_review_required',
            locationStart: 0,
            locationEnd: fallbackRangeEnd,
            description: 'לא התקבלו ממצאים אוטומטיים. נדרש מעבר ידני של המרצה על הטקסט.',
            idealResponse: 'זיהוי לפחות נקודות בדיקה מרכזיות מול דרישות המטלה והמקורות.',
            flaggedText: text.textContent.slice(0, fallbackRangeEnd),
            confidence: 0,
            confirmed: true,
          });
          result.errors.push('Gemini returned no findings; inserted manual-review placeholder finding.');
        }
      }

      const scoreEstimate = estimateScores(agentItems);
      plans.push({
        textId: text.id,
        items: agentItems,
        difficultyRating: scoreEstimate.difficultyRating,
        rawQualityScore: scoreEstimate.rawQualityScore,
        report: {
          mode: 'gemini',
          summary: result.summary,
          modelVersion: result.model,
          agentRuns: result.agentRuns.map((run) => ({
            agentId: run.agentId,
            agentName: run.agentName,
            summary: run.summary,
            findingsCount: run.findings.length,
            error: run.error,
          })),
          totals: result.totals,
          errors: result.errors,
        },
      });
      continue;
    }

    const items = toPlannedFromMock(text.textContent);
    const scoreEstimate = estimateScores(items);
    plans.push({
      textId: text.id,
      items,
      difficultyRating: scoreEstimate.difficultyRating,
      rawQualityScore: scoreEstimate.rawQualityScore,
      report: {
        mode: 'mock-fallback',
        summary: 'Gemini not configured. Used mock rubric pass.',
        modelVersion: null,
        totals: {
          critical: items.filter((item) => item.severity === 'critical').length,
          moderate: items.filter((item) => item.severity === 'moderate').length,
          minor: items.filter((item) => item.severity === 'minor').length,
        },
        errors: [],
        agentRuns: [],
      },
    });
  }

  let totalItems = 0;
  const createdReportIds: string[] = [];
  await prisma.$transaction(async (tx) => {
    for (const plan of plans) {
      if (parsedBody.forceReanalyze) {
        await tx.rubricItem.deleteMany({
          where: {
            textId: plan.textId,
            passSource: { not: 'professor' },
          },
        });
      }

      for (const item of plan.items) {
        await tx.rubricItem.create({
          data: {
            textId: plan.textId,
            passSource: item.passSource,
            severity: item.severity,
            category: item.category,
            locationStart: item.locationStart,
            locationEnd: item.locationEnd,
            description: item.description,
            idealResponse: item.idealResponse,
            flaggedText: item.flaggedText,
            confirmed: item.confirmed,
          },
        });
        totalItems += 1;
      }

      const report = await tx.agentAnalysisReport.create({
        data: {
          assignmentId: id,
          textId: plan.textId,
          mode: plan.report.mode,
          modelVersion: plan.report.modelVersion,
          summary: plan.report.summary,
          findingsCount: plan.items.length,
          totalsCritical: plan.report.totals.critical,
          totalsModerate: plan.report.totals.moderate,
          totalsMinor: plan.report.totals.minor,
          errorCount: plan.report.errors.length,
        },
      });
      createdReportIds.push(report.id);

      if (plan.report.agentRuns.length > 0) {
        await tx.agentAnalysisAgentRun.createMany({
          data: plan.report.agentRuns.map((run) => ({
            reportId: report.id,
            agentId: run.agentId,
            agentName: run.agentName,
            summary: run.summary,
            findingsCount: run.findingsCount,
            error: run.error,
          })),
        });
      }

      if (plan.items.length > 0) {
        await tx.agentAnalysisFinding.createMany({
          data: plan.items.map((item) => ({
            reportId: report.id,
            passSource: item.passSource,
            severity: item.severity,
            category: item.category,
            description: item.description,
            idealResponse: item.idealResponse,
            flaggedText: item.flaggedText,
            confidence: item.confidence,
            locationStart: item.locationStart,
            locationEnd: item.locationEnd,
          })),
        });
      }

      await tx.generatedText.update({
        where: { id: plan.textId },
        data: {
          status: 'analyzed',
          difficultyRating: plan.difficultyRating,
          rawQualityScore: plan.rawQualityScore,
        },
      });
    }

    await tx.assignment.update({
      where: { id },
      data: { status: 'calibrating' },
    });

    await tx.calibrationLog.create({
      data: {
        assignmentId: id,
        action: 'agent_analysis_report',
        notes: `structured_reports_created:${createdReportIds.length}; mode:${geminiEnabled ? 'gemini-strict' : 'mock-fallback'}; texts:${plans.length}; items:${totalItems}`,
      },
    });
  });

  console.info('[analyze] complete', {
    assignmentId: id,
    reports: createdReportIds.length,
    totalItems,
    mode: geminiEnabled ? 'gemini-strict' : 'mock-fallback',
  });

  return NextResponse.json({
    success: true,
    rubricItemsCreated: totalItems,
    analyzedTexts: plans.length,
    analysisMode: geminiEnabled ? 'gemini-strict' : 'mock-fallback',
    reportIds: createdReportIds,
    reports: plans.map((plan) => ({
      textId: plan.textId,
      findings: plan.items.length,
      mode: plan.report.mode ?? 'unknown',
    })),
  });
}
