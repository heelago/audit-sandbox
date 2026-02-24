import { CloseIcon, annotationIcons } from '@/components/icons';
import { he } from '@/locale/he';
import { ANNOTATION_TYPES } from '@/lib/constants';
import type { AnnotationType } from '@/components/ui/Badge';

interface SelectionToolbarProps {
  onCreateAnnotation: (typeId: AnnotationType) => void;
  onDismiss: () => void;
}

export function SelectionToolbar({ onCreateAnnotation, onDismiss }: SelectionToolbarProps) {
  return (
    <div
      style={{
        padding: '8px 20px',
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          color: 'var(--ink-faint)',
          marginLeft: '4px',
        }}
      >
        {he.workspace.tagAs}
      </span>
      {ANNOTATION_TYPES.map((t) => {
        const Icon = annotationIcons[t.id];
        return (
          <button
            key={t.id}
            onClick={() => onCreateAnnotation(t.id)}
            title={t.desc}
            style={{
              background: t.color + '14',
              border: `1px solid ${t.color}44`,
              borderRadius: '10px',
              padding: '3px 11px',
              fontFamily: 'var(--font-body)',
              fontSize: '11.5px',
              color: t.color,
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            {Icon && <Icon size={12} color={t.color} />} {t.label}
          </button>
        );
      })}
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          marginRight: 'auto',
        }}
      >
        <CloseIcon size={14} color="var(--ink-faint)" />
      </button>
    </div>
  );
}
