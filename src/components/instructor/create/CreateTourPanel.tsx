'use client';

import { Button } from '@/components/ui/Button';

export type CreateTourStep = {
  id: string;
  title: string;
  description: string;
  targetId: string;
  openPromptEditor?: boolean;
  openGuidedBuilder?: boolean;
};

interface CreateTourPanelProps {
  tourOpen: boolean;
  tourStepIndex: number;
  totalSteps: number;
  activeStep: CreateTourStep | null;
  onStart: () => void;
  onClose: () => void;
  onMove: (direction: 'next' | 'prev') => void;
}

export function CreateTourPanel({
  tourOpen,
  tourStepIndex,
  totalSteps,
  activeStep,
  onStart,
  onClose,
  onMove,
}: CreateTourPanelProps) {
  return (
    <div
      data-tour-id="tour-panel"
      style={{
        border: '1px solid var(--sage-border)',
        borderRadius: 12,
        background: 'var(--sage-surface)',
        padding: 14,
        marginBottom: 18,
        display: 'grid',
        gap: 10,
      }}
    >
      {!tourOpen && (
        <>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sage-text)' }}>
            סיור מודרך בעמוד יצירת מטלה
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
            לא צריך להיות מומחה/ית לפרומפטים. עונים על כמה שאלות, והמערכת בונה את המבנה מאחורי הקלעים.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={onStart}>
              התחלת סיור בן 60 שניות
            </Button>
          </div>
        </>
      )}

      {tourOpen && activeStep && (
        <>
          <div style={{ fontSize: 12, color: 'var(--accent-emphasis)', fontWeight: 700 }}>
            שלב {tourStepIndex + 1} מתוך {totalSteps}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--sage-text)' }}>
            {activeStep.title}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
            {activeStep.description}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
            הטיפ: האזור הפעיל בעמוד מסומן בהדגשה.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              סיום סיור
            </Button>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onMove('prev')}
                disabled={tourStepIndex === 0}
              >
                הקודם
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onMove('next')}
                disabled={tourStepIndex >= totalSteps - 1}
              >
                הבא
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
