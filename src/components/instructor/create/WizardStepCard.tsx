'use client';

import { type ReactNode, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import styles from './WizardStepCard.module.css';

interface WizardStepCardProps {
  stepNumber: number;
  totalSteps: number;
  question: string;
  explanation: string;
  example?: string | string[];
  impactLabels?: string[];
  children: ReactNode;
  onPrev: () => void;
  onNext: () => void;
  canGoNext?: boolean;
  canGoPrev?: boolean;
  isFirst: boolean;
  isLast: boolean;
  nextLabel?: string;
}

export function WizardStepCard({
  stepNumber,
  totalSteps,
  question,
  explanation,
  example,
  impactLabels,
  children,
  onPrev,
  onNext,
  canGoNext = true,
  canGoPrev = true,
  isFirst,
  isLast,
  nextLabel,
}: WizardStepCardProps) {
  const [showExample, setShowExample] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowExample(false);
    // Auto-focus first focusable input in the card
    const timer = setTimeout(() => {
      const input = cardRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), textarea, select, [role="button"], button[data-selectable]'
      );
      if (input && !input.closest('[data-nav]')) {
        input.focus();
      }
    }, 260);
    return () => clearTimeout(timer);
  }, [stepNumber]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      const target = e.target as HTMLElement;
      // Don't intercept Enter in textareas
      if (target.tagName === 'TEXTAREA') return;
      if (!isLast && canGoNext) {
        e.preventDefault();
        onNext();
      }
    }
  }

  return (
    <div
      className={styles.cardOuter}
      ref={cardRef}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.card}>
        <div className={styles.progressLabel}>
          שלב {stepNumber} מתוך {totalSteps}
        </div>

        <h2 className={styles.question}>{question}</h2>

        <p className={styles.explanation}>{explanation}</p>

        {example && (
          <>
            <button
              type="button"
              className={styles.exampleToggle}
              onClick={() => setShowExample(!showExample)}
            >
              {showExample ? 'הסתר דוגמה ▲' : 'הצג דוגמה ▼'}
            </button>
            {showExample && (
              <div className={styles.exampleBox}>
                {Array.isArray(example)
                  ? example.map((line, i) => (
                      <p key={i} className={styles.exampleLine}>{line}</p>
                    ))
                  : example}
              </div>
            )}
          </>
        )}

        {impactLabels && impactLabels.length > 0 && (
          <div className={styles.impactTags}>
            {impactLabels.map((label) => (
              <span key={label} className={styles.impactTag}>
                {label}
              </span>
            ))}
          </div>
        )}

        <div className={styles.inputArea}>{children}</div>

        <div className={styles.navRow} data-nav>
          <Button
            type="button"
            variant="secondary"
            onClick={onPrev}
            disabled={isFirst || !canGoPrev}
          >
            הקודם
          </Button>
          <Button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
          >
            {isLast ? (nextLabel ?? 'יצירת מטלה') : 'הבא'}
          </Button>
        </div>
      </div>
    </div>
  );
}
