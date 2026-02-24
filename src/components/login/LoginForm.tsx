'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { he } from '@/locale/he';
import styles from '@/app/page.module.css';

export function LoginForm() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loginWithCode = async (rawCode: string) => {
    const normalized = rawCode.trim().toUpperCase();
    if (!normalized) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(data.redirect);
      } else {
        setError(data.error || he.auth.invalidCode);
      }
    } catch {
      setError(he.auth.invalidCode);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithCode(code);
  };

  return (
    <div className={styles.loginCard} id="code-login">
      <form onSubmit={handleSubmit}>
        <label className={styles.loginLabel}>{he.auth.enterCode}</label>
        <input
          className={styles.loginInput}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={he.auth.codePlaceholder}
          maxLength={10}
          autoFocus
        />
        {error && <div className={styles.loginError}>{error}</div>}
        <button
          className={styles.loginBtn}
          type="submit"
          disabled={loading || !code.trim()}
        >
          {loading ? '...' : he.auth.enter}
        </button>
      </form>
    </div>
  );
}
