import { Card } from '@/components/ui/Card';
import type { ActivityLogEntry } from '@/lib/types';

interface ActivityLogProps {
  activeAction: 'generating' | 'analyzing' | null;
  progressDots: string;
  activityLog: ActivityLogEntry[];
}

export function ActivityLog({ activeAction, progressDots, activityLog }: ActivityLogProps) {
  if (!activeAction && activityLog.length === 0) return null;

  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ padding: 16, display: 'grid', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>יומן פעילות</div>
        {activeAction && (
          <div
            style={{
              fontSize: 13,
              color: 'var(--accent)',
              background: 'var(--accent-soft)',
              borderRadius: 8,
              padding: '8px 10px',
            }}
          >
            {activeAction === 'generating' ? 'מייצר טקסטים' : 'מריץ ניתוח סוכנים'}
            {progressDots}
          </div>
        )}
        {activityLog.slice(0, 6).map((entry) => (
          <div
            key={entry.id}
            style={{
              fontSize: 12,
              color:
                entry.level === 'error'
                  ? 'var(--error)'
                  : entry.level === 'success'
                    ? 'var(--success)'
                    : 'var(--ink-soft)',
            }}
          >
            {new Date(entry.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} - {entry.message}
          </div>
        ))}
      </div>
    </Card>
  );
}
