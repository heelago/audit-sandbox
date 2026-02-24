'use client';

import { Button } from '@/components/ui/Button';

export type CreateWizardStep = {
  id: string;
  label: string;
  description: string;
  targetId: string;
  openPromptEditor?: boolean;
  openGuidedBuilder?: boolean;
};

interface WizardSidebarProps {
  steps: CreateWizardStep[];
  isNarrowScreen: boolean;
  wizardStepIndex: number;
  wizardStepCompletion: boolean[];
  wizardCompletedCount: number;
  activeWizardStep: CreateWizardStep | null;
  onJumpStep: (index: number) => void;
  onMoveStep: (direction: 'next' | 'prev') => void;
}

export function WizardSidebar({
  steps,
  isNarrowScreen,
  wizardStepIndex,
  wizardStepCompletion,
  wizardCompletedCount,
  activeWizardStep,
  onJumpStep,
  onMoveStep,
}: WizardSidebarProps) {
  return (
    <aside
      style={{
        width: isNarrowScreen ? '100%' : 280,
        flexShrink: 0,
        position: isNarrowScreen ? 'static' : 'sticky',
        top: isNarrowScreen ? 'auto' : 18,
        border: '1px solid #ddd6c8',
        borderRadius: 14,
        background: '#fcfaf5',
        padding: 14,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: '#3b3b3a' }}>עמוד שדרה של יצירת המטלה</div>
      <div style={{ fontSize: 12, color: '#6c6a66', lineHeight: 1.7 }}>
        {activeWizardStep?.description}
      </div>
      <div style={{ position: 'relative', display: 'grid', gap: 8 }}>
        {!isNarrowScreen && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: 12,
              top: 20,
              bottom: 20,
              width: 2,
              borderRadius: 999,
              background:
                'linear-gradient(180deg, rgba(133,168,139,0.55) 0%, rgba(184,93,59,0.45) 50%, rgba(196,206,214,0.5) 100%)',
            }}
          />
        )}
        {steps.map((step, index) => {
          const isActive = index === wizardStepIndex;
          const isDone = wizardStepCompletion[index];
          const state = isDone ? 'done' : isActive ? 'active' : 'pending';
          const stateColors =
            state === 'done'
              ? {
                  border: '#85A88B',
                  background: '#EDF3EE',
                  text: '#3f5f45',
                  marker: '#85A88B',
                  status: 'הושלם',
                }
              : state === 'active'
                ? {
                    border: '#B85D3B',
                    background: '#F6EDE9',
                    text: '#82432c',
                    marker: '#B85D3B',
                    status: 'שלב פעיל',
                  }
                : {
                    border: '#cadce8',
                    background: '#ffffff',
                    text: '#4f6c7d',
                    marker: '#bccad3',
                    status: 'ממתין',
                  };
          return (
            <div
              key={step.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '24px 1fr',
                alignItems: 'stretch',
                gap: 8,
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <span
                  aria-hidden
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 999,
                    background: stateColors.marker,
                    boxShadow: isActive ? '0 0 0 4px rgba(184, 93, 59, 0.15)' : 'none',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => onJumpStep(index)}
                style={{
                  border: `1px solid ${stateColors.border}`,
                  background: stateColors.background,
                  color: stateColors.text,
                  borderRadius: 10,
                  padding: '9px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'right',
                }}
              >
                <div>{step.label}</div>
                <div style={{ marginTop: 2, fontSize: 11, fontWeight: 500, color: stateColors.text }}>
                  {stateColors.status}
                </div>
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: '#6c6a66' }}>
        התקדמות: {wizardCompletedCount}/{steps.length}
      </div>
      <div
        aria-hidden
        style={{
          height: 6,
          borderRadius: 999,
          background: '#ece8de',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(
              10,
              Math.round((wizardCompletedCount / steps.length) * 100)
            )}%`,
            borderRadius: 999,
            background:
              'linear-gradient(90deg, rgba(133,168,139,0.95) 0%, rgba(184,93,59,0.92) 100%)',
            transition: 'width 160ms ease-out',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onMoveStep('prev')}
          disabled={wizardStepIndex === 0}
        >
          הקודם
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onMoveStep('next')}
          disabled={wizardStepIndex >= steps.length - 1}
        >
          הבא
        </Button>
      </div>
    </aside>
  );
}
