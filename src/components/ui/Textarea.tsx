import React, { useId } from 'react';
import styles from './Textarea.module.css';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helpTooltip?: string;
};

export function Textarea({ label, helpTooltip, className, id, ...rest }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className={styles.wrapper}>
      {label && (
        <div className={styles.labelRow}>
          <label htmlFor={textareaId} className={styles.label}>
            {label}
          </label>
          {helpTooltip && (
            <span className={styles.infoDot} title={helpTooltip} aria-label={helpTooltip}>
              i
            </span>
          )}
        </div>
      )}
      <textarea
        id={textareaId}
        className={[styles.textarea, className].filter(Boolean).join(' ')}
        {...rest}
      />
    </div>
  );
}
