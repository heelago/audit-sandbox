'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './InstructorOnboardingHub.module.css';

type HelpTab = 'quickstart' | 'faq' | 'privacy';

const INSTRUCTOR_WELCOME_DONE_KEY = 'h2eapps.instructor.welcome.done.v1';
const INSTRUCTOR_PRIVACY_ACCEPTED_KEY = 'h2eapps.instructor.privacy.accepted.v1';
const CREATE_TOUR_AUTOSTART_KEY = 'h2eapps.instructor.create-tour.autostart.v1';

const WELCOME_STEPS = [
  {
    title: 'מגדירים את מטרת המטלה',
    desc: 'לא צריך לכתוב פרומפטים מורכבים. מספיק להסביר מה הסטודנטים אמורים לעשות ומה חשוב לך לבדוק.',
  },
  {
    title: 'מוסיפים קריטריונים ונקודות קושי',
    desc: 'אפשר להגדיר עד 3 חלקים, קריטריונים להצלחה, ומוקדי טעות שחשוב שהסטודנטים ילמדו לזהות.',
  },
  {
    title: 'המערכת בונה ומבקרת',
    desc: 'הטקסטים נוצרים אוטומטית, סוכני הביקורת מסמנים ממצאים ראשוניים, ואת/ה נשאר/ת בשליטה מלאה על הכיול.',
  },
] as const;

const FAQ_ITEMS = [
  {
    q: 'האם צריך לדעת הנדסת פרומפטים?',
    a: 'לא. הממשק בנוי כשאלון מודרך. אפשר להתחיל משפה פשוטה, והמערכת מתרגמת את זה למבנה עבודה מאחורי הקלעים.',
  },
  {
    q: 'אפשר לעבוד עם מטלה שיש בה כמה שאלות שונות?',
    a: 'כן. עמוד יצירת המטלה תומך בעד 3 חלקים נפרדים עם קריטריונים ומוקדי קושי לכל חלק.',
  },
  {
    q: 'מה אם הטקסט שנוצר לא מספיק טוב?',
    a: 'אפשר לייצר מחדש, לערוך ידנית, ולהוסיף ממצאים בכיול לפני שחרור לסטודנטים.',
  },
  {
    q: 'מי רואה את פרטי ההנחיה הפנימית?',
    a: 'מבנה הפרומפטים הפנימי נשמר בצד השרת. סטודנטים לא מקבלים את ההוראות הפנימיות שמעצבות את היצירה.',
  },
] as const;

