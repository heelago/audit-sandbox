'use client';

import styles from '@/app/showcase/showcase.module.css';

type RoleMode = 'instructor' | 'student';

interface WalkthroughStep {
  id: string;
  role: RoleMode;
  title: string;
  description: string;
}

interface TooltipStyle {
  top: number;
  left: number;
  width: number;
  arrowLeft: number;
  placement: 'top' | 'bottom';
}

interface WalkthroughTooltipProps {
  activeStep: WalkthroughStep;
  stepIndex: number;
  totalSteps: number;
  tooltipStyle: TooltipStyle;
  onPrev: () => void;
  onNext: () => void;
  onStop: () => void;
}

export function WalkthroughTooltip({
  activeStep,
  stepIndex,
  totalSteps,
  tooltipStyle,
  onPrev,
  onNext,
  onStop,
}: WalkthroughTooltipProps) {
  return (
    <>
      <div className={styles.tourBackdrop} />
      <aside
        className={`${styles.tourTooltip} ${
          activeStep.role === 'instructor'
            ? styles.tourTooltipInstructor
            : styles.tourTooltipStudent
        }`}
        style={{
          top: `${tooltipStyle.top}px`,
          left: `${tooltipStyle.left}px`,
          width: `${tooltipStyle.width}px`,
        }}
        aria-live="polite"
      >
        <p className={styles.tourTooltipMeta}>
          שלב {stepIndex + 1} מתוך {totalSteps}
        </p>
        <p className={styles.tourTooltipTitle}>{activeStep.title}</p>
        <p className={styles.tourTooltipText}>{activeStep.description}</p>
        <div className={styles.tourTooltipActions}>
          <button
            type="button"
            className={styles.tourTooltipBtn}
            onClick={onPrev}
            disabled={stepIndex === 0}
          >
            הקודם
          </button>
          <button
            type="button"
            className={styles.tourTooltipBtnPrimary}
            onClick={onNext}
            disabled={stepIndex >= totalSteps - 1}
          >
            הבא
          </button>
          <button type="button" className={styles.tourTooltipBtn} onClick={onStop}>
            סיום
          </button>
        </div>
        <span
          className={styles.tourTooltipArrow}
          data-placement={tooltipStyle.placement}
          style={{ left: `${tooltipStyle.arrowLeft}px` }}
        />
      </aside>
    </>
  );
}
