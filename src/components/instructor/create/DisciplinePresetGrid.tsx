'use client';

import {
  type DisciplinePresetId,
  PLANTED_SIGNAL_PRESETS,
} from '@/lib/ai/planted-signals';
import styles from './WizardStepCard.module.css';

interface DisciplinePresetGridProps {
  selectedPresetId: DisciplinePresetId;
  suggestedPresetId?: DisciplinePresetId;
  onSelect: (id: DisciplinePresetId) => void;
}

export function DisciplinePresetGrid({
  selectedPresetId,
  suggestedPresetId,
  onSelect,
}: DisciplinePresetGridProps) {
  return (
    <div className={styles.selectGrid} data-cols="2">
      {PLANTED_SIGNAL_PRESETS.map((preset) => {
        const isSelected = preset.id === selectedPresetId;
        const isSuggested = preset.id === suggestedPresetId;
        return (
          <button
            key={preset.id}
            type="button"
            className={styles.selectCard}
            data-selected={isSelected ? 'true' : 'false'}
            data-selectable
            onClick={() => onSelect(preset.id)}
          >
            <div className={styles.selectCardLabel}>{preset.label}</div>
            <div className={styles.selectCardDesc}>{preset.description}</div>
            {isSuggested && !isSelected && (
              <div className={styles.selectCardRecommended}>מומלץ עבורך</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
