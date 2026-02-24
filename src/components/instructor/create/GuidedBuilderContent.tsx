'use client';

import type React from 'react';
import type { DisciplinePresetId, PlantedSignalId } from '@/lib/ai/planted-signals';
import { he } from '@/locale/he';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { GuidedSection } from '@/lib/types';
import { PlantedSignalsPanel } from './PlantedSignalsPanel';

interface PresetSuggestion {
  presetId: DisciplinePresetId;
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
}

interface GuidedBuilderContentProps {
  guidedSectionCount: number;
  guidedSectionItems: GuidedSection[];
  maxSections: number;
  guidedTask: string;
  guidedCriteria: string;
  guidedObstacles: string;
  guidedSources: string;
  guidedWordLimit: number;
  guidedMessage: string;
  brainstormPrompt: string;
  selectedPlantedSignals: PlantedSignalId[];
  selectedPresetId: DisciplinePresetId;
  presetSuggestion: PresetSuggestion;
  presetPinnedByUser: boolean;
  tourTargetStyle: (id: string) => React.CSSProperties | undefined;
  renderTourHint: (id: string) => React.ReactNode;
  onSetSectionCount: (count: number) => void;
  onUpdateSection: (id: string, field: keyof GuidedSection, value: string) => void;
  onSetGuidedTask: (value: string) => void;
  onSetGuidedCriteria: (value: string) => void;
  onSetGuidedObstacles: (value: string) => void;
  onSetGuidedSources: (value: string) => void;
  onSetGuidedWordLimit: (value: number) => void;
  onSetBrainstormPrompt: (value: string) => void;
  onBuildPrompt: () => void;
  onApplySafeFlawTemplate: () => void;
  onBuildBrainstormPrompt: () => void;
  onCopyBrainstormPrompt: () => void;
  onToggleSignal: (id: PlantedSignalId) => void;
  onApplyPreset: (id: DisciplinePresetId) => void;
  onApplySuggested: () => void;
  onResumeAuto: () => void;
  onSelectPreset: (id: DisciplinePresetId) => void;
}

