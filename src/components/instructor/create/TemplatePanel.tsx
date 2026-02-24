'use client';

import type { RefObject } from 'react';
import { he } from '@/locale/he';
import { Button } from '@/components/ui/Button';
import type { PromptTemplate } from '@/lib/types';

interface TemplatePanelProps {
  templateName: string;
  selectedTemplateId: string;
  templates: PromptTemplate[];
  templateMessage: string;
  importInputRef: RefObject<HTMLInputElement | null>;
  onTemplateNameChange: (value: string) => void;
  onSelectedTemplateIdChange: (value: string) => void;
  onSave: () => void;
  onLoad: () => void;
  onDelete: () => void;
  onExport: () => void;
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TemplatePanel({
  templateName,
  selectedTemplateId,
  templates,
  templateMessage,
  importInputRef,
  onTemplateNameChange,
  onSelectedTemplateIdChange,
  onSave,
  onLoad,
  onDelete,
  onExport,
  onImportFile,
}: TemplatePanelProps) {
  return (
    <div
      style={{
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--card-hover)',
        padding: 12,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
        {he.instructor.promptTemplates}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{he.instructor.templateName}</span>
          <input
            value={templateName}
            onChange={(e) => onTemplateNameChange(e.target.value)}
            placeholder={he.instructor.templateNamePlaceholder}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 10px',
              background: 'var(--card)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
            }}
          />
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button type="button" variant="secondary" onClick={onSave}>
            {he.instructor.saveTemplate}
          </Button>
          <select
            value={selectedTemplateId}
            onChange={(e) => onSelectedTemplateIdChange(e.target.value)}
            style={{
              minWidth: 180,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 10px',
              background: 'var(--card)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
            }}
          >
            <option value="">{he.instructor.selectTemplate}</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            onClick={onLoad}
            disabled={!selectedTemplateId}
          >
            {he.instructor.loadTemplate}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onDelete}
            disabled={!selectedTemplateId}
          >
            {he.instructor.deleteTemplate}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onExport}
          >
            {he.instructor.exportTemplates}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => importInputRef.current?.click()}
          >
            {he.instructor.importTemplates}
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={onImportFile}
            style={{ display: 'none' }}
          />
        </div>
        {templateMessage && (
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{templateMessage}</div>
        )}
      </div>
    </div>
  );
}
