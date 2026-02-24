'use client';

import { Fragment } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getGenerationProvider, getGenerationProviderLabel } from '@/lib/import-utils';
import type { Text } from '@/lib/types';

interface TextsTableProps {
  texts: Text[];
  textMutationsLocked: boolean;
  rowActionLoading: string | null;
  rowEditTextId: string | null;
  rowEditValue: string;
  rowEditSaving: boolean;
  assignmentId: string;
  onOpenRowEditor: (text: Text) => void;
  onRegenerateSingleText: (textId: string, studentCode: string) => void;
  onAnalyzeSingleText: (textId: string, studentCode: string) => void;
  onRowEditValueChange: (value: string) => void;
  onSaveRowEdit: (textId: string, studentCode: string) => void;
  onCancelRowEdit: () => void;
  onNavigateCalibrate: () => void;
}

export function TextsTable({
  texts,
  textMutationsLocked,
  rowActionLoading,
  rowEditTextId,
  rowEditValue,
  rowEditSaving,
  onOpenRowEditor,
  onRegenerateSingleText,
  onAnalyzeSingleText,
  onRowEditValueChange,
  onSaveRowEdit,
  onCancelRowEdit,
  onNavigateCalibrate,
}: TextsTableProps) {
  if (texts.length === 0) return null;

  return (
    <Card>
      <div style={{ padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px 0' }}>
          טקסטים ({texts.length})
        </h3>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 14,
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 600 }}>קוד</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 600 }}>שם</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 600 }}>סטטוס</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 600 }}>מילים</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 600 }}>מקור</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 600 }}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {texts.map((t) => {
              const provider = getGenerationProvider(t.generationMeta);
              const isEditingRow = rowEditTextId === t.id;
              const isRowBusy =
                rowActionLoading === `analyze:${t.id}` ||
                rowActionLoading === `regen:${t.id}` ||
                rowEditSaving;
              return (
                <Fragment key={t.id}>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--ink)', fontFamily: 'monospace' }}>
                      {t.studentCode}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--ink-soft)' }}>
                      {t.studentName || '-'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--ink-soft)' }}>
                      {t.status}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--ink-soft)' }}>
                      {t.wordCount}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--ink-soft)' }}>
                      {getGenerationProviderLabel(provider)}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--ink-soft)' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Button size="small" variant="secondary" onClick={() => onOpenRowEditor(t)} disabled={textMutationsLocked || isRowBusy}>
                          ערוך
                        </Button>
                        <Button size="small" variant="secondary" onClick={() => onRegenerateSingleText(t.id, t.studentCode)} disabled={textMutationsLocked || isRowBusy}>
                          {rowActionLoading === `regen:${t.id}` ? '...' : 'צור מחדש'}
                        </Button>
                        <Button size="small" variant="secondary" onClick={() => onAnalyzeSingleText(t.id, t.studentCode)} disabled={textMutationsLocked || isRowBusy}>
                          {rowActionLoading === `analyze:${t.id}` ? '...' : 'נתח שוב'}
                        </Button>
                        <Button size="small" variant="secondary" onClick={onNavigateCalibrate}>
                          כיול
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {isEditingRow && (
                    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td colSpan={6} style={{ padding: 12 }}>
                        <div style={{ display: 'grid', gap: 8 }}>
                          <textarea
                            value={rowEditValue}
                            onChange={(event) => onRowEditValueChange(event.target.value)}
                            rows={10}
                            style={{
                              width: '100%',
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                              padding: '10px 12px',
                              resize: 'vertical',
                              fontFamily: 'var(--font-body)',
                              lineHeight: 1.6,
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                              שמירה תאפס ממצאי ניתוח קיימים ותעביר חזרה לשלב ניתוח.
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Button size="small" variant="secondary" onClick={onCancelRowEdit} disabled={rowEditSaving}>
                                ביטול
                              </Button>
                              <Button size="small" onClick={() => onSaveRowEdit(t.id, t.studentCode)} disabled={rowEditSaving || !rowEditValue.trim()}>
                                {rowEditSaving ? '...' : 'שמור עריכה'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
