import { isTruthy } from '@/lib/demo-mode';
import { sanitizePromptPayload } from '@/lib/security';
import { countWords } from '@/lib/utils';
import {
  AUDIT_SYSTEM_INSTRUCTION,
  buildAuditUserPrompt,
  buildGenerationUserPrompt,
  buildRescueAuditUserPrompt,
  DEFAULT_AUDIT_AGENTS_CONFIG,
  GENERATION_SYSTEM_INSTRUCTION,
  RESCUE_AUDIT_SYSTEM_INSTRUCTION,
  SUPPLEMENTARY_AUDIT_AGENT,
} from '@/lib/ai/prompt-config';

const GEMINI_API_BASE = process.env.GEMINI_API_BASE_URL?.trim() || 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_GENERATION_MODEL = 'gemini-3-pro-preview';
const DEFAULT_AUDIT_MODEL = 'gemini-3-pro-preview';
const DEFAULT_MAX_FINDINGS_PER_AGENT = 5;
const MAX_CUSTOM_AGENTS = 8;

export type FindingSeverity = 'critical' | 'moderate' | 'minor';

export interface AuditAgentTemplate {
  id: string;
  name: string;
  objective: string;
  instructions: string;
  categories: string[];
}

export interface AgentFinding {
  severity: FindingSeverity;
  category: string;
  description: string;
  idealResponse: string | null;
  flaggedText: string | null;
  confidence: number | null;
  passSource: string;
}

export interface AgentRunResult {
  agentId: string;
  agentName: string;
  summary: string;
  findings: AgentFinding[];
  error: string | null;
}

export interface MultiAgentAuditResult {
  model: string;
  summary: string;
  findings: AgentFinding[];
  agentRuns: AgentRunResult[];
  totals: {
    critical: number;
    moderate: number;
    minor: number;
  };
  errors: string[];
}

export type PlantedFinding = {
  signalId: string;
  severity: FindingSeverity;
  category: string;
  flaggedText: string;
  description: string;
  idealResponse: string | null;
};

// --- Inline <flaw> tag extraction ---

type ExtractedFlawTag = {
  id: string;
  type: string;       // signalId from tag attribute
  severity: string;
  flaggedText: string; // inner content of the tag
};

type FlawExtractionResult = {
  cleanText: string;
  flaws: ExtractedFlawTag[];
};

function extractFlawTags(rawText: string): FlawExtractionResult {
  const flaws: ExtractedFlawTag[] = [];
  const regex = /<flaw\s+(?:id="([^"]+)"\s+)?type="([^"]+)"\s+severity="([^"]+)">([\s\S]*?)<\/flaw>/g;

  let match;
  let autoIndex = 0;
  while ((match = regex.exec(rawText)) !== null) {
    flaws.push({
      id: match[1] ?? `auto_${autoIndex++}`,
      type: match[2],
      severity: match[3],
      flaggedText: match[4].trim(),
    });
  }

  // Strip all <flaw> tags, keeping inner content
  const cleanText = rawText
    .replace(/<flaw\s+[^>]*>/g, '')
    .replace(/<\/flaw>/g, '')
    .trim();

  return { cleanText, flaws };
}

function convertPlantedFindingsToAgentFindings(
  plantedFindings: PlantedFinding[]
): AgentFinding[] {
  return plantedFindings.map((f) => ({
    severity: f.severity,
    category: f.category,
    description: f.description,
    idealResponse: f.idealResponse,
    flaggedText: f.flaggedText,
    confidence: 0.95,
    passSource: 'generation:planted',
  }));
}

function formatPlantedFindingsSummary(findings: PlantedFinding[]): string {
  return findings
    .map(
      (f, i) =>
        `${i + 1}. [${f.severity}] "${f.flaggedText}" — ${f.description}`
    )
    .join('\n');
}

export interface AssignmentGenerationInput {
  assignmentTitle: string;
  promptText: string;
  courseContext: string | null;
  requirements: string | null;
  knownPitfalls: string | null;
  referenceMaterial: string | null;
  sectionBlueprint: string | null;
  evaluationCriteria: string | null;
  exemplarNotes: string | null;
  generationStrategy: 'natural' | 'balanced_errors' | 'strict_truth';
  studentCode: string;
}

export interface GeneratedAssignmentText {
  textContent: string;
  wordCount: number;
  meta: Record<string, unknown>;
}

