const DEFAULT_BETA_ASSIGNMENT_LIMIT = 5;

export function getBetaAssignmentLimit(): number {
  const raw = process.env.BETA_ASSIGNMENT_LIMIT?.trim();
  if (!raw) return DEFAULT_BETA_ASSIGNMENT_LIMIT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_BETA_ASSIGNMENT_LIMIT;
  return Math.max(1, Math.min(200, Math.floor(parsed)));
}
