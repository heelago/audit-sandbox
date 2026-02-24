import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  borderAccent?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({
  children,
  borderAccent,
  className,
  style,
}: CardProps) {
  const accentStyle: React.CSSProperties = borderAccent
    ? { borderInlineStart: `4px solid ${borderAccent}` }
    : {};

  return (
    <div
      className={[styles.card, className].filter(Boolean).join(' ')}
      style={{ ...accentStyle, ...style }}
    >
      {children}
    </div>
  );
}
