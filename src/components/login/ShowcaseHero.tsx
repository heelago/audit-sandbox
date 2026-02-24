import styles from '@/app/page.module.css';

interface ShowcaseHeroProps {
  onOpenPhilosophy: () => void;
}

export function ShowcaseHero({ onOpenPhilosophy }: ShowcaseHeroProps) {
  return (
    <div className={styles.showcaseHero}>
      <a className={styles.showcaseCta} href="/showcase">
        הדגמה אינטראקטיבית זמינה &larr;
      </a>
      <button type="button" className={styles.showcaseSecondaryCta} onClick={onOpenPhilosophy}>
        הפילוסופיה החינוכית
      </button>
    </div>
  );
}
