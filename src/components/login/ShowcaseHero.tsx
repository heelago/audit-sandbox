import styles from '@/app/page.module.css';

interface ShowcaseHeroProps {
  onOpenPhilosophy: () => void;
}

export function ShowcaseHero({ onOpenPhilosophy }: ShowcaseHeroProps) {
  return (
    <div className={styles.showcaseHero}>
      <p className={styles.showcaseHeroTitle}>התחלה מהירה: הדגמה אינטראקטיבית</p>
      <p className={styles.showcaseHeroSubtitle}>
        ראו איך סטודנטים מתייגים ממצאים, מצרפים ראיות, ואיך מרצים בוחנים את התוצרים.
      </p>
      <div className={styles.showcaseHeroActions}>
        <a className={styles.showcaseCta} href="/showcase">
          כניסה להדגמה (ללא התחברות)
        </a>
        <button type="button" className={styles.showcaseSecondaryCta} onClick={onOpenPhilosophy}>
          הפילוסופיה החינוכית ומה קורה אחרי כניסת מרצה
        </button>
      </div>
    </div>
  );
}
