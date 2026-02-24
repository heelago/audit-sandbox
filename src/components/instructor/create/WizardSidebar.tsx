'use client';

import { Button } from '@/components/ui/Button';
import styles from './WizardSidebar.module.css';

export type CreateWizardStep = {
  id: string;
  label: string;
  description: string;
  subStepCount: number;
};

interface WizardSidebarProps {
  steps: CreateWizardStep[];
  isNarrowScreen: boolean;
  mainStep: number;
  subStep: number;
  stepCompletion: boolean[];
  completedCount: number;
  activeStep: CreateWizardStep | null;
  onJumpStep: (index: number) => void;
  onMoveStep: (direction: 'next' | 'prev') => void;
}

export function WizardSidebar({
  steps,
  isNarrowScreen,
  mainStep,
  subStep,
  stepCompletion,
  completedCount,
  activeStep,
  onJumpStep,
  onMoveStep,
}: WizardSidebarProps) {
  return (
    <aside
      className={styles.sidebar}
      data-narrow={isNarrowScreen ? 'true' : 'false'}
      role="navigation"
      aria-label="שלבי יצירת מטלה"
    >
      <div className={styles.title}>שלבי יצירת המטלה</div>
      <div className={styles.description}>
        {activeStep?.description}
      </div>
      <div className={styles.stepList}>
        {!isNarrowScreen && (
          <div aria-hidden className={styles.stepLine} />
        )}
        {steps.map((step, index) => {
          const isActive = index === mainStep;
          const isDone = stepCompletion[index];
          const state = isDone ? 'done' : isActive ? 'active' : 'pending';
          const statusLabel =
            state === 'done' ? 'הושלם' : state === 'active' ? 'שלב פעיל' : 'ממתין';
          return (
            <div key={step.id} className={styles.stepRow}>
              <div className={styles.markerWrap}>
                <span
                  aria-hidden
                  className={styles.marker}
                  data-state={state}
                />
              </div>
              <button
                type="button"
                className={styles.stepButton}
                data-state={state}
                onClick={() => onJumpStep(index)}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`${step.label} — ${statusLabel}`}
              >
                <div>{step.label}</div>
                <div className={styles.stepStatus}>{statusLabel}</div>
                {step.subStepCount > 1 && (
                  <div className={styles.subStepDots}>
                    {Array.from({ length: step.subStepCount }).map((_, si) => (
                      <span
                        key={si}
                        className={styles.subStepDot}
                        data-done={isDone || (isActive && si < subStep) ? 'true' : 'false'}
                        data-active={isActive && si === subStep ? 'true' : 'false'}
                      />
                    ))}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
      <div className={styles.progressLabel}>
        התקדמות: {completedCount}/{steps.length}
      </div>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{
            width: `${Math.max(10, Math.round((completedCount / steps.length) * 100))}%`,
          }}
        />
      </div>
      <div className={styles.navRow}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onMoveStep('prev')}
          disabled={mainStep === 0}
        >
          הקודם
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onMoveStep('next')}
          disabled={mainStep >= steps.length - 1}
        >
          הבא
        </Button>
      </div>
    </aside>
  );
}