export class GeminiApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'GeminiApiError';
    this.status = status;
  }
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function extractJsonString(rawText: string): string | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return trimmed;
  }

  const firstCurly = trimmed.indexOf('{');
  const lastCurly = trimmed.lastIndexOf('}');
  if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
    return trimmed.slice(firstCurly, lastCurly + 1);
  }

  return null;
}

function parseJsonFromModel<T>(rawText: string): T | null {
  const jsonString = extractJsonString(rawText);
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

function decodeEscapedJsonString(value: string): string {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

function extractTextFieldWithRegex(rawText: string): string | null {
  const match = rawText.match(/"text"\s*:\s*"((?:\\.|[\s\S])*?)"/);
  if (!match?.[1]) return null;
  const decoded = decodeEscapedJsonString(match[1]).trim();
  return decoded || null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeSeverity(value: unknown): FindingSeverity {
  if (typeof value !== 'string') return 'moderate';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'critical' || normalized === 'moderate' || normalized === 'minor') {
    return normalized;
  }
  if (normalized === 'high' || normalized === 'major') return 'critical';
  if (normalized === 'low') return 'minor';
  return 'moderate';
}

function normalizeConfidence(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function severityWeight(severity: FindingSeverity): number {
  if (severity === 'critical') return 3;
  if (severity === 'moderate') return 2;
  return 1;
}

function dedupeFindings(findings: AgentFinding[]): AgentFinding[] {
  const map = new Map<string, AgentFinding>();
  for (const finding of findings) {
    const key = `${finding.category.toLowerCase()}::${(finding.flaggedText ?? finding.description).slice(0, 160).toLowerCase()}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, finding);
      continue;
    }
    const existingScore = severityWeight(existing.severity) + (existing.confidence ?? 0);
    const nextScore = severityWeight(finding.severity) + (finding.confidence ?? 0);
    if (nextScore > existingScore) {
      map.set(key, finding);
    }
  }
  return [...map.values()].sort((a, b) => {
    const severityDelta = severityWeight(b.severity) - severityWeight(a.severity);
    if (severityDelta !== 0) return severityDelta;
    return (b.confidence ?? 0) - (a.confidence ?? 0);
  });
}

function getGeminiApiKey(): string | null {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_API_KEY,
  ];
  for (const key of candidates) {
    if (key && key.trim()) return key.trim();
  }
  return null;
}

function buildGeminiUrl(model: string, apiKey: string): string {
  return `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;
}

function errorMessageFromGeminiPayload(payload: unknown): string | null {
  const top = asObject(payload);
  const error = asObject(top?.error);
  if (!error) return null;
  const message = toNonEmptyString(error.message);
  return message ?? null;
}

async function callGeminiText(params: {
  model: string;
  systemInstruction: string;
  userPrompt: string;
  temperature: number;
  maxOutputTokens: number;
}): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new GeminiApiError('Missing GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY).', 500);
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), 90_000);

  try {
    const response = await fetch(buildGeminiUrl(params.model, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: params.systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: params.userPrompt }],
          },
        ],
        generationConfig: {
          temperature: params.temperature,
          maxOutputTokens: params.maxOutputTokens,
          responseMimeType: 'application/json',
        },
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as unknown;
    if (!response.ok) {
      const geminiError = errorMessageFromGeminiPayload(payload) ?? `Gemini request failed with status ${response.status}.`;
      throw new GeminiApiError(geminiError, response.status);
    }

    const parsed = asObject(payload);
    const candidates = Array.isArray(parsed?.candidates) ? parsed.candidates : [];
    const firstCandidate = asObject(candidates[0]);
    const content = asObject(firstCandidate?.content);
    const parts = Array.isArray(content?.parts) ? content.parts : [];
    const textParts = parts
      .map((part) => toNonEmptyString(asObject(part)?.text))
      .filter((value): value is string => Boolean(value));
    const combined = textParts.join('\n').trim();
    if (!combined) {
      throw new GeminiApiError('Gemini returned an empty response body.', 502);
    }
    return combined;
  } catch (error) {
    if (error instanceof GeminiApiError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown Gemini request failure.';
    throw new GeminiApiError(message, 502);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export function isGeminiModeEnabled(): boolean {
  return getGeminiGenerationAvailability().enabled;
}

export function getGeminiGenerationAvailability(): { enabled: boolean; reason: string | null } {
  if (isTruthy(process.env.USE_MOCK_AI)) {
    return {
      enabled: false,
      reason: 'USE_MOCK_AI is enabled.',
    };
  }
  if (!getGeminiApiKey()) {
    return {
      enabled: false,
      reason: 'Missing GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY).',
    };
  }
  return { enabled: true, reason: null };
}

export function getGeminiGenerationModel(): string {
  return process.env.GEMINI_ASSIGNMENT_MODEL?.trim() || DEFAULT_GENERATION_MODEL;
}

export function getGeminiAuditModel(): string {
  return process.env.GEMINI_AUDIT_MODEL?.trim() || DEFAULT_AUDIT_MODEL;
}

export function getDefaultAuditAgents(): AuditAgentTemplate[] {
  return DEFAULT_AUDIT_AGENTS_CONFIG.map((agent) => ({
    ...agent,
    categories: [...agent.categories],
  }));
}

export function resolveAuditAgents(customAgents: unknown): AuditAgentTemplate[] {
  if (!Array.isArray(customAgents) || customAgents.length === 0) {
    return getDefaultAuditAgents();
  }

  const resolved: AuditAgentTemplate[] = [];
  for (const entry of customAgents.slice(0, MAX_CUSTOM_AGENTS)) {
    const source = asObject(entry);
    if (!source) continue;

    const id = toNonEmptyString(source.id) ?? `custom_agent_${resolved.length + 1}`;
    const name = toNonEmptyString(source.name) ?? `Custom Agent ${resolved.length + 1}`;
    const objective = toNonEmptyString(source.objective) ?? toNonEmptyString(source.goal) ?? 'Find meaningful issues for review.';
    const instructions = toNonEmptyString(source.instructions) ?? 'Identify important findings, stay accurate, and return valid JSON only.';
    const categories = Array.isArray(source.categories)
      ? source.categories
          .map((value) => toNonEmptyString(value))
          .filter((value): value is string => Boolean(value))
      : [];

    const safeCategories = (categories.length > 0 ? categories : ['custom'])
      .map((category) => sanitizePromptPayload(category, 40).replace(/\s+/g, '_'))
      .filter((category) => category.length > 0);

    resolved.push({
      id: sanitizePromptPayload(id, 60).replace(/\s+/g, '_'),
      name: sanitizePromptPayload(name, 80),
      objective: sanitizePromptPayload(objective, 500),
      instructions: sanitizePromptPayload(instructions, 1200),
      categories: safeCategories.length > 0 ? safeCategories : ['custom'],
    });
  }

  return resolved.length > 0 ? resolved : getDefaultAuditAgents();
}

export async function generateAssignmentTextWithGemini(
  input: AssignmentGenerationInput
): Promise<GeneratedAssignmentText> {
  const model = getGeminiGenerationModel();
  const systemInstruction = GENERATION_SYSTEM_INSTRUCTION;
  const userPrompt = buildGenerationUserPrompt(input);

  const raw = await callGeminiText({
    model,
    systemInstruction,
    userPrompt,
    temperature: 0.8,
    maxOutputTokens: 4096,
  });

  type GenerationResponse = {
    text?: unknown;
    notes?: unknown;
    flawAnnotations?: unknown;
    // Legacy fields (fallback)
    riskSignals?: unknown;
    plantedFindings?: unknown;
  };
  const parsed = parseJsonFromModel<GenerationResponse>(raw);
  const rawTextContent =
    toNonEmptyString(parsed?.text) ??
    extractTextFieldWithRegex(raw) ??
    toNonEmptyString(raw);
  if (!rawTextContent) {
    throw new GeminiApiError('Gemini generation did not return text content.', 502);
  }

  const notes = Array.isArray(parsed?.notes)
    ? parsed.notes
        .map((item) => toNonEmptyString(item))
        .filter((item): item is string => Boolean(item))
    : [];

  // --- Primary path: extract inline <flaw> tags ---
  const { cleanText, flaws: extractedFlaws } = extractFlawTags(rawTextContent);
  const plantedFindings: PlantedFinding[] = [];

  if (extractedFlaws.length > 0) {
    // Build annotation lookup from flawAnnotations array
    const annotationMap = new Map<string, { signalId?: string; category?: string; description?: string; idealResponse?: string }>();
    if (Array.isArray(parsed?.flawAnnotations)) {
      for (const entry of parsed.flawAnnotations) {
        const value = asObject(entry);
        if (!value) continue;
        const id = toNonEmptyString(value.id);
        if (!id) continue;
        annotationMap.set(id, {
          signalId: toNonEmptyString(value.signalId) ?? undefined,
          category: toNonEmptyString(value.category) ?? undefined,
          description: toNonEmptyString(value.description) ?? undefined,
          idealResponse: toNonEmptyString(value.idealResponse) ?? undefined,
        });
      }
    }

    let fromTagsAndAnnotations = 0;
    let fromTagsOnly = 0;

    for (const flaw of extractedFlaws) {
      const annotation = annotationMap.get(flaw.id);
      if (annotation?.description) {
        fromTagsAndAnnotations++;
        plantedFindings.push({
          signalId: annotation.signalId ?? flaw.type,
          severity: normalizeSeverity(flaw.severity),
          category: annotation.category ?? 'analysis',
          flaggedText: flaw.flaggedText,
          description: annotation.description,
          idealResponse: annotation.idealResponse ?? null,
        });
      } else {
        // Annotation missing (possibly truncated) — still create finding from tag data
        fromTagsOnly++;
        plantedFindings.push({
          signalId: flaw.type,
          severity: normalizeSeverity(flaw.severity),
          category: 'analysis',
          flaggedText: flaw.flaggedText,
          description: '(annotation missing — see flaggedText)',
          idealResponse: null,
        });
      }
    }

    console.info(
      `[generate] flaw tags: extracted ${extractedFlaws.length} from inline tags`
    );
    console.info(
      `[generate] plantedFindings: ${plantedFindings.length} built (${fromTagsAndAnnotations} from tags + annotations, ${fromTagsOnly} from tags only)`
    );
  } else {
    // --- Fallback: legacy plantedFindings array (backward compat) ---
    console.info('[generate] no inline <flaw> tags found, falling back to legacy plantedFindings parsing');

    const droppedPlantedFindings: { flaggedText: string; reason: string }[] = [];
    if (Array.isArray(parsed?.plantedFindings)) {
      const rawCount = parsed.plantedFindings.length;
      for (const entry of parsed.plantedFindings) {
        const value = asObject(entry);
        if (!value) continue;
        const flaggedText = toNonEmptyString(value.flaggedText);
        const description = toNonEmptyString(value.description);
        if (!flaggedText || !description) {
          droppedPlantedFindings.push({
            flaggedText: flaggedText ?? '(empty)',
            reason: 'missing flaggedText or description',
          });
          continue;
        }
        // Validate flaggedText is actually in the generated text
        if (!rawTextContent.includes(flaggedText)) {
          droppedPlantedFindings.push({ flaggedText, reason: 'flaggedText not found in text' });
          continue;
        }
        plantedFindings.push({
          signalId: toNonEmptyString(value.signalId) ?? 'organic',
          severity: normalizeSeverity(value.severity),
          category: toNonEmptyString(value.category) ?? 'analysis',
          flaggedText,
          description,
          idealResponse: toNonEmptyString(value.idealResponse) ?? null,
        });
      }
      console.info(
        `[generate] plantedFindings (legacy): ${rawCount} raw, ${plantedFindings.length} validated, ${droppedPlantedFindings.length} dropped`
      );
      for (const dropped of droppedPlantedFindings) {
        console.info(`[generate]   dropped: "${dropped.flaggedText.slice(0, 80)}" — ${dropped.reason}`);
      }
    } else if (Array.isArray(parsed?.riskSignals)) {
      console.info('[generate] model returned riskSignals instead of plantedFindings (old format)');
    } else {
      console.info('[generate] model returned neither plantedFindings nor riskSignals');
    }
  }

  // Use cleanText (tags stripped) when tags were found, otherwise raw
  const textContent = extractedFlaws.length > 0 ? cleanText : rawTextContent;

  // Fallback: parse legacy riskSignals if no plantedFindings
  const riskSignals = Array.isArray(parsed?.riskSignals)
    ? parsed.riskSignals
        .map((item) => toNonEmptyString(item))
        .filter((item): item is string => Boolean(item))
    : [];

  return {
    textContent,
    wordCount: countWords(textContent),
    meta: {
      provider: 'gemini',
      model,
      strategy: input.generationStrategy,
      notes,
      ...(plantedFindings.length > 0
        ? { plantedFindings }
        : { riskSignals }),
      generatedAt: new Date().toISOString(),
    },
  };
}

export async function runMultiAgentAuditWithGemini(params: {
  assignmentTitle: string;
  promptText: string;
  courseContext: string | null;
  requirements: string | null;
  knownPitfalls: string | null;
  referenceMaterial?: string | null;
  sectionBlueprint?: string | null;
  evaluationCriteria?: string | null;
  exemplarNotes?: string | null;
  textContent: string;
  customAgents?: unknown;
  maxFindingsPerAgent?: number;
  plantedFindings?: PlantedFinding[];
}): Promise<MultiAgentAuditResult> {
  const model = getGeminiAuditModel();
  const maxFindingsPerAgent = Math.max(
    1,
    Math.min(12, params.maxFindingsPerAgent ?? DEFAULT_MAX_FINDINGS_PER_AGENT)
  );

  const agentRuns: AgentRunResult[] = [];
  const errors: string[] = [];
  const hasPlantedFindings = Array.isArray(params.plantedFindings) && params.plantedFindings.length > 0;

  if (hasPlantedFindings) {
    // --- Planted findings path: use generation-annotated findings as primary source ---
    const planted = params.plantedFindings!;
    const plantedAgentFindings = convertPlantedFindingsToAgentFindings(planted);

    agentRuns.push({
      agentId: 'generation_planted',
      agentName: 'Generation-Planted Findings',
      summary: `${planted.length} findings annotated by the generation model.`,
      findings: plantedAgentFindings,
      error: null,
    });

    const alreadyCoveredFindings = formatPlantedFindingsSummary(planted);

    // Determine which additional agents to run:
    // - If instructor configured custom agents, run those (they may target free-text pitfalls)
    // - Otherwise, run the single supplementary agent
    const hasCustomAgents = Array.isArray(params.customAgents) && params.customAgents.length > 0;
    const additionalAgents = hasCustomAgents
      ? resolveAuditAgents(params.customAgents)
      : [SUPPLEMENTARY_AUDIT_AGENT];
    const additionalMaxFindings = hasCustomAgents ? maxFindingsPerAgent : 3;

    for (const agent of additionalAgents) {
      const agentPrompt = buildAuditUserPrompt({
        agent,
        params,
        maxFindingsPerAgent: additionalMaxFindings,
        alreadyCoveredFindings,
      });

      try {
        const raw = await callGeminiText({
          model,
          systemInstruction: AUDIT_SYSTEM_INSTRUCTION,
          userPrompt: agentPrompt,
          temperature: 0.2,
          maxOutputTokens: 1800,
        });

        type AgentResponse = {
          agentSummary?: unknown;
          findings?: unknown;
        };
        const parsed = parseJsonFromModel<AgentResponse>(raw);
        const summary = toNonEmptyString(parsed?.agentSummary) ?? 'No agent summary.';

        const findings = Array.isArray(parsed?.findings)
          ? parsed.findings
              .map((entry) => {
                const value = asObject(entry);
                if (!value) return null;
                const description = toNonEmptyString(value.description);
                if (!description) return null;
                return {
                  severity: normalizeSeverity(value.severity),
                  category: toNonEmptyString(value.category) ?? 'analysis',
                  description,
                  idealResponse: toNonEmptyString(value.idealResponse),
                  flaggedText: toNonEmptyString(value.flaggedText),
                  confidence: normalizeConfidence(value.confidence),
                  passSource: `agent:${agent.id}`,
                } as AgentFinding;
              })
              .filter((item): item is AgentFinding => Boolean(item))
          : [];

        agentRuns.push({
          agentId: agent.id,
          agentName: agent.name,
          summary,
          findings: findings.slice(0, additionalMaxFindings),
          error: null,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Agent execution failed.';
        errors.push(`${agent.name}: ${message}`);
        agentRuns.push({
          agentId: agent.id,
          agentName: agent.name,
          summary: 'Agent run failed.',
          findings: [],
          error: message,
        });
      }
    }
  } else {
    // --- Legacy path: run all 4 agents independently ---
    const agents = resolveAuditAgents(params.customAgents);

    for (const agent of agents) {
      const systemInstruction = AUDIT_SYSTEM_INSTRUCTION;
      const userPrompt = buildAuditUserPrompt({ agent, params, maxFindingsPerAgent });

      try {
        const raw = await callGeminiText({
          model,
          systemInstruction,
          userPrompt,
          temperature: 0.2,
          maxOutputTokens: 1800,
        });

        type AgentResponse = {
          agentSummary?: unknown;
          findings?: unknown;
        };
        const parsed = parseJsonFromModel<AgentResponse>(raw);
        const summary = toNonEmptyString(parsed?.agentSummary) ?? 'No agent summary.';

        const findings = Array.isArray(parsed?.findings)
          ? parsed.findings
              .map((entry) => {
                const value = asObject(entry);
                if (!value) return null;
                const description = toNonEmptyString(value.description);
                if (!description) return null;
                return {
                  severity: normalizeSeverity(value.severity),
                  category: toNonEmptyString(value.category) ?? 'analysis',
                  description,
                  idealResponse: toNonEmptyString(value.idealResponse),
                  flaggedText: toNonEmptyString(value.flaggedText),
                  confidence: normalizeConfidence(value.confidence),
                  passSource: `agent:${agent.id}`,
                } as AgentFinding;
              })
              .filter((item): item is AgentFinding => Boolean(item))
          : [];

        agentRuns.push({
          agentId: agent.id,
          agentName: agent.name,
          summary,
          findings: findings.slice(0, maxFindingsPerAgent),
          error: null,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Agent execution failed.';
        errors.push(`${agent.name}: ${message}`);
        agentRuns.push({
          agentId: agent.id,
          agentName: agent.name,
          summary: 'Agent run failed.',
          findings: [],
          error: message,
        });
      }
    }
  }

  let findings = dedupeFindings(agentRuns.flatMap((run) => run.findings));

  if (findings.length === 0) {
    try {
      const rescueRaw = await callGeminiText({
        model,
        systemInstruction: RESCUE_AUDIT_SYSTEM_INSTRUCTION,
        userPrompt: buildRescueAuditUserPrompt(params),
        temperature: 0.25,
        maxOutputTokens: 1500,
      });

      type RescueResponse = {
        summary?: unknown;
        findings?: unknown;
      };
      const parsedRescue = parseJsonFromModel<RescueResponse>(rescueRaw);
      const rescueSummary = toNonEmptyString(parsedRescue?.summary) ?? 'Rescue analysis pass.';
      const rescueFindings = Array.isArray(parsedRescue?.findings)
        ? parsedRescue.findings
            .map((entry) => {
              const value = asObject(entry);
              if (!value) return null;
              const description = toNonEmptyString(value.description);
              if (!description) return null;
              return {
                severity: normalizeSeverity(value.severity),
                category: toNonEmptyString(value.category) ?? 'analysis',
                description,
                idealResponse: toNonEmptyString(value.idealResponse),
                flaggedText: toNonEmptyString(value.flaggedText),
                confidence: normalizeConfidence(value.confidence),
                passSource: 'agent:rescue',
              } as AgentFinding;
            })
            .filter((item): item is AgentFinding => Boolean(item))
        : [];

      agentRuns.push({
        agentId: 'rescue',
        agentName: 'Rescue Pass',
        summary: rescueSummary,
        findings: rescueFindings,
        error: null,
      });

      findings = dedupeFindings(agentRuns.flatMap((run) => run.findings));
      if (findings.length === 0) {
        errors.push('Rescue pass returned zero findings.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown rescue pass failure.';
      errors.push(`Rescue pass failed: ${message}`);
      agentRuns.push({
        agentId: 'rescue',
        agentName: 'Rescue Pass',
        summary: 'Agent run failed.',
        findings: [],
        error: message,
      });
    }
  }

  const totals = {
    critical: findings.filter((finding) => finding.severity === 'critical').length,
    moderate: findings.filter((finding) => finding.severity === 'moderate').length,
    minor: findings.filter((finding) => finding.severity === 'minor').length,
  };

  const summaryParts = [
    `Found ${findings.length} findings.`,
    `Critical: ${totals.critical}, Moderate: ${totals.moderate}, Minor: ${totals.minor}.`,
    `Ran ${agentRuns.length} agents.`,
  ];
  if (errors.length > 0) {
    summaryParts.push(`Agent errors: ${errors.length}.`);
  }

  return {
    model,
    summary: summaryParts.join(' '),
    findings,
    agentRuns,
    totals,
    errors,
  };
}
