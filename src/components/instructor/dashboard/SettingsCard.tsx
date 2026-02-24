'use client';

import { he } from '@/locale/he';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Assignment } from '@/lib/types';

interface EditForm {
  title: string;
  promptText: string;
  courseContext: string;
  requirements: string;
  knownPitfalls: string;
  referenceMaterial: string;
  sectionBlueprint: string;
  evaluationCriteria: string;
  exemplarNotes: string;
  generationStrategy: 'natural' | 'balanced_errors' | 'strict_truth';
}

interface SettingsCardProps {
  assignment: Assignment;
  editingSettings: boolean;
  savingSettings: boolean;
  settingsMessage: string;
  editForm: EditForm;
  onToggleEditing: () => void;
  onEditFormChange: (updater: (prev: EditForm) => EditForm) => void;
  onSaveSettings: () => void;
}

export function SettingsCard({
  assignment,
  editingSettings,
  savingSettings,
  settingsMessage,
  editForm,
  onToggleEditing,
  onEditFormChange,
  onSaveSettings,
}: SettingsCardProps) {
  const textareaStyle = {
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 12px',
    resize: 'vertical' as const,
    fontFamily: 'var(--font-body)',
  };

  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            {he.instructor.editSettings}
          </h3>
          <Button
            variant="secondary"
            onClick={onToggleEditing}
            disabled={savingSettings}
          >
            {editingSettings ? 'סגירה' : 'עריכה'}
          </Button>
        </div>

        {settingsMessage && (
          <div
            style={{
              background: 'var(--success-soft)',
              color: 'var(--success)',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            {settingsMessage}
          </div>
        )}

        {!editingSettings && (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{he.instructor.prompt}</div>
            <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {assignment.promptText}
            </div>
            {assignment.evaluationCriteria && (
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap' }}>
                <strong>{he.instructor.evaluationCriteria}:</strong>{' '}
                {assignment.evaluationCriteria}
              </div>
            )}
            {assignment.sectionBlueprint && (
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap' }}>
                <strong>{he.instructor.sectionBlueprint}:</strong>{' '}
                {assignment.sectionBlueprint}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
              {he.instructor.generationStrategy}: {assignment.generationStrategy}
            </div>
          </div>
        )}

        {editingSettings && (
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{he.instructor.assignmentTitle}</span>
              <input
                value={editForm.title}
                onChange={(e) => onEditFormChange((prev) => ({ ...prev, title: e.target.value }))}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{he.instructor.prompt}</span>
              <textarea
                value={editForm.promptText}
                onChange={(e) => onEditFormChange((prev) => ({ ...prev, promptText: e.target.value }))}
                rows={6}
                style={textareaStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{he.instructor.courseContext}</span>
              <textarea
                value={editForm.courseContext}
                onChange={(e) => onEditFormChange((prev) => ({ ...prev, courseContext: e.target.value }))}
                rows={3}
                style={textareaStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{he.instructor.requirements}</span>
              <textarea
                value={editForm.requirements}
                onChange={(e) => onEditFormChange((prev) => ({ ...prev, requirements: e.target.value }))}
                rows={3}
                style={textareaStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{he.instructor.referenceMaterial}</span>
              <textarea
                value={editForm.referenceMaterial}
                onChange={(e) => onEditFormChange((prev) => ({ ...prev, referenceMaterial: e.target.value }))}
                rows={4}
                style={textareaStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{he.instructor.sectionBlueprint}</span>
              <textarea
                value={editForm.sectionBlueprint}
                onChange={(e) => onEditFormChange((prev) => ({ ...prev, sectionBlueprint: e.target.value }))}
                rows={4}
                style={textareaStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{he.instructor.evaluationCriteria}</span>
              <textarea
                value={editForm.evaluationCriteria}
                onChange={(e) => onEditFormChange((prev) => ({ ...prev, evaluationCriteria: e.target.value }))}
                rows={5}
                style={textareaStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{he.instructor.exemplarNotes}</span>
              <textarea
                value={editForm.exemplarNotes}
                onChange={(e) => onEditFormChange((prev) => ({ ...prev, exemplarNotes: e.target.value }))}
                rows={4}
                style={textareaStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{he.instructor.knownPitfalls}</span>
              <textarea
                value={editForm.knownPitfalls}
                onChange={(e) => onEditFormChange((prev) => ({ ...prev, knownPitfalls: e.target.value }))}
                rows={3}
                style={textareaStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{he.instructor.generationStrategy}</span>
              <select
                value={editForm.generationStrategy}
                onChange={(e) =>
                  onEditFormChange((prev) => ({
                    ...prev,
                    generationStrategy: e.target.value as 'natural' | 'balanced_errors' | 'strict_truth',
                  }))
                }
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <option value="natural">{he.instructor.generationStrategyNatural}</option>
                <option value="balanced_errors">{he.instructor.generationStrategyBalanced}</option>
                <option value="strict_truth">{he.instructor.generationStrategyStrict}</option>
              </select>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={onSaveSettings} disabled={savingSettings || !editForm.promptText.trim()}>
                {savingSettings ? '...' : he.instructor.saveSettings}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
