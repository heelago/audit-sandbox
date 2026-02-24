'use client';

import type React from 'react';
import { he } from '@/locale/he';
import { Textarea } from '@/components/ui/Textarea';

interface AdvancedPromptFieldsProps {
  courseContext: string;
  requirements: string;
  knownPitfalls: string;
  referenceMaterial: string;
  sectionBlueprint: string;
  evaluationCriteria: string;
  exemplarNotes: string;
  generationStrategy: 'natural' | 'balanced_errors' | 'strict_truth';
  tourTargetStyle: (id: string) => React.CSSProperties | undefined;
  renderTourHint: (id: string) => React.ReactNode;
  promptText: string;
  onPromptTextChange: (value: string) => void;
  onCourseContextChange: (value: string) => void;
  onRequirementsChange: (value: string) => void;
  onKnownPitfallsChange: (value: string) => void;
  onReferenceMaterialChange: (value: string) => void;
  onSectionBlueprintChange: (value: string) => void;
  onEvaluationCriteriaChange: (value: string) => void;
  onExemplarNotesChange: (value: string) => void;
  onGenerationStrategyChange: (value: 'natural' | 'balanced_errors' | 'strict_truth') => void;
}

export function AdvancedPromptFields({
  courseContext,
  requirements,
  knownPitfalls,
  referenceMaterial,
  sectionBlueprint,
  evaluationCriteria,
  exemplarNotes,
  generationStrategy,
  tourTargetStyle,
  renderTourHint,
  promptText,
  onPromptTextChange,
  onCourseContextChange,
  onRequirementsChange,
  onKnownPitfallsChange,
  onReferenceMaterialChange,
  onSectionBlueprintChange,
  onEvaluationCriteriaChange,
  onExemplarNotesChange,
  onGenerationStrategyChange,
}: AdvancedPromptFieldsProps) {
  return (
    <>
      <div data-tour-id="tour-prompt" style={tourTargetStyle('tour-prompt')}>
        <Textarea
          label={he.instructor.prompt}
          helpTooltip="זה הפרומפט המלא שנשלח ליצירת הטקסט. אפשר לערוך ידנית לפי הצורך"
          value={promptText}
          onChange={(e) => onPromptTextChange(e.target.value)}
          placeholder={he.instructor.promptPlaceholder}
          rows={10}
          required
        />
        {renderTourHint('tour-prompt')}
      </div>

      <Textarea
        label={he.instructor.courseContext}
        helpTooltip="רקע הקורס: שנה, תחום, הקשר פדגוגי, ומה כבר נלמד"
        value={courseContext}
        onChange={(e) => onCourseContextChange(e.target.value)}
        placeholder={he.instructor.courseContextPlaceholder}
        rows={3}
      />

      <Textarea
        label={he.instructor.requirements}
        helpTooltip="אורך, סגנון כתיבה, מבנה תשובה, מספר מקורות או כל דרישת חובה"
        value={requirements}
        onChange={(e) => onRequirementsChange(e.target.value)}
        placeholder={he.instructor.requirementsPlaceholder}
        rows={3}
      />

      <Textarea
        label={he.instructor.knownPitfalls}
        helpTooltip="מה AI נוטה לפספס בתחום הזה: הכללות, בלבול מושגים, מקורות חלשים ועוד"
        value={knownPitfalls}
        onChange={(e) => onKnownPitfallsChange(e.target.value)}
        placeholder={he.instructor.knownPitfallsPlaceholder}
        rows={8}
      />

      <Textarea
        label={he.instructor.referenceMaterial}
        helpTooltip="מקורות רקע או טקסט בסיס שהמטלה נשענת עליו"
        value={referenceMaterial}
        onChange={(e) => onReferenceMaterialChange(e.target.value)}
        placeholder={he.instructor.referenceMaterialPlaceholder}
        rows={8}
      />

      <Textarea
        label={he.instructor.sectionBlueprint}
        helpTooltip="אם המטלה בנויה מכמה חלקים, תארו כאן את מבנה החלקים בקצרה"
        value={sectionBlueprint}
        onChange={(e) => onSectionBlueprintChange(e.target.value)}
        placeholder={he.instructor.sectionBlueprintPlaceholder}
        rows={4}
      />

      <Textarea
        label={he.instructor.evaluationCriteria}
        helpTooltip="מה ייחשב תשובה טובה: קריטריונים תוכניים, דיוק, נימוק, ביסוס"
        value={evaluationCriteria}
        onChange={(e) => onEvaluationCriteriaChange(e.target.value)}
        placeholder={he.instructor.evaluationCriteriaPlaceholder}
        rows={10}
      />

      <Textarea
        label={he.instructor.exemplarNotes}
        helpTooltip="דוגמה קצרה או כיוון לתשובה איכותית שהיית רוצה לראות"
        value={exemplarNotes}
        onChange={(e) => onExemplarNotesChange(e.target.value)}
        placeholder={he.instructor.exemplarNotesPlaceholder}
        rows={4}
      />

      <label style={{ display: 'grid', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>
          {he.instructor.generationStrategy}
        </span>
        <select
          value={generationStrategy}
          onChange={(e) =>
            onGenerationStrategyChange(e.target.value as 'natural' | 'balanced_errors' | 'strict_truth')
          }
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            background: 'var(--card)',
            color: 'var(--ink)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
          }}
        >
          <option value="natural">{he.instructor.generationStrategyNatural}</option>
          <option value="balanced_errors">{he.instructor.generationStrategyBalanced}</option>
          <option value="strict_truth">{he.instructor.generationStrategyStrict}</option>
        </select>
      </label>
    </>
  );
}
