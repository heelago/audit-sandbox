'use client';

import { he } from '@/locale/he';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { STATUS_COLORS } from '@/lib/constants';

interface ActionButtonsProps {
  status: string;
  textsCount: number;
  actionLoading: boolean;
  canGeneratePilot: boolean;
  canGenerateRemaining: boolean;
  remainingCount: number;
  assignmentId: string;
  onGenerate: (stage: 'pilot' | 'full') => void;
  onAnalyze: () => void;
  onNavigate: (path: string) => void;
}

export function ActionButtons({
  status,
  textsCount,
  actionLoading,
  canGeneratePilot,
  canGenerateRemaining,
  remainingCount,
  assignmentId,
  onGenerate,
  onAnalyze,
  onNavigate,
}: ActionButtonsProps) {
  return (
    <div style={{ marginBottom: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {canGeneratePilot && (
        <Button onClick={() => onGenerate('pilot')} disabled={actionLoading}>
          {actionLoading ? '...' : 'ייצר פיילוט (2)'}
        </Button>
      )}

      {canGenerateRemaining && (
        <Button onClick={() => onGenerate('full')} disabled={actionLoading}>
          {actionLoading ? '...' : `ייצר את היתר (${remainingCount})`}
        </Button>
      )}

      {status === 'generating' && (
        <StatusBadge color={STATUS_COLORS.generating.color} bg={STATUS_COLORS.generating.bg}>
          {he.instructor.status.generating}
        </StatusBadge>
      )}

      {status === 'analyzing' && textsCount > 0 && (
        <Button onClick={onAnalyze} disabled={actionLoading}>
          {actionLoading ? '...' : he.instructor.analyze}
        </Button>
      )}

      {status === 'calibrating' && (
        <Button onClick={() => onNavigate(`/instructor/${assignmentId}/calibrate`)}>
          {he.instructor.calibrate}
        </Button>
      )}

      {(status === 'active' || status === 'grading') && (
        <Button onClick={() => onNavigate(`/instructor/${assignmentId}/submissions`)}>
          {he.instructor.submissions}
        </Button>
      )}

      {status === 'active' && (
        <StatusBadge color={STATUS_COLORS.active.color} bg={STATUS_COLORS.active.bg}>
          {he.instructor.status.active}
        </StatusBadge>
      )}
    </div>
  );
}
