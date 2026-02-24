'use client';

import { AnnotationBadge, type AnnotationType } from '@/components/ui/Badge';
import styles from '@/app/showcase/showcase.module.css';

interface StudentDraft {
  id: string;
  scenarioId: string;
  quote: string;
  tag: AnnotationType;
  why: string;
  fix: string;
  verify: string;
  evidence: string;
}

const annotationTypeOrder: AnnotationType[] = [
  'error', 'gap', 'nuance', 'alternative', 'verified', 'accepted',
];

const annotationTypeLabels: Record<AnnotationType, string> = {
  error: 'אי-דיוק',
  verified: 'אומת כמדויק',
  alternative: 'חלופה עדיפה',
  gap: 'רכיב חסר',
  nuance: 'ניואנס דיסציפלינרי',
  accepted: 'אושר — עם נימוק',
};

interface StudentViewProps {
  isWalkthroughTarget: (target: string) => boolean;
  studentProgress: number;
  studentScenarioDrafts: StudentDraft[];
  progressTarget: number;
  studentSubmitted: boolean;
  studentSelection: string;
  studentTag: AnnotationType;
  studentWhy: string;
  studentFix: string;
  studentVerify: string;
  studentEvidence: string;
  studentError: string | null;
  onCaptureStudentSelection: () => void;
  onSetStudentTag: (tag: AnnotationType) => void;
  onSetStudentWhy: (value: string) => void;
  onSetStudentFix: (value: string) => void;
  onSetStudentVerify: (value: string) => void;
  onSetStudentEvidence: (value: string) => void;
  onSaveStudentDraft: () => void;
  onSubmitStudentDemo: () => void;
}

export function StudentView({
  isWalkthroughTarget,
  studentProgress,
  studentScenarioDrafts,
  progressTarget,
  studentSubmitted,
  studentSelection,
  studentTag,
  studentWhy,
  studentFix,
  studentVerify,
  studentEvidence,
  studentError,
  onCaptureStudentSelection,
  onSetStudentTag,
  onSetStudentWhy,
  onSetStudentFix,
  onSetStudentVerify,
  onSetStudentEvidence,
  onSaveStudentDraft,
  onSubmitStudentDemo,
}: StudentViewProps) {
  return (
    <>
      <div
        id="tour-student-mission"
        className={`${styles.studentTaskCard} ${
          isWalkthroughTarget('tour-student-mission') ? styles.walkthroughTargetActive : ''
        }`}
      >
        <p className={styles.studentTaskTitle}>משימת הסטודנט</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>זהו לפחות 5 נקודות בעייתיות בטקסט.</li>
          <li className={styles.listItem}>תייגו כל נקודה לפי סוג הבעיה ונמקו למה.</li>
          <li className={styles.listItem}>תארו איך אימתתם ומה מצאתם בפועל.</li>
        </ul>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${studentProgress}%` }} />
        </div>
        <p className={styles.progressText}>
          התקדמות: {studentScenarioDrafts.length}/{progressTarget}
        </p>
        <button type="button" className={styles.studentSubmitBtn} onClick={onSubmitStudentDemo}>
          הגשת סקירת דמו
        </button>
        {studentSubmitted && (
          <p className={styles.studentSubmitDone}>
            ההגשה נקלטה בדמו. המרצה יכול כעת לסקור את הממצאים.
          </p>
        )}
      </div>

      <div
        id="tour-student-workbench"
        className={`${styles.studentWorkbench} ${
          isWalkthroughTarget('tour-student-workbench') ? styles.walkthroughTargetActive : ''
        }`}
      >
        <p className={styles.studentWorkbenchTitle}>עמדת תיוג לסטודנט</p>
        <div className={styles.studentActions}>
          <button
            type="button"
            className={styles.studentActionBtn}
            onClick={onCaptureStudentSelection}
          >
            לכידת טקסט מסומן
          </button>
        </div>
        <div className={styles.studentDraftBlock}>
          <p className={styles.studentDraftLabel}>ציטוט מסומן</p>
          <p className={styles.studentDraftQuote}>{studentSelection || 'טרם נבחר טקסט.'}</p>
        </div>

        <label className={styles.studentFieldLabel} htmlFor="student-tag">סוג תגית</label>
        <select
          id="student-tag"
          className={styles.studentSelect}
          value={studentTag}
          onChange={(event) => onSetStudentTag(event.target.value as AnnotationType)}
        >
          {annotationTypeOrder.map((type) => (
            <option key={type} value={type}>
              {annotationTypeLabels[type]}
            </option>
          ))}
        </select>

        <label className={styles.studentFieldLabel} htmlFor="student-why">למה זו בעיה?</label>
        <textarea id="student-why" className={styles.studentTextarea} value={studentWhy} onChange={(event) => onSetStudentWhy(event.target.value)} />
        <label className={styles.studentFieldLabel} htmlFor="student-fix">איך הייתם מתקנים?</label>
        <textarea id="student-fix" className={styles.studentTextarea} value={studentFix} onChange={(event) => onSetStudentFix(event.target.value)} />
        <label className={styles.studentFieldLabel} htmlFor="student-verify">איך אימתתם?</label>
        <textarea id="student-verify" className={styles.studentTextarea} value={studentVerify} onChange={(event) => onSetStudentVerify(event.target.value)} />
        <label className={styles.studentFieldLabel} htmlFor="student-evidence">הערת ראיות</label>
        <textarea id="student-evidence" className={styles.studentTextarea} value={studentEvidence} onChange={(event) => onSetStudentEvidence(event.target.value)} />

        {studentError && <p className={styles.studentError}>{studentError}</p>}

        <button type="button" className={styles.studentSaveBtn} onClick={onSaveStudentDraft}>
          שמירת תיוג
        </button>

        <div
          id="tour-student-saved"
          className={`${styles.studentSavedList} ${
            isWalkthroughTarget('tour-student-saved') ? styles.walkthroughTargetActive : ''
          }`}
        >
          <p className={styles.studentSavedTitle}>תיוגים שמורים ({studentScenarioDrafts.length})</p>
          {studentScenarioDrafts.length === 0 && (
            <p className={styles.studentSavedEmpty}>עדיין אין תיוגים שמורים.</p>
          )}
          {studentScenarioDrafts.map((draft) => (
            <article key={draft.id} className={styles.studentSavedCard}>
              <div className={styles.studentSavedHeader}>
                <AnnotationBadge annotationType={draft.tag} showIcon={false} />
              </div>
              <p className={styles.studentSavedQuote}>"{draft.quote}"</p>
              <p className={styles.studentSavedText}><strong>נימוק:</strong> {draft.why}</p>
              <p className={styles.studentSavedText}><strong>תיקון מוצע:</strong> {draft.fix}</p>
              <p className={styles.studentSavedText}><strong>אימות:</strong> {draft.verify}</p>
              <p className={styles.studentSavedText}><strong>ראיות:</strong> {draft.evidence}</p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
