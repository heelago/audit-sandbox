import { ANNOTATION_TYPES } from '@/lib/constants';

export function AnnotationLegend() {
  return (
    <div
      style={{
        padding: '7px 20px',
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '14px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      {ANNOTATION_TYPES.map((t) => (
        <div
          key={t.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              background: t.color,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              color: 'var(--ink-faint)',
            }}
          >
            {t.label}
          </span>
        </div>
      ))}
    </div>
  );
}
