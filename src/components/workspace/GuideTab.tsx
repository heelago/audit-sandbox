import { annotationIcons } from '@/components/icons';
import { he } from '@/locale/he';
import { ANNOTATION_TYPES } from '@/lib/constants';

export function GuideTab() {
  return (
    <div
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: 'var(--ink-soft)',
        lineHeight: '1.7',
        direction: 'rtl',
        textAlign: 'right',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '16px',
          fontWeight: 500,
          color: 'var(--ink)',
          marginBottom: '10px',
        }}
      >
        {he.sidebar.guideTitle}
      </div>
      <div
        style={{
          background: 'var(--bg)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '14px',
          fontSize: '12.5px',
        }}
      >
        <strong style={{ color: 'var(--ink)' }}>{he.sidebar.guideIntro}</strong>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--ink)',
          marginBottom: '8px',
        }}
      >
        {he.sidebar.annotationTypesTitle}
      </div>
      {ANNOTATION_TYPES.map((t) => {
        const Icon = annotationIcons[t.id];
        return (
          <div
            key={t.id}
            style={{
              marginBottom: '8px',
              padding: '8px 10px',
              background: t.color + '08',
              borderRadius: '6px',
              border: `1px solid ${t.color}18`,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: '12px',
                color: t.color,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {Icon && <Icon size={13} color={t.color} />} {t.label}
            </div>
            <div
              style={{
                fontSize: '11.5px',
                color: 'var(--ink-soft)',
                marginTop: '2px',
              }}
            >
              {t.desc}
            </div>
          </div>
        );
      })}

      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--ink)',
          margin: '16px 0 8px',
        }}
      >
        {he.sidebar.scoringTitle}
      </div>
      <div
        style={{
          background: 'var(--bg)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '12px',
          lineHeight: '2',
        }}
      >
        <div style={{ color: 'var(--success)' }}>
          + {he.scoring.pointsFor.errorsFound}
        </div>
        <div style={{ color: 'var(--success)' }}>
          + {he.scoring.pointsFor.verified}
        </div>
        <div style={{ color: '#A68A2B' }}>
          + {he.scoring.pointsFor.alternatives}
        </div>
        <div style={{ color: 'var(--gap)' }}>
          + {he.scoring.pointsFor.gaps}
        </div>
        <div style={{ color: 'var(--info)' }}>
          + {he.scoring.pointsFor.nuance}
        </div>
        <div
          style={{
            marginTop: '6px',
            borderTop: '1px solid var(--border)',
            paddingTop: '6px',
          }}
        >
          <div style={{ color: 'var(--error)' }}>
            - {he.scoring.pointsAgainst.unverified}
          </div>
          <div style={{ color: 'var(--error)' }}>
            - {he.scoring.pointsAgainst.missed}
          </div>
          <div style={{ color: 'var(--error)' }}>
            - {he.scoring.pointsAgainst.unsupported}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '14px',
          padding: '12px',
          background: 'var(--bg)',
          borderRadius: '8px',
          fontSize: '12px',
          lineHeight: '1.8',
        }}
      >
        <strong>{he.sidebar.tipsTitle}:</strong>
        <div style={{ marginTop: '4px' }}>
          {he.sidebar.tips.map((tip, i) => (
            <div key={i}>{tip}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
