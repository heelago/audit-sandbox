'use client';

import { useState } from 'react';
import { SearchIcon } from '@/components/icons';
import { he } from '@/locale/he';
import { ShowcaseHero } from '@/components/login/ShowcaseHero';
import { ActionGrid } from '@/components/login/ActionGrid';
import { AccessRequestForm } from '@/components/login/AccessRequestForm';
import { LoginForm } from '@/components/login/LoginForm';
import { PhilosophyModal } from '@/components/login/PhilosophyModal';
import styles from './page.module.css';

export default function LoginPage() {
  const [philosophyOpen, setPhilosophyOpen] = useState(false);

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginIcon}>
          <SearchIcon size={26} color="var(--accent)" />
        </div>

        <h1 className={styles.loginTitle}>{he.app.name}</h1>
        <p className={styles.loginSubtitle}>{he.app.tagline}</p>
        <p className={styles.loginDesc}>{he.app.description}</p>

        <ShowcaseHero onOpenPhilosophy={() => setPhilosophyOpen(true)} />
        <ActionGrid />
        <AccessRequestForm />
        <LoginForm />
      </div>

      {philosophyOpen && (
        <PhilosophyModal onClose={() => setPhilosophyOpen(false)} />
      )}
    </div>
  );
}
