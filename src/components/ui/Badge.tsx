import React from 'react';
import styles from './Badge.module.css';
import { annotationIcons } from '@/components/icons';

/* ------------------------------------------------------------------ */
/* Annotation type definitions                                        */
/* ------------------------------------------------------------------ */

export type AnnotationType =
  | 'error'
  | 'verified'
  | 'alternative'
  | 'gap'
  | 'nuance'
  | 'accepted';

const annotationMeta: Record<
  AnnotationType,
  { color: string; label: string }
> = {
  error:       { color: '#B54D4D', label: '\u05D0\u05D9-\u05D3\u05D9\u05D5\u05E7' },
  verified:    { color: '#4D8B6A', label: '\u05D0\u05D5\u05DE\u05EA \u05DB\u05DE\u05D3\u05D5\u05D9\u05E7' },
  alternative: { color: '#A68A2B', label: '\u05D7\u05DC\u05D5\u05E4\u05D4 \u05E2\u05D3\u05D9\u05E4\u05D4' },
  gap:         { color: '#9B6B42', label: '\u05E8\u05DB\u05D9\u05D1 \u05D7\u05E1\u05E8' },
  nuance:      { color: '#4A6F8B', label: '\u05E0\u05D9\u05D5\u05D0\u05E0\u05E1 \u05D3\u05D9\u05E1\u05E6\u05D9\u05E4\u05DC\u05D9\u05E0\u05E8\u05D9' },
  accepted:    { color: '#7A7568', label: '\u05D0\u05D5\u05E9\u05E8 \u2014 \u05E2\u05DD \u05E0\u05D9\u05DE\u05D5\u05E7' },
};

/* ------------------------------------------------------------------ */
/* Status badge                                                       */
/* ------------------------------------------------------------------ */

interface StatusBadgeProps {
  children: React.ReactNode;
  color: string;
  bg: string;
  className?: string;
  style?: React.CSSProperties;
}

export function StatusBadge({
  children,
  color,
  bg,
  className,
  style,
}: StatusBadgeProps) {
  return (
    <span
      className={[styles.status, className].filter(Boolean).join(' ')}
      style={{ color, backgroundColor: bg, ...style }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Annotation type badge                                              */
/* ------------------------------------------------------------------ */

interface AnnotationBadgeProps {
  annotationType: AnnotationType;
  showIcon?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function AnnotationBadge({
  annotationType,
  showIcon = true,
  className,
  style,
}: AnnotationBadgeProps) {
  const meta = annotationMeta[annotationType];
  const Icon = annotationIcons[annotationType];

  return (
    <span
      className={[styles.annotation, className].filter(Boolean).join(' ')}
      style={{
        color: meta.color,
        backgroundColor: `${meta.color}14`,
        border: `1px solid ${meta.color}33`,
        ...style,
      }}
    >
      {showIcon && Icon && <Icon size={13} color={meta.color} />}
      {meta.label}
    </span>
  );
}