export function InstructorOnboardingHub() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState<HelpTab>('quickstart');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPolicyInsideWelcome, setShowPolicyInsideWelcome] = useState(false);

  const onInstructorRoute = useMemo(() => pathname?.startsWith('/instructor') ?? false, [pathname]);

  useEffect(() => {
    if (!onInstructorRoute) return;
    const welcomeDone = window.localStorage.getItem(INSTRUCTOR_WELCOME_DONE_KEY) === '1';
    const privacyDone = window.localStorage.getItem(INSTRUCTOR_PRIVACY_ACCEPTED_KEY) === '1';
    setPrivacyAccepted(privacyDone);
    if (!welcomeDone || !privacyDone) {
      setWelcomeOpen(true);
    }
    setMounted(true);
  }, [onInstructorRoute]);

  if (!mounted || !onInstructorRoute) {
    return null;
  }

  function openHelp(tab: HelpTab) {
    setHelpTab(tab);
    setHelpOpen(true);
  }

  function completeWelcome(startCreateTour: boolean) {
    if (!privacyAccepted) return;
    window.localStorage.setItem(INSTRUCTOR_WELCOME_DONE_KEY, '1');
    window.localStorage.setItem(INSTRUCTOR_PRIVACY_ACCEPTED_KEY, '1');
    setWelcomeOpen(false);
    if (startCreateTour) {
      window.localStorage.setItem(CREATE_TOUR_AUTOSTART_KEY, '1');
      router.push('/instructor/create?tour=1');
    }
  }

  return (
    <>
      <button className={styles.fab} type="button" onClick={() => openHelp('quickstart')}>
        עזרה והדרכה
      </button>

      {welcomeOpen && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="מסך פתיחה למרצה">
          <section className={styles.modal}>
            <h2 className={styles.welcomeTitle}>ברוך/ה הבא/ה ל-H2eApps</h2>
            <p className={styles.welcomeSub}>
              המטרה כאן פשוטה: לבנות מטלה שבה הסטודנטים בודקים תוכן של AI בצורה ביקורתית, מנמקים את מה שמצאו,
              ועומדים מאחורי האימות שלהם.
            </p>

            <div className={styles.cardGrid}>
              {WELCOME_STEPS.map((step, index) => (
                <article key={`welcome-step-${index}`} className={styles.stepCard}>
                  <span className={styles.stepIndex}>שלב {index + 1}</span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </article>
              ))}
            </div>

            <div className={styles.checkboxWrap}>
              <input
                id="accept-privacy-policy"
                type="checkbox"
                checked={privacyAccepted}
                onChange={(event) => setPrivacyAccepted(event.target.checked)}
              />
              <label htmlFor="accept-privacy-policy" className={styles.checkboxText}>
                קראתי והבנתי את מדיניות הפרטיות ושיתוף הנתונים של המערכת.
              </label>
            </div>

            {showPolicyInsideWelcome && (
              <div className={styles.policyBox}>
                <strong>מדיניות פרטיות ושיתוף נתונים (גרסת עבודה)</strong>
                <br />
                המערכת שומרת נתוני מטלות, טקסטים, סימונים ומשוב לצורך תפעול פדגוגי ושיפור חוויית ההוראה. מומלץ לא
                להזין מידע אישי מזהה של סטודנטים בתוך הטקסטים. מפתחות API וסודות שרת נשמרים בסביבת שרת בלבד ואינם
                נחשפים למרצים או לסטודנטים דרך הדפדפן.
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btn}
                onClick={() => setShowPolicyInsideWelcome((prev) => !prev)}
              >
                {showPolicyInsideWelcome ? 'הסתרת מדיניות' : 'צפייה במדיניות'}
              </button>
              <button type="button" className={styles.btn} onClick={() => completeWelcome(false)} disabled={!privacyAccepted}>
                מעבר ללוח הבקרה
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => completeWelcome(true)}
                disabled={!privacyAccepted}
              >
                התחלת יצירת מטלה עם סיור
              </button>
            </div>
          </section>
        </div>
      )}

      {helpOpen && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="מרכז עזרה">
          <section className={styles.modal}>
            <header className={styles.helpHeader}>
              <h2 className={styles.helpTitle}>מרכז עזרה למרצה</h2>
              <button type="button" className={styles.btn} onClick={() => setHelpOpen(false)}>
                סגירה
              </button>
            </header>

            <div className={styles.tabRow}>
              <button
                type="button"
                className={`${styles.tabBtn} ${helpTab === 'quickstart' ? styles.tabBtnActive : ''}`}
                onClick={() => setHelpTab('quickstart')}
              >
                התחלה מהירה
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${helpTab === 'faq' ? styles.tabBtnActive : ''}`}
                onClick={() => setHelpTab('faq')}
              >
                שאלות נפוצות
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${helpTab === 'privacy' ? styles.tabBtnActive : ''}`}
                onClick={() => setHelpTab('privacy')}
              >
                פרטיות ושיתוף נתונים
              </button>
            </div>

            {helpTab === 'quickstart' && (
              <section className={styles.helpPanel}>
                <p className={styles.helpParagraph}>
                  כדי להתחיל מהר: עבר/י ליצירת מטלה, מלא/י כותרת ותיאור קצר, בחר/י עד 3 חלקים, והמערכת תבנה עבורך
                  פרומפט מוכן.
                </p>
                <ol className={styles.helpList}>
                  <li>יצירת המטלה: מגדירים מה הסטודנטים צריכים לעשות ומה אסור להם לפספס.</li>
                  <li>הפקה ובדיקה: מייצרים טקסטים ומריצים ביקורת ראשונית של סוכנים.</li>
                  <li>כיול ושחרור: מאשרים/עורכים ממצאים ואז משחררים לסטודנטים.</li>
                </ol>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => {
                      window.localStorage.setItem(CREATE_TOUR_AUTOSTART_KEY, '1');
                      setHelpOpen(false);
                      router.push('/instructor/create?tour=1');
                    }}
                  >
                    פתיחת סיור בעמוד יצירת מטלה
                  </button>
                </div>
              </section>
            )}

            {helpTab === 'faq' && (
              <section className={styles.helpPanel}>
                {FAQ_ITEMS.map((item, index) => (
                  <article key={`faq-${index}`} className={styles.stepCard}>
                    <h3 className={styles.stepTitle}>{item.q}</h3>
                    <p className={styles.stepDesc}>{item.a}</p>
                  </article>
                ))}
              </section>
            )}

            {helpTab === 'privacy' && (
              <section className={styles.helpPanel}>
                <p className={styles.helpParagraph}>
                  <strong>מדיניות פרטיות ושיתוף נתונים (גרסת עבודה):</strong>
                </p>
                <ul className={styles.helpList}>
                  <li>נשמרים: כותרות מטלה, תכני מטלה, טקסטים שנוצרו, סימונים, הערות כיול ולוגים תפעוליים.</li>
                  <li>לא מומלץ להזין: מידע אישי מזהה של סטודנטים, פרטים רפואיים, או מידע רגיש שאינו הכרחי.</li>
                  <li>מפתחות API וסודות שרת נשמרים בשרת (Secret Manager) ולא נחשפים לקליינט.</li>
                  <li>שיתוף נתונים מתבצע לצורכי תפעול, שיפור איכות, ותמיכה פדגוגית במסגרת המערכת.</li>
                  <li>כדאי לאנונימיזציה: בטקסטים מיובאים מומלץ להסיר שמות, ת״ז, ופרטים מזהים לפני העלאה.</li>
                </ul>
                <div className={styles.policyBox}>
                  סימון ה-Checkbox במסך הפתיחה נשמר מקומית בדפדפן הזה בלבד. בהמשך ניתן לחבר אישור מדיניות גם לרמת
                  משתמש במסד הנתונים.
                </div>
              </section>
            )}
          </section>
        </div>
      )}
    </>
  );
}
