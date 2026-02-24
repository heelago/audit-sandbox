'use client';

import type { ReactNode } from 'react';
import { AnnotationBadge, type AnnotationType } from '@/components/ui/Badge';
import type { ShowcaseSeverity } from '@/lib/showcase-data';
import styles from '@/app/showcase/showcase.module.css';

interface GenerationSectionBlueprint {
  id: string;
  title: string;
  question: string;
  mustInclude: string;
  embeddedFlaws: string[];
}

interface DisplayFinding {
  title: string;
  type: AnnotationType;
  severity?: ShowcaseSeverity;
  quote?: string;
  description: string;
  verificationStep?: string;
  source: 'system' | 'instructor';
}

interface CriteriaCatalogItem {
  id: string;
  title: string;
  desc: string;
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

const severityLabels: Record<ShowcaseSeverity, string> = {
  critical: 'קריטי',
  moderate: 'בינוני',
  minor: 'נמוך',
};

interface InstructorViewProps {
  isWalkthroughTarget: (target: string) => boolean;
  builderSectionCount: number;
  builderMode: 'natural' | 'balanced_errors';
  builderPreviewVersion: number;
  activeBlueprintSections: GenerationSectionBlueprint[];
  selectedCriteria: string[];
  selectedCriterionTitles: string[];
  criteriaCatalog: CriteriaCatalogItem[];
  agentRuns: number;
  weights: Record<AnnotationType, number>;
  weightedSignal: number;
  systemFindingsVisible: Array<{ title: string; type: string; quote?: string }>;
  activeSystemFindingIndex: number;
  displayedFindings: DisplayFinding[];
  instructorSelection: string;
  instructorTag: AnnotationType;
  instructorNote: string;
  instructorFollowup: string;
  instructorError: string | null;
  calibrationQuestions: string[];
  onSetBuilderSectionCount: (count: number) => void;
  onSetBuilderMode: (mode: 'natural' | 'balanced_errors') => void;
  onRunBuilderPreview: () => void;
  onToggleCriterion: (id: string) => void;
  onRunDemoAgents: () => void;
  onSetActiveSystemFindingIndex: (index: number) => void;
  onUpdateWeight: (type: AnnotationType, value: number) => void;
  onCaptureInstructorSelection: () => void;
  onSetInstructorTag: (tag: AnnotationType) => void;
  onSetInstructorNote: (value: string) => void;
  onSetInstructorFollowup: (value: string) => void;
  onSaveInstructorTag: () => void;
}

export function InstructorView({
  isWalkthroughTarget,
  builderSectionCount,
  builderMode,
  builderPreviewVersion,
  activeBlueprintSections,
  selectedCriteria,
  selectedCriterionTitles,
  criteriaCatalog,
  agentRuns,
  weights,
  weightedSignal,
  systemFindingsVisible,
  activeSystemFindingIndex,
  displayedFindings,
  instructorSelection,
  instructorTag,
  instructorNote,
  instructorFollowup,
  instructorError,
  calibrationQuestions,
  onSetBuilderSectionCount,
  onSetBuilderMode,
  onRunBuilderPreview,
  onToggleCriterion,
  onRunDemoAgents,
  onSetActiveSystemFindingIndex,
  onUpdateWeight,
  onCaptureInstructorSelection,
  onSetInstructorTag,
  onSetInstructorNote,
  onSetInstructorFollowup,
  onSaveInstructorTag,
}: InstructorViewProps) {
  return (
    <>
      <div
        id="tour-instructor-builder"
        className={`${styles.instructorCard} ${
          isWalkthroughTarget('tour-instructor-builder') ? styles.walkthroughTargetActive : ''
        }`}
      >
        <p className={styles.instructorTitle}>הקשר ונושא: כותרת, תחום ומשימת הסטודנט</p>
        <p className={styles.builderIntro}>
          המרצה מגדיר כותרת, תחום אקדמי ומשימת הסטודנט. המערכת מתאימה כשלים מתוכננים לתחום.
        </p>
        <div className={styles.builderControlRow}>
          <p className={styles.builderControlLabel}>מספר שאלות במטלה</p>
          <div className={styles.builderCountSwitch}>
            {[1, 2, 3].map((count) => (
              <button
                key={`count-${count}`}
                type="button"
                className={`${styles.builderCountBtn} ${
                  builderSectionCount === count ? styles.builderCountBtnActive : ''
                }`}
                onClick={() => onSetBuilderSectionCount(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.builderControlRow}>
          <p className={styles.builderControlLabel}>אסטרטגיית יצירה</p>
          <div className={styles.builderModeSwitch}>
            <button
              type="button"
              className={`${styles.builderModeBtn} ${
                builderMode === 'natural' ? styles.builderModeBtnActive : ''
              }`}
              onClick={() => onSetBuilderMode('natural')}
            >
              טבעי בלבד
            </button>
            <button
              type="button"
              className={`${styles.builderModeBtn} ${
                builderMode === 'balanced_errors' ? styles.builderModeBtnActive : ''
              }`}
              onClick={() => onSetBuilderMode('balanced_errors')}
            >
              טבעי + כשלים מכוונים
            </button>
          </div>
        </div>

        <div className={styles.builderSectionList}>
          {activeBlueprintSections.map((section) => (
            <article key={section.id} className={styles.builderSectionCard}>
              <p className={styles.builderSectionTitle}>{section.title}</p>
              <p className={styles.builderSectionQuestion}>
                <strong>שאלה:</strong> {section.question}
              </p>
              <p className={styles.builderSectionMust}>
                <strong>מה חייב להופיע:</strong> {section.mustInclude}
              </p>
              <p className={styles.builderSectionLabel}>מוקדי קושי לשילוב טבעי</p>
              <div className={styles.builderFlawTags}>
                {section.embeddedFlaws.map((flaw) => (
                  <span key={`${section.id}-${flaw}`} className={styles.builderFlawTag}>
                    {flaw}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className={styles.builderSummaryBox}>
          <p className={styles.builderSummaryTitle}>תצוגה מקדימה של הרצת יצירה</p>
          <p className={styles.builderSummaryText}>
            גרסה {builderPreviewVersion} | {builderSectionCount} שאלות |{' '}
            {builderMode === 'balanced_errors' ? 'שילוב כשלים פדגוגיים עדינים' : 'ללא הזרקת כשלים'}.
          </p>
        </div>

        <div className={styles.instructorActions}>
          <button type="button" className={styles.instructorPrimaryBtn} onClick={onRunBuilderPreview}>
            יצירת 2 מטלות פיילוט
          </button>
          <button type="button" className={styles.instructorSecondaryBtn} onClick={onRunBuilderPreview}>
            השלמה לשאר הסטודנטים
          </button>
        </div>

        <div className={styles.builderCalibrationCard}>
          <p className={styles.builderCalibrationTitle}>שאלות כיול לפני שחרור</p>
          <ul className={styles.builderCalibrationList}>
            {calibrationQuestions.map((question) => (
              <li key={question} className={styles.builderCalibrationItem}>
                {question}
              </li>
            ))}
          </ul>
        </div>

        <p className={styles.instructorStatus}>
          קריטריונים שנבחרו לניתוח: {selectedCriterionTitles.slice(0, 3).join(' | ') || 'טרם נבחרו'}.
        </p>
      </div>

      <div
        id="tour-instructor-criteria"
        className={`${styles.instructorCard} ${
          isWalkthroughTarget('tour-instructor-criteria') ? styles.walkthroughTargetActive : ''
        }`}
      >
        <p className={styles.instructorTitle}>כשלים מתוכננים וקריטריונים</p>
        <div className={styles.criteriaGrid}>
          {criteriaCatalog.map((criterion) => (
            <label key={criterion.id} className={styles.criterionItem}>
              <input
                type="checkbox"
                checked={selectedCriteria.includes(criterion.id)}
                onChange={() => onToggleCriterion(criterion.id)}
              />
              <div>
                <p className={styles.criterionTitle}>{criterion.title}</p>
                <p className={styles.criterionDesc}>{criterion.desc}</p>
              </div>
            </label>
          ))}
        </div>
        <div className={styles.instructorActions}>
          <button type="button" className={styles.instructorPrimaryBtn} onClick={onRunDemoAgents}>
            הרצת סוכני דמו
          </button>
          <button type="button" className={styles.instructorSecondaryBtn} onClick={onRunDemoAgents}>
            הרצת סבב נוסף
          </button>
        </div>
        <p className={styles.instructorStatus}>
          מספר ריצות: {agentRuns} | קריטריונים פעילים: {selectedCriteria.length}
        </p>
        {agentRuns > 0 && (
          <div className={styles.expectedFindingsBlock}>
            <p className={styles.expectedFindingsTitle}>
              ממצאים צפויים לסטודנט (מאומתים מראש בדמו)
            </p>
            <div className={styles.expectedFindingsList}>
              {systemFindingsVisible.map((finding, index) => (
                <button
                  key={`${finding.title}-${index}`}
                  type="button"
                  className={`${styles.expectedFindingBtn} ${
                    activeSystemFindingIndex === index ? styles.expectedFindingBtnActive : ''
                  }`}
                  onClick={() => onSetActiveSystemFindingIndex(index)}
                >
                  <AnnotationBadge annotationType={finding.type as AnnotationType} showIcon={false} />
                  <span className={styles.expectedFindingText}>{finding.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {instructorError && <p className={styles.instructorError}>{instructorError}</p>}
      </div>

      <div
        id="tour-instructor-weights"
        className={`${styles.instructorCard} ${
          isWalkthroughTarget('tour-instructor-weights') ? styles.walkthroughTargetActive : ''
        }`}
      >
        <p className={styles.instructorTitle}>הגדרות יצירה ומשקלים</p>
        <div className={styles.weightGrid}>
          {annotationTypeOrder.map((type) => (
            <div key={type} className={styles.weightRow}>
              <p className={styles.weightLabel}>{annotationTypeLabels[type]}</p>
              <input
                type="range"
                min={1}
                max={5}
                value={weights[type]}
                className={styles.weightSlider}
                onChange={(event) => onUpdateWeight(type, Number(event.target.value))}
              />
              <span className={styles.weightValue}>{weights[type]}</span>
            </div>
          ))}
        </div>
        <p className={styles.instructorStatus}>ציון משוקלל: {weightedSignal}</p>
      </div>

      <div
        id="tour-instructor-findings"
        className={`${styles.instructorCard} ${
          isWalkthroughTarget('tour-instructor-findings') ? styles.walkthroughTargetActive : ''
        }`}
      >
        <p className={styles.instructorTitle}>סקירה ויצירה: ממצאים ותגיות מרצה</p>

        <div className={styles.instructorActions}>
          <button type="button" className={styles.instructorSecondaryBtn} onClick={onCaptureInstructorSelection}>
            לכידת טקסט מסומן
          </button>
        </div>
        <div className={styles.selectionBox}>{instructorSelection || 'טרם נלכד טקסט.'}</div>
        <label className={styles.formLabel} htmlFor="inst-tag-type">סוג תגית</label>
        <select
          id="inst-tag-type"
          className={styles.formSelect}
          value={instructorTag}
          onChange={(event) => onSetInstructorTag(event.target.value as AnnotationType)}
        >
          {annotationTypeOrder.map((type) => (
            <option key={type} value={type}>
              {annotationTypeLabels[type]}
            </option>
          ))}
        </select>
        <label className={styles.formLabel} htmlFor="inst-note">למה זה חשוב?</label>
        <textarea
          id="inst-note"
          className={styles.formTextarea}
          value={instructorNote}
          onChange={(event) => onSetInstructorNote(event.target.value)}
        />
        <label className={styles.formLabel} htmlFor="inst-followup">הנחיית המשך לריצה הבאה</label>
        <textarea
          id="inst-followup"
          className={styles.formTextarea}
          value={instructorFollowup}
          onChange={(event) => onSetInstructorFollowup(event.target.value)}
        />
        <button type="button" className={styles.instructorPrimaryBtn} onClick={onSaveInstructorTag}>
          שמירת תגית מרצה
        </button>

        <div className={styles.findings} style={{ marginTop: 12 }}>
          {displayedFindings.length === 0 && (
            <div className={styles.emptyFindings}>הריצו סוכני דמו כדי לחשוף ממצאי מערכת.</div>
          )}
          {displayedFindings.map((finding, index) => (
            <article key={`${finding.title}-${index}`} className={styles.findingCard}>
              <div className={styles.findingHeader}>
                <AnnotationBadge annotationType={finding.type} showIcon={false} />
                {finding.severity && (
                  <span className={styles.severityPill} data-level={finding.severity}>
                    {severityLabels[finding.severity]}
                  </span>
                )}
              </div>
              <p className={styles.sourcePill} data-source={finding.source}>
                {finding.source === 'system' ? 'ממצא מערכת' : 'נוסף על ידי מרצה'}
              </p>
              <h3 className={styles.findingTitle}>{finding.title}</h3>
              {finding.quote && <p className={styles.findingQuote}>"{finding.quote}"</p>}
              <p className={styles.findingDesc}>{finding.description}</p>
              {finding.verificationStep && (
                <p className={styles.findingStep}>
                  <strong>צעד אימות:</strong> {finding.verificationStep}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
