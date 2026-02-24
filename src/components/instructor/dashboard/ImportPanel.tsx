'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ImportPanelProps {
  importRaw: string;
  importFileName: string;
  importLoading: boolean;
  importMessage: string;
  parsedEntryCount: number;
  onImportRawChange: (value: string) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
}

export function ImportPanel({
  importRaw,
  importFileName,
  importLoading,
  importMessage,
  parsedEntryCount,
  onImportRawChange,
  onFileChange,
  onImport,
}: ImportPanelProps) {
  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 10px 0' }}>
          ייבוא טקסטים קיימים (אנונימיזציה אוטומטית)
        </h3>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13, lineHeight: 1.7, margin: '0 0 12px 0' }}>
          אפשר להעלות קובץ `.json/.txt` או להדביק טקסטים ידנית. כל טקסט יומר לגרסה אנונימית לפני שמירה.
          ניתן להפריד טקסטים עם שורה של `---` או `===`.
        </p>

        <div style={{ marginBottom: 10 }}>
          <input type="file" accept=".json,.txt,.md" onChange={onFileChange} />
          {importFileName && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-soft)' }}>
              קובץ נטען: {importFileName}
            </div>
          )}
        </div>

        <textarea
          value={importRaw}
          onChange={(e) => onImportRawChange(e.target.value)}
          placeholder='דוגמה JSON: [{"textContent":"..."}, {"textContent":"...", "studentCode":"STU201"}]'
          style={{
            width: '100%',
            minHeight: 140,
            borderRadius: 8,
            border: '1px solid var(--border)',
            padding: 10,
            resize: 'vertical',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            lineHeight: 1.5,
            boxSizing: 'border-box',
            marginBottom: 10,
          }}
        />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button onClick={onImport} disabled={importLoading || parsedEntryCount === 0}>
            {importLoading ? 'מייבא...' : 'ייבא טקסטים'}
          </Button>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
            טקסטים לפענוח: {parsedEntryCount}
          </span>
        </div>

        {importMessage && (
          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              color: 'var(--success)',
              background: 'var(--success-soft)',
              borderRadius: 8,
              padding: '8px 10px',
            }}
          >
            {importMessage}
          </div>
        )}
      </div>
    </Card>
  );
}
