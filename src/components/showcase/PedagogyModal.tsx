'use client';

import { useModalEscape } from '@/hooks/useModalEscape';
import { showcaseIntro } from '@/lib/showcase-intro';
import styles from '@/app/showcase/showcase.module.css';

interface PedagogyModalProps {
  open: boolean;
  onClose: () => void;
}

export function PedagogyModal({ open, onClose }: PedagogyModalProps) {
  useModalEscape(open, onClose);

  if (!open) return null;

  return (
    <div
      className={styles.pedagogyModalOverlay}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={styles.pedagogyModal} role="dialog" aria-modal="true" aria-label="עקרונות פדגוגיים">
        <div className={styles.pedagogyModalHeader}>
          <h3 className={styles.pedagogyModalTitle}>המסגרת הפדגוגית של הדמו</h3>
          <button
            type="button"
            className={styles.pedagogyModalClose}
            onClick={onClose}
          >
            סגירה
          </button>
        </div>
        <p className={styles.pedagogyModalText}>{showcaseIntro.walkthroughRationale}</p>
        <div className={styles.introGrid}>
          <article className={styles.introCard}>
            <p className={styles.introCardTitle}>עקרונות</p>
            <ul className={styles.introList}>
              {showcaseIntro.principles.map((item, index) => (
                <li key={`modal-principle-${index}`} className={styles.introListItem}>
                  {item}
                </li>
              ))}
            </ul>
          </article>
          <article className={styles.introCard}>
            <p className={styles.introCardTitle}>{showcaseIntro.workflowTitle}</p>
            <ul className={styles.introList}>
              {showcaseIntro.workflow.map((item, index) => (
                <li key={`modal-workflow-${index}`} className={styles.introListItem}>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