export function GuidedBuilderContent({
  guidedSectionCount,
  guidedSectionItems,
  maxSections,
  guidedTask,
  guidedCriteria,
  guidedObstacles,
  guidedSources,
  guidedWordLimit,
  guidedMessage,
  brainstormPrompt,
  selectedPlantedSignals,
  selectedPresetId,
  presetSuggestion,
  presetPinnedByUser,
  tourTargetStyle,
  renderTourHint,
  onSetSectionCount,
  onUpdateSection,
  onSetGuidedTask,
  onSetGuidedCriteria,
  onSetGuidedObstacles,
  onSetGuidedSources,
  onSetGuidedWordLimit,
  onSetBrainstormPrompt,
  onBuildPrompt,
  onApplySafeFlawTemplate,
  onBuildBrainstormPrompt,
  onCopyBrainstormPrompt,
  onToggleSignal,
  onApplyPreset,
  onApplySuggested,
  onResumeAuto,
  onSelectPreset,
}: GuidedBuilderContentProps) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div
        data-tour-id="tour-sections"
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--card)',
          padding: 10,
          display: 'grid',
          gap: 10,
          ...tourTargetStyle('tour-sections'),
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>
            {he.instructor.sectionBlueprint} (1-3)
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onSetSectionCount(count)}
                style={{
                  width: 34,
                  height: 30,
                  borderRadius: 8,
                  border:
                    guidedSectionCount === count
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border)',
                  background:
                    guidedSectionCount === count
                      ? 'var(--accent-soft)'
                      : 'var(--card-hover)',
                  color:
                    guidedSectionCount === count
                      ? 'var(--accent)'
                      : 'var(--ink-soft)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
          {guidedSectionItems.length}/{maxSections} חלקים
        </div>
        {guidedSectionItems.map((section, index) => (
          <div
            key={section.id}
            style={{
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--card-hover)',
              padding: 10,
              display: 'grid',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
              חלק {index + 1}
            </div>
            <Input
              label="כותרת החלק"
              helpTooltip="למשל: שאלת תיאוריה, ניתוח מקרה, או חלק מסכם"
              value={section.title}
              onChange={(e) => onUpdateSection(section.id, 'title', e.target.value)}
              placeholder="למשל: ניתוח לפי תיאוריה X"
            />
            <Textarea
              label="שאלת החלק"
              helpTooltip="נסחו מה הסטודנט/ית נדרש/ת לעשות בחלק הזה, בפועל"
              value={section.task}
              onChange={(e) => onUpdateSection(section.id, 'task', e.target.value)}
              placeholder="מה הסטודנט/ית צריך/ה לנתח בחלק הזה?"
              rows={4}
            />
            <Textarea
              label="קריטריונים לחלק (אופציונלי)"
              helpTooltip="מה חייב להופיע בתשובה טובה בחלק הזה: מושגים, טיעון, השוואה, מקור"
              value={section.criteria}
              onChange={(e) => onUpdateSection(section.id, 'criteria', e.target.value)}
              placeholder="מה חייב להופיע בחלק הזה"
              rows={4}
            />
            <Textarea
              label="מוקדי קושי לחלק (אופציונלי)"
              helpTooltip="אילו טעויות נפוצות היית רוצה שהסטודנטים ילמדו לזהות ולנמק"
              value={section.pitfalls}
              onChange={(e) => onUpdateSection(section.id, 'pitfalls', e.target.value)}
              placeholder="אילו טעויות או בלבולים כדאי לשלב כדי לעודד ביקורת"
              rows={3}
            />
          </div>
        ))}
      </div>
      {renderTourHint('tour-sections')}

      <Textarea
        label={he.instructor.guidedTask}
        helpTooltip="תארו במשפט-שניים את המשימה המרכזית: ניתוח, השוואה, ביקורת, או יישום"
        value={guidedTask}
        onChange={(e) => onSetGuidedTask(e.target.value)}
        placeholder={he.instructor.guidedTaskPlaceholder}
        rows={3}
      />

      <div
        data-tour-id="tour-criteria"
        style={{ display: 'grid', gap: 10, ...tourTargetStyle('tour-criteria') }}
      >
        <Textarea
          label={he.instructor.guidedCriteria}
          helpTooltip="רשימת נקודות שצריכות להופיע בתשובה איכותית. אפשר גם כמספור קצר"
          value={guidedCriteria}
          onChange={(e) => onSetGuidedCriteria(e.target.value)}
          placeholder={he.instructor.guidedCriteriaPlaceholder}
          rows={8}
        />

        <Textarea
          label={he.instructor.guidedObstacles}
          helpTooltip="טעויות או מוקדי בלבול מכוונים שהסטודנטים אמורים לזהות ולהסביר"
          value={guidedObstacles}
          onChange={(e) => onSetGuidedObstacles(e.target.value)}
          placeholder={he.instructor.guidedObstaclesPlaceholder}
          rows={6}
        />

        <PlantedSignalsPanel
          selectedPlantedSignals={selectedPlantedSignals}
          selectedPresetId={selectedPresetId}
          presetSuggestion={presetSuggestion}
          presetPinnedByUser={presetPinnedByUser}
          onToggleSignal={onToggleSignal}
          onApplyPreset={onApplyPreset}
          onApplySuggested={onApplySuggested}
          onResumeAuto={onResumeAuto}
          onSelectPreset={onSelectPreset}
        />
      </div>
      {renderTourHint('tour-criteria')}
      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
        <Button type="button" variant="secondary" onClick={onApplySafeFlawTemplate}>
          טען תבנית כשלים בטוחה
        </Button>
        <Button type="button" variant="secondary" onClick={onBuildBrainstormPrompt}>
          צור פרומפט בריינסטורם לכשלים
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCopyBrainstormPrompt}
          disabled={!brainstormPrompt.trim()}
        >
          העתק פרומפט בריינסטורם
        </Button>
      </div>

      {brainstormPrompt && (
        <Textarea
          label="פרומפט בריינסטורם למרצה (להעתקה/שימוש)"
          helpTooltip="פרומפט עזר ליצירת רעיונות לכשלים פדגוגיים ריאליסטיים לפני בניית המטלה"
          value={brainstormPrompt}
          onChange={(e) => onSetBrainstormPrompt(e.target.value)}
          rows={10}
        />
      )}

      <Textarea
        label={he.instructor.guidedSources}
        helpTooltip="מקורות קורס, מאמרים או ספרים שהטקסט צריך להתייחס אליהם"
        value={guidedSources}
        onChange={(e) => onSetGuidedSources(e.target.value)}
        placeholder={he.instructor.guidedSourcesPlaceholder}
        rows={8}
      />

      <Input
        label={he.instructor.guidedWordLimit}
        helpTooltip="טווח מומלץ: 300-700. למטלות עמוסות אפשר להעלות עד 1200"
        type="number"
        value={guidedWordLimit}
        onChange={(e) => onSetGuidedWordLimit(Number(e.target.value) || 500)}
        min={150}
        max={1200}
      />

      <div
        data-tour-id="tour-build-prompt"
        style={{ display: 'flex', justifyContent: 'flex-end', ...tourTargetStyle('tour-build-prompt') }}
      >
        <Button type="button" variant="secondary" onClick={onBuildPrompt}>
          {he.instructor.guidedBuildPrompt}
        </Button>
      </div>
      {renderTourHint('tour-build-prompt')}

      {guidedMessage && (
        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{guidedMessage}</div>
      )}
    </div>
  );
}
