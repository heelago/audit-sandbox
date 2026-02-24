'use client';

import {
  type DisciplinePresetId,
  type PlantedSignalId,
  PLANTED_SIGNAL_PRESETS,
  PLANTED_SIGNAL_LIBRARY,
  getPlantedSignalPresetById,
} from '@/lib/ai/planted-signals';
import { Button } from '@/components/ui/Button';

interface PresetSuggestion {
  presetId: DisciplinePresetId;
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
}

interface PlantedSignalsPanelProps {
  selectedPlantedSignals: PlantedSignalId[];
  selectedPresetId: DisciplinePresetId;
  presetSuggestion: PresetSuggestion;
  presetPinnedByUser: boolean;
  onToggleSignal: (id: PlantedSignalId) => void;
  onApplyPreset: (id: DisciplinePresetId) => void;
  onApplySuggested: () => void;
  onResumeAuto: () => void;
  onSelectPreset: (id: DisciplinePresetId) => void;
}

export function PlantedSignalsPanel({
  selectedPlantedSignals,
  selectedPresetId,
  presetSuggestion,
  presetPinnedByUser,
  onToggleSignal,
  onApplyPreset,
  onApplySuggested,
  onResumeAuto,
  onSelectPreset,
}: PlantedSignalsPanelProps) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--card)',
        padding: 10,
        display: 'grid',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
        תגיות כשלים לשתילה בטקסט
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
        בחר/י אילו AI-isms לשלב במכוון ביצירה. מנגנון הביקורת יקבל את האותות האלו כיעדי זיהוי בנוסף לביקורת כללית.
      </div>
      <div
        style={{
          border: '1px solid var(--border-light)',
          borderRadius: 10,
          background: 'var(--card-hover)',
          padding: 8,
          display: 'grid',
          gap: 6,
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>
          פריסטים מומלצים לפי תחום
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={selectedPresetId}
            onChange={(event) => onSelectPreset(event.target.value as DisciplinePresetId)}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 8px',
              background: 'var(--card)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
            }}
          >
            {PLANTED_SIGNAL_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onApplyPreset(selectedPresetId)}
          >
            החל פריסט
          </Button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)', lineHeight: 1.5 }}>
          {getPlantedSignalPresetById(selectedPresetId)?.description ?? ''}
        </div>
        <div
          style={{
            border: '1px dashed var(--border)',
            borderRadius: 8,
            padding: 8,
            background: 'var(--card)',
            display: 'grid',
            gap: 6,
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
            הצעה אוטומטית: {getPlantedSignalPresetById(presetSuggestion.presetId)?.label ?? 'אקדמי כללי'} (
            {presetSuggestion.confidence === 'high'
              ? 'התאמה גבוהה'
              : presetSuggestion.confidence === 'medium'
                ? 'התאמה בינונית'
                : 'התאמה נמוכה'}
            )
          </div>
          {presetSuggestion.matchedKeywords.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              זוהו מילות מפתח: {presetSuggestion.matchedKeywords.join(', ')}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button type="button" variant="secondary" onClick={onApplySuggested}>
              החל הצעה אוטומטית
            </Button>
            <Button type="button" variant="secondary" onClick={onResumeAuto}>
              הפעל זיהוי אוטומטי
            </Button>
            <span style={{ fontSize: 11, color: 'var(--ink-faint)', alignSelf: 'center' }}>
              מצב נוכחי: {presetPinnedByUser ? 'נעול ידנית' : 'אוטומטי'}
            </span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {PLANTED_SIGNAL_LIBRARY.map((signal) => {
          const active = selectedPlantedSignals.includes(signal.id);
          return (
            <button
              key={signal.id}
              type="button"
              onClick={() => onToggleSignal(signal.id)}
              title={signal.generationHint}
              style={{
                border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: active ? 'var(--accent-soft)' : 'var(--card-hover)',
                color: active ? 'var(--accent)' : 'var(--ink-soft)',
                borderRadius: 999,
                padding: '5px 10px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {signal.label}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
        אותות שנבחרו: {selectedPlantedSignals.length}
      </div>
    </div>
  );
}
