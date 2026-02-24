'use client';

import { useCallback } from 'react';
import { useModalEscape } from '@/hooks/useModalEscape';
import styles from '@/app/page.module.css';

interface PhilosophyModalProps {
  onClose: () => void;
}

export function PhilosophyModal({ onClose }: PhilosophyModalProps) {
  const stableOnClose = useCallback(() => onClose(), [onClose]);
  useModalEscape(true, stableOnClose);

  return (
    <div
      className={styles.philosophyOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="הפילוסופיה החינוכית וזרימת עבודה למרצה"
      onClick={onClose}
    >
      <section className={styles.philosophyModal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.philosophyHeader}>
          <div>
            <h2 className={styles.philosophyTitle}>למה הפלטפורמה הזו קיימת</h2>
            <p className={styles.philosophySubtitle}>
              זהו ניסוי פדגוגי: AI כאן כדי להישאר, ולכן המטרה אינה להחרים אותו אלא ללמד שימוש ביקורתי,
              אחראי ומבוסס אימות בתחום הדעת.
            </p>
          </div>
          <button type="button" className={styles.philosophyClose} onClick={onClose}>
            סגירה
          </button>
        </div>

        <section className={styles.philosophySection}>
          <p className={styles.philosophySectionTitle}>עקרונות ההוראה במערכת</p>
          <div className={styles.philosophyGrid}>
            <article className={styles.philosophyCard}>
              <p className={styles.philosophyCardTitle}>1. ניסוי מבוקר ולא אמת מוחלטת</p>
              <p className={styles.philosophyCardText}>
                מטלות נבנות כך שהסטודנטים נדרשים לבדוק טענות, לאמץ ספק מקצועי ולנמק החלטות.
              </p>
            </article>
            <article className={styles.philosophyCard}>
              <p className={styles.philosophyCardTitle}>2. התוכן קודם לצורה</p>
              <p className={styles.philosophyCardText}>
                ניסוח שוטף לא מעיד על אמינות. הסטודנטים לומדים לזהות טעויות, השמטות וניואנסים תחומיים.
              </p>
            </article>
            <article className={styles.philosophyCard}>
              <p className={styles.philosophyCardTitle}>3. אחריות על אימות</p>
              <p className={styles.philosophyCardText}>
                אפשר להשתמש בכלי עזר, אבל כל טענה מאומתת חייבת נימוק וראיה שהסטודנט עומד מאחוריהם.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.philosophySection}>
          <p className={styles.philosophySectionTitle}>מה קורה אחרי כניסת מרצה</p>
          <ol className={styles.philosophyList}>
            <li className={styles.philosophyListItem}>
              מגדירים מטלה בשפה טבעית: נושא, דרישות, ועד 3 שאלות/סעיפים.
            </li>
            <li className={styles.philosophyListItem}>
              בוחרים קריטריונים שהמערכת תחפש (אי-דיוקים, פערים, ניואנסים חסרים ועוד).
            </li>
            <li className={styles.philosophyListItem}>
              מריצים סוכני ביקורת לקבלת דוח ראשוני ומכוונים משקל לכל סוג בעיה.
            </li>
            <li className={styles.philosophyListItem}>
              מבצעים כיול: מוסיפים תגיות ידניות, הערות מרצה והנחיות המשך.
            </li>
            <li className={styles.philosophyListItem}>
              משחררים לסטודנטים מטלה מתועדת עם ציפיות ברורות לאימות ונימוק.
            </li>
          </ol>
        </section>

        <section className={styles.philosophySection}>
          <p className={styles.philosophySectionTitle}>מה הסטודנט מתרגל בפועל</p>
          <ol className={styles.philosophyList}>
            <li className={styles.philosophyListItem}>סימון קטעים חשודים בטקסט והצמדת סוג טענה.</li>
            <li className={styles.philosophyListItem}>הסבר למה מדובר בבעיה מקצועית ולא רק סגנונית.</li>
            <li className={styles.philosophyListItem}>הצעת תיקון והצגת דרך אימות עם מקור או בדיקה.</li>
          </ol>
        </section>
      </section>
    </div>
  );
}
