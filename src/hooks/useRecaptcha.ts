import { useEffect, useState } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

/**
 * Loads the reCAPTCHA site key from the server, injects the script tag,
 * and provides a `getToken` helper to acquire a captcha token.
 */
export function useRecaptcha() {
  const [captchaSiteKey, setCaptchaSiteKey] = useState('');

  /* Fetch the site key from the API */
  useEffect(() => {
    let active = true;
    const loadSiteKey = async () => {
      try {
        const res = await fetch('/api/access-requests/site-key', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { siteKey?: string };
        if (!active) return;
        const siteKey = (data?.siteKey || '').trim();
        setCaptchaSiteKey(siteKey);
      } catch {
        if (active) {
          setCaptchaSiteKey('');
        }
      }
    };
    void loadSiteKey();
    return () => {
      active = false;
    };
  }, []);

  /* Inject the script tag once the key is known */
  useEffect(() => {
    if (!captchaSiteKey || typeof window === 'undefined') return;
    const existing = document.querySelector('script[data-recaptcha="access-request"]');
    if (existing) return;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(captchaSiteKey)}`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-recaptcha', 'access-request');
    document.head.appendChild(script);
  }, [captchaSiteKey]);

  const getToken = async (): Promise<string | null> => {
    if (!captchaSiteKey || typeof window === 'undefined') {
      return null;
    }

    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) {
      return null;
    }

    return await new Promise<string | null>((resolve) => {
      grecaptcha.ready(() => {
        grecaptcha
          .execute(captchaSiteKey, { action: 'access_request' })
          .then((token) => resolve((token || '').trim() || null))
          .catch(() => resolve(null));
      });
    });
  };

  return { captchaSiteKey, getToken };
}
