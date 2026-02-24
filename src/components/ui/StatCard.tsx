import React from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function StatCard({ label, value, sub, className, style }: StatCardProps) {
  return (
    <div
      className={[styles.card, className].filter(Boolean).join(' ')}
      style={style}
    >
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  );
}
