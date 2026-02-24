import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { countWords, generateCode } from '@/lib/utils';
import { demoWriteBlockedResponse, isDemoReadOnly } from '@/lib/demo-mode';
import {
  mergeStudentCodes,
  parsePlannedStudentCodes,
  serializePlannedStudentCodes,
} from '@/lib/assignment-roster';

const STUDENT_CODE_PATTERN = /^[A-Z0-9]{4,16}$/;
const MAX_IMPORT_ENTRIES = 50;
const LOCKED_STATUSES = new Set(['active', 'grading', 'closed']);

type ImportEntry = {
  textContent: string;
  studentCode?: string;
  sourceLabel?: string;
};

type AnonymizationResult = {
  text: string;
  redactions: number;
  redactionKinds: string[];
};

function normalizeImportEntries(value: unknown): ImportEntry[] {
  if (!Array.isArray(value)) return [];

  const entries: ImportEntry[] = [];
  for (const item of value.slice(0, MAX_IMPORT_ENTRIES)) {
    if (typeof item === 'string') {
      const textContent = item.trim();
      if (textContent.length > 0) {
        entries.push({ textContent });
      }
      continue;
    }

    if (!item || typeof item !== 'object') continue;
    const source = item as Record<string, unknown>;
    const textContent =
      typeof source.textContent === 'string'
        ? source.textContent.trim()
        : typeof source.text === 'string'
          ? source.text.trim()
          : '';
    if (!textContent) continue;

    entries.push({
      textContent,
      studentCode: typeof source.studentCode === 'string' ? source.studentCode.trim().toUpperCase() : undefined,
      sourceLabel: typeof source.sourceLabel === 'string' ? source.sourceLabel.trim() : undefined,
    });
  }
  return entries;
}

function anonymizeImportedText(text: string): AnonymizationResult {
  let output = text;
  let redactions = 0;
  const redactionKinds = new Set<string>();

  const applyRedaction = (pattern: RegExp, replacement: string, kind: string) => {
    output = output.replace(pattern, (...args: unknown[]) => {
      const match = String(args[0] ?? '');
      const captures = args.slice(1, -2).map((value) => String(value ?? ''));
      redactions += 1;
      redactionKinds.add(kind);
      let rendered = replacement.replace(/\$0/g, match);
      captures.forEach((capture, index) => {
        rendered = rendered.replace(new RegExp(`\\$${index + 1}`, 'g'), capture);
      });
      return rendered;
    });
  };

  // Email addresses
  applyRedaction(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]', 'email');
  // URLs
  applyRedaction(/https?:\/\/\S+/gi, '[REDACTED_URL]', 'url');
  // Phone-like sequences
  applyRedaction(/(?:\+?\d[\d()\-\s]{8,}\d)/g, '[REDACTED_PHONE]', 'phone');
  // 9-digit IDs (common local pattern)
  applyRedaction(/\b\d{9}\b/g, '[REDACTED_ID]', 'id');
  // Explicit student-name prefixes (Hebrew/English)
  applyRedaction(/(שם(?:\s+הסטודנט(?:ית)?)?\s*[:\-]\s*)([^\n]+)/gi, '$1[REDACTED_NAME]', 'name_prefix');
  applyRedaction(/(student\s*name\s*[:\-]\s*)([^\n]+)/gi, '$1[REDACTED_NAME]', 'name_prefix');

  return {
    text: output,
    redactions,
    redactionKinds: [...redactionKinds],
  };
}

