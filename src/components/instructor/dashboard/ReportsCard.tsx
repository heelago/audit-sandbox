import { Card } from '@/components/ui/Card';
import type { Text, AnalysisReportSummary } from '@/lib/types';

interface ReportsCardProps {
  texts: Text[];
  reportByTextId: Map<string, AnalysisReportSummary>;
}

export function ReportsCard({ texts, reportByTextId }: ReportsCardProps) {
  if (reportByTextId.size === 0) return null;

  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ padding: 16 }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: 15, color: 'var(--ink)' }}>דוחי סוכנים (חדש)</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: 12, color: 'var(--ink-soft)' }}>
          הדוח האחרון לכל טקסט נשמר בטבלת דוחות מובנית.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {texts.map((text) => {
            const report = reportByTextId.get(text.id);
            if (!report) return null;
            return (
              <div
                key={report.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  background: 'var(--card-hover)',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 6 }}>
                  קוד: <span style={{ fontFamily: 'monospace', color: 'var(--ink)' }}>{text.studentCode}</span>
                  {' | '}ממצאים: {report.findingsCount}
                  {' | '}קריטי: {report.totalsCritical}, בינוני: {report.totalsModerate}, קל: {report.totalsMinor}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>{report.summary}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                  מצב: {report.mode} | שגיאות סוכן: {report.errorCount} | {new Date(report.createdAt).toLocaleString('he-IL')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
