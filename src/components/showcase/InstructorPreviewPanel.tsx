'use client';

import type { AnnotationType } from '@/components/ui/Badge';
import styles from '@/app/showcase/showcase.module.css';

type RoleMode = 'instructor' | 'student';

type InstructorJourneyTarget =
  | 'tour-instructor-builder'
  | 'tour-instructor-criteria'
  | 'tour-instructor-weights'
  | 'tour-instructor-followup'
  | 'tour-instructor-findings';

interface InstructorJourneyStep {
  id: string;
  title: string;
  description: string;
  target: InstructorJourneyTarget;
}

interface InstructorPreviewPanelProps {
  roleMode: RoleMode;
  activeInstructorTarget: string | null;
  instructorStepCompletion: Record<InstructorJourneyTarget, boolean>;
  journeySteps: InstructorJourneyStep[];
  builderSectionCount: number;
  builderMode: 'natural' | 'balanced_errors';
  selectedCriteriaCount: number;
  agentRuns: number;
  displayedFindingsCount: number;
  instructorTagsCount: number;
  onJumpToInstructorStep: (target: InstructorJourneyTarget) => void;
}

export function InstructorPreviewPanel({
  roleMode,
  activeInstructorTarget,
  instructorStepCompletion,
  journeySteps,
  builderSectionCount,
  builderMode,
  selectedCriteriaCount,
  agentRuns,
  displayedFindingsCount,
  instructorTagsCount,
  onJumpToInstructorStep,
}: InstructorPreviewPanelProps) {
  return (
    <section className={styles.instructorPreviewPanel} aria-label="איך נראה צד המרצה">
      <div className={styles.instructorPreviewHeader}>
        <p className={styles.instructorPreviewTitle}>כך נראה תהליך העבודה של מרצה במערכת</p>
        <p className={styles.instructorPreviewMeta}>
          המרצה עונה על שאלות מובנות, והמערכת מרכיבה את הפרומפט מאחורי הקלעים.
        </p>
      </div>
      <div className={styles.instructorPreviewGrid}>
        <article className={styles.instructorPreviewCard}>
          <p className={styles.instructorPreviewCardTitle}>שלבי עבודה</p>
          <ol className={styles.instructorFlowList}>
            {journeySteps.map((step, index) => {
              const isActive = roleMode === 'instructor' && activeInstructorTarget === step.target;
              const isComplete = instructorStepCompletion[step.target];
              return (
                <li
                  key={step.id}
                  className={`${styles.instructorFlowItem} ${
                    isActive ? styles.instructorFlowItemActive : ''
                  } ${isComplete ? styles.instructorFlowItemDone : ''}`}
                >
                  <button
                    type="button"
                    className={styles.instructorFlowBtn}
                    onClick={() => onJumpToInstructorStep(step.target)}
                  >
                    <span className={styles.instructorFlowIndex}>{index + 1}</span>
                    <span className={styles.instructorFlowBody}>
                      <span className={styles.instructorFlowTitle}>{step.title}</span>
                      <span className={styles.instructorFlowDesc}>{step.description}</span>
                    </span>
                    <span className={styles.instructorFlowState}>
                      {isActive ? 'כעת' : isComplete ? 'בוצע' : 'ממתין'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </article>

        <article className={styles.instructorPreviewCard}>
          <p className={styles.instructorPreviewCardTitle}>מה המרצה מזין ומה מתקבל</p>
          <div className={styles.previewChips}>
            <span className={styles.previewChip}>עד {builderSectionCount} שאלות במטלה</span>
            <span className={styles.previewChip}>
              {builderMode === 'balanced_errors' ? 'שילוב כשלים מובנה' : 'ניסוח טבעי בלבד'}
            </span>
            <span className={styles.previewChip}>{selectedCriteriaCount} קריטריונים פעילים</span>
            <span className={styles.previewChipMuted}>ללא שמירה למסד בדמו</span>
          </div>
          <p className={styles.instructorPreviewCardSubTitle}>תמונת מצב בזמן אמת</p>
          <div className={styles.instructorPreviewStats}>
            <div className={styles.instructorPreviewStat}>
              <span className={styles.instructorPreviewStatLabel}>ריצות סוכנים</span>
              <strong>{agentRuns}</strong>
            </div>
            <div className={styles.instructorPreviewStat}>
              <span className={styles.instructorPreviewStatLabel}>ממצאים גלויים</span>
              <strong>{displayedFindingsCount}</strong>
            </div>
            <div className={styles.instructorPreviewStat}>
              <span className={styles.instructorPreviewStatLabel}>תגיות ידניות</span>
              <strong>{instructorTagsCount}</strong>
            </div>
          </div>
          <div className={styles.previewActionRow}>
            <span className={styles.previewActionPill}>יצירת 2 מטלות פיילוט</span>
            <span className={styles.previewActionPill}>הרצת סוכני דמו</span>
            <span className={styles.previewActionPill}>הוספת תגיות המשך</span>
          </div>
          <ol className={styles.previewQuestionList}>
            <li className={styles.previewQuestionItem}>הגדרת מבנה המטלה מתבצעת בשפה רגילה.</li>
            <li className={styles.previewQuestionItem}>בחירת הקריטריונים מתורגמת לבדיקה אוטומטית.</li>
            <li className={styles.previewQuestionItem}>המרצה מחליט מה לשחרר לסטודנטים לאחר כיול.</li>
          </ol>
        </article>
      </div>
    </section>
  );
}