function nextUniqueStudentCode(existingCodes: Set<string>): string {
  let code: string;
  do {
    code = generateCode(6);
  } while (existingCodes.has(code));
  existingCodes.add(code);
  return code;
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
    include: {
      texts: {
        select: { studentCode: true },
      },
    },
  });
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
  }
  if (LOCKED_STATUSES.has(assignment.status)) {
    return NextResponse.json(
      { error: 'Cannot import texts after assignment is active or closed.' },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  // PLACEHOLDER: import currently accepts inline JSON payload parsed on client.
  // Next iteration can add direct .docx parsing server-side if needed.
  const entries = normalizeImportEntries(body.entries);
  if (entries.length === 0) {
    return NextResponse.json({ error: 'No valid import entries were provided.' }, { status: 400 });
  }

  const existingCodes = new Set(assignment.texts.map((text) => text.studentCode.toUpperCase()));
  const plannedCodes = parsePlannedStudentCodes(assignment.plannedStudentCodes);
  const payloadProvidedCodes = new Set<string>();
  const plannedCreates: Array<{
    studentCode: string;
    textContent: string;
    wordCount: number;
    generationMeta: string;
  }> = [];

  for (const [index, entry] of entries.entries()) {
    const normalizedText = entry.textContent.trim();
    if (normalizedText.length < 40) {
      return NextResponse.json(
        { error: `Entry ${index + 1} is too short. Provide full assignment text.` },
        { status: 400 }
      );
    }

    let studentCode = entry.studentCode;
    if (studentCode) {
      if (!STUDENT_CODE_PATTERN.test(studentCode)) {
        return NextResponse.json(
          { error: `Entry ${index + 1} includes invalid studentCode format.` },
          { status: 400 }
        );
      }
      if (payloadProvidedCodes.has(studentCode)) {
        return NextResponse.json(
          { error: `Entry ${index + 1} uses duplicate studentCode in payload.` },
          { status: 400 }
        );
      }
      if (existingCodes.has(studentCode)) {
        return NextResponse.json(
          { error: `Entry ${index + 1} uses existing studentCode (${studentCode}).` },
          { status: 409 }
        );
      }
      payloadProvidedCodes.add(studentCode);
      existingCodes.add(studentCode);
    } else {
      studentCode = nextUniqueStudentCode(existingCodes);
    }

    const anonymized = anonymizeImportedText(normalizedText);
    plannedCreates.push({
      studentCode,
      textContent: anonymized.text,
      wordCount: countWords(anonymized.text),
      generationMeta: JSON.stringify({
        provider: 'instructor-upload',
        importedAt: new Date().toISOString(),
        sourceLabel: entry.sourceLabel || null,
        anonymization: {
          enabled: true,
          redactions: anonymized.redactions,
          redactionKinds: anonymized.redactionKinds,
        },
      }),
    });
  }

  const created = await prisma.$transaction(async (tx) => {
    const createdRows = [];
    for (const row of plannedCreates) {
      const createdText = await tx.generatedText.create({
        data: {
          assignmentId: id,
          studentCode: row.studentCode,
          textContent: row.textContent,
          wordCount: row.wordCount,
          generationMeta: row.generationMeta,
          status: 'generated',
        },
      });
      createdRows.push(createdText);
    }

    const mergedRoster = mergeStudentCodes(
      plannedCodes,
      createdRows.map((row) => row.studentCode)
    );

    await tx.assignment.update({
      where: { id },
      data: {
        status: 'analyzing',
        plannedStudentCount: mergedRoster.length,
        plannedStudentCodes: serializePlannedStudentCodes(mergedRoster),
      },
    });

    await tx.calibrationLog.create({
      data: {
        assignmentId: id,
        action: 'import_texts',
        notes: JSON.stringify(
          {
            importedAt: new Date().toISOString(),
            entries: createdRows.length,
            studentCodes: createdRows.map((row) => row.studentCode),
          },
          null,
          2
        ),
      },
    });

    return createdRows;
  });

  const redactionCount = plannedCreates.reduce((sum, item) => {
    try {
      const meta = JSON.parse(item.generationMeta) as { anonymization?: { redactions?: number } };
      return sum + (meta.anonymization?.redactions ?? 0);
    } catch {
      return sum;
    }
  }, 0);

  return NextResponse.json({
    success: true,
    imported: created.length,
    totalRedactions: redactionCount,
    texts: created.map((row) => ({
      id: row.id,
      studentCode: row.studentCode,
      wordCount: row.wordCount,
    })),
  });
}
