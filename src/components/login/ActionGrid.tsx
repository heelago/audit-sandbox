import styles from '@/app/page.module.css';

export function ActionGrid() {
  return (
    <div className={styles.actionGrid}>
      <article className={styles.actionCard}>
        <p className={styles.actionCardTitle}>סיור מודרך במערכת</p>
        <p className={styles.actionCardText}>
          חוויית דמו אינטראקטיבית שמדגימה את זרימת העבודה של מרצה וסטודנט.
        </p>
        <a className={styles.actionCardLink} href="/showcase">כניסה לסיור</a>
      </article>
      <article className={styles.actionCard}>
        <p className={styles.actionCardTitle}>בקשת גישה למרצים</p>
        <p className={styles.actionCardText}>
          השאירו פרטים לקבלת גישה לדמו השמיש עם קוד אישי לאחר אישור.
        </p>
        <a className={styles.actionCardLink} href="#request-access">מעבר לטופס</a>
      </article>
      <article className={styles.actionCard}>
        <p className={styles.actionCardTitle}>כניסה עם קוד קיים</p>
        <p className={styles.actionCardText}>
          אם כבר קיבלתם קוד גישה, אפשר להתחבר מיד ולעבוד במערכת.
        </p>
        <a className={styles.actionCardLink} href="#code-login">כניסה עם קוד</a>
      </article>
    </div>
  );
}
