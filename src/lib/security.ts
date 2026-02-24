type StudentPromptInput = {
  title: string;
  requirements?: string | null;
};

const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeTextInput(value: string, maxLen: number): string {
  const normalized = value
    .replace(/\r\n/g, '\n')
    .replace(CONTROL_CHARS_REGEX, ' ')
    .trim();
  if (normalized.length <= maxLen) return normalized;
  return normalized.slice(0, maxLen).trim();
}

export function sanitizeOptionalTextInput(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null;
  const sanitized = sanitizeTextInput(value, maxLen);
  return sanitized || null;
}

export function sanitizePromptPayload(value: string, maxLen: number): string {
  const sanitized = sanitizeTextInput(value, maxLen);
  return sanitized
    .replace(/```/g, '` ` `')
    .replace(/<\/?(system|assistant|user|tool)>/gi, '')
    .replace(/\u2028|\u2029/g, ' ');
}

export function buildUntrustedPromptBlock(tag: string, value: string | null | undefined, maxLen: number): string {
  const safeTag = tag.replace(/[^a-z0-9_]/gi, '').toLowerCase() || 'field';
  const content = value ? sanitizePromptPayload(value, maxLen) : 'not provided';
  return `<${safeTag}>\n${content}\n</${safeTag}>`;
}

export function buildStudentVisiblePrompt(input: StudentPromptInput): string {
  const title = sanitizeTextInput(input.title || 'מטלה', 200);
  const requirements = sanitizeOptionalTextInput(input.requirements, 1400);
  if (requirements) {
    return requirements;
  }
  return `משימת ביקורת עבור "${title}": קראו את הטקסט שנוצר, זהו אי-דיוקים ופערים, נמקו את ההערות שלכם והוסיפו ראיות אימות.`;
}
