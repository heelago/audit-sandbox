import React, { useId } from 'react';
import styles from './Input.module.css';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helpTooltip?: string;
};

export function Input({ label, helpTooltip, className, id, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={styles.wrapper}>
      {label && (
        <div className={styles.labelRow}>
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
          {helpTooltip && (
            <span className={styles.infoDot} title={helpTooltip} aria-label={helpTooltip}>
              i
            </span>
          )}
        </div>
      )}
      <input
        id={inputId}
        className={[styles.input, className].filter(Boolean).join(' ')}
        {...rest}
      />
    </div>
  );
}
