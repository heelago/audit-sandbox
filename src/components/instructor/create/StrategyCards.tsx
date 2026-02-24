'use client';

import styles from './WizardStepCard.module.css';

type GenerationStrategy = 'natural' | 'balanced_errors' | 'strict_truth';

const STRATEGIES: {
  id: GenerationStrategy;
  label: string;
  description: string;
  recommended?: boolean;
}[] = [
  {
    id: 'balanced_errors',
    label: 'שגיאות מאוזנות',
    description: 'טקסט עם שילוב מכוון של כשלים פדגוגיים לזיהוי. מומלץ כשיש כשלים מתוכננים.',
    recommended: true,
  },
  {
    id: 'natural',
    label: 'טבעי',
    description: 'טקסט שנוצר באופן טבעי ללא הכוונה מיוחדת לשגיאות. מתאים למטלות ללא כשלים מתוכננים.',
  },
  {
    id: 'strict_truth',
    label: 'אמת קפדנית',
    description: 'טקסט שמנסה להיות מדויק ככל האפשר. מתאים כשרוצים טקסט בסיסי לביקורת כללית.',
  },
];

interface StrategyCardsProps {
  selected: GenerationStrategy;
  hasPlantedSignals: boolean;
  onChange: (strategy: GenerationStrategy) => void;
}

export function StrategyCards({
  selected,
  hasPlantedSignals,
  onChange,
}: StrategyCardsProps) {
  return (
    <div className={styles.selectGrid} data-cols="3">
      {STRATEGIES.map((strategy) => {
        const isSelected = strategy.id === selected;
        const isRecommended = hasPlantedSignals && strategy.id === 'balanced_errors';
        return (
          <button
            key={strategy.id}
            type="button"
            className={styles.selectCard}
            data-selected={isSelected ? 'true' : 'false'}
            data-selectable
            onClick={() => onChange(strategy.id)}
          >
            <div className={styles.selectCardLabel}>{strategy.label}</div>
            <div className={styles.selectCardDesc}>{strategy.description}</div>
            {isRecommended && !isSelected && (
              <div className={styles.selectCardRecommended}>מומלץ — יש לך כשלים מתוכננים</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
