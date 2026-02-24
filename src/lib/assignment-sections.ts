export type AssignmentSectionPlan = {
  id: string;
  order: number;
  title: string;
  task: string;
  criteria: string;
  pitfalls: string;
};

function singleLine(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' | ')
    .trim();
}

function valueAfterPrefix(line: string, prefixes: string[]): string | null {
  for (const prefix of prefixes) {
    if (line.startsWith(prefix)) {
      return line.slice(prefix.length).trim();
    }
  }
  return null;
}

function parseSectionChunk(chunk: string, fallbackOrder: number): AssignmentSectionPlan | null {
  const lines = chunk
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const header = lines[0];
  const headerMatch = header.match(/^חלק\s+(\d+)\s*:\s*(.+)$/);
  if (!headerMatch) return null;

  const order = Number(headerMatch[1]) || fallbackOrder;
  const title = headerMatch[2].trim() || `חלק ${order}`;
  let task = '';
  let criteria = '';
  let pitfalls = '';

  for (const line of lines.slice(1)) {
    const taskValue = valueAfterPrefix(line, ['שאלה:', 'משימה:', 'Task:']);
    if (taskValue !== null) {
      task = taskValue;
      continue;
    }
    const criteriaValue = valueAfterPrefix(line, ['קריטריונים:', 'Criteria:']);
    if (criteriaValue !== null) {
      criteria = criteriaValue;
      continue;
    }
    const pitfallsValue = valueAfterPrefix(line, [
      'מוקדי קושי:',
      'טעויות נפוצות:',
      'Pitfalls:',
    ]);
    if (pitfallsValue !== null) {
      pitfalls = pitfallsValue;
      continue;
    }
    if (!task) {
      task = line;
    } else {
      task = `${task} ${line}`.trim();
    }
  }

  return {
    id: `section-${order}`,
    order,
    title,
    task,
    criteria,
    pitfalls,
  };
}

export function buildSectionBlueprintFromPlan(sections: AssignmentSectionPlan[]): string {
  return sections
    .map((section, index) => {
      const order = index + 1;
      return [
        `חלק ${order}: ${singleLine(section.title) || `חלק ${order}`}`,
        `שאלה: ${singleLine(section.task)}`,
        section.criteria ? `קריטריונים: ${singleLine(section.criteria)}` : '',
        section.pitfalls ? `מוקדי קושי: ${singleLine(section.pitfalls)}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}

export function parseSectionsFromText(raw: string | null | undefined): AssignmentSectionPlan[] {
  if (!raw || !raw.trim()) return [];

  const normalized = raw.replace(/\r\n/g, '\n').trim();
  const chunks = normalized
    .split(/\n(?=חלק\s+\d+\s*:)/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const parsed = chunks
    .map((chunk, index) => parseSectionChunk(chunk, index + 1))
    .filter((section): section is AssignmentSectionPlan => Boolean(section))
    .sort((a, b) => a.order - b.order);

  return parsed.slice(0, 3);
}

export function truncateTextToWords(text: string, maxWords: number): string {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return trimmed;
  return `${words.slice(0, maxWords).join(' ')}...`;
}

