import { useState, useRef, useCallback } from "react";

/* ── palette: calm academic pastels, no pure white ─────────────── */
const C = {
  bg: "#F3F1EC",
  card: "#FAFAF6",
  cardHover: "#F7F6F1",
  border: "#DDD9CE",
  borderLight: "#E8E4DA",
  ink: "#2C2924",
  inkSoft: "#5E574B",
  inkFaint: "#9E9688",
  accent: "#8B5E3C",
  accentSoft: "#8B5E3C18",
  error: "#B54D4D",
  errorSoft: "#B54D4D14",
  success: "#4D8B6A",
  successSoft: "#4D8B6A14",
  warn: "#A68A2B",
  warnSoft: "#A68A2B14",
  info: "#4A6F8B",
  infoSoft: "#4A6F8B14",
  neutral: "#7A7568",
  neutralSoft: "#7A756814",
  gap: "#9B6B42",
  gapSoft: "#9B6B4214",
};

const Font = {
  display: "'Heebo', 'Rubik', 'Arial Hebrew', sans-serif",
  body: "'Heebo', 'Rubik', 'Arial Hebrew', sans-serif",
};

/* ── SVG icons (no emoji) ──────────────────────────────────────── */
const Icons = {
  search: (size = 20, color = C.ink) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  ),
  x: (size = 16, color = C.error) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  ),
  check: (size = 16, color = C.success) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 12 9 17 20 6" />
    </svg>
  ),
  swap: (size = 16, color = C.warn) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="7 3 3 7 7 11" /><line x1="3" y1="7" x2="21" y2="7" />
      <polyline points="17 13 21 17 17 21" /><line x1="21" y1="17" x2="3" y2="17" />
    </svg>
  ),
  triangle: (size = 16, color = C.gap) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4L3 20h18L12 4z" />
    </svg>
  ),
  target: (size = 16, color = C.info) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill={color} />
    </svg>
  ),
  dot: (size = 16, color = C.neutral) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" fill={color} opacity="0.5" /><circle cx="12" cy="12" r="9" />
    </svg>
  ),
  chat: (size = 16, color = C.inkSoft) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </svg>
  ),
  source: (size = 16, color = C.inkSoft) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  note: (size = 16, color = C.inkSoft) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  ),
  file: (size = 20, color = C.ink) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  arrow: (size = 16, color = C.ink) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 5 5 12 12 19" />
    </svg>
  ),
  plus: (size = 14, color = C.inkFaint) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  close: (size = 14, color = C.inkFaint) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  ),
};

/* ── annotation types ──────────────────────────────────────────── */
const AUDIT_TYPES = [
  { id: "error",       label: "אי-דיוק",        color: C.error,   icon: "x",        desc: "שגיאה עובדתית, מושגית או לוגית של הבינה המלאכותית" },
  { id: "verified",    label: "אומת כמדויק",     color: C.success,  icon: "check",    desc: "טענה שבדקת באופן עצמאי ואישרת את נכונותה" },
  { id: "alternative", label: "חלופה עדיפה",     color: C.warn,     icon: "swap",     desc: "גישה, מסגור או מקור טובים יותר שידועים לך" },
  { id: "gap",         label: "רכיב חסר",        color: C.gap,      icon: "triangle", desc: "משהו חשוב שהבינה המלאכותית השמיטה לחלוטין" },
  { id: "nuance",      label: "ניואנס דיסציפלינרי", color: C.info,  icon: "target",   desc: "תובנה מקצועית שהבינה המלאכותית החמיצה או שיטחה" },
  { id: "accepted",    label: "אושר — עם נימוק",  color: C.neutral,  icon: "dot",      desc: "הושאר כפי שהוא במכוון — נמק את שיקוליך" },
];

const EVIDENCE_KINDS = [
  { id: "conversation", label: "שיחה עם AI",      iconKey: "chat",   ph: "הדבק את החלק הרלוונטי מהשיחה — מה שאלת, מה קיבלת, מה החלטת..." },
  { id: "source",       label: "מקור / אימות",     iconKey: "source", ph: "כתובת URL, שם מאמר ומחבר/ת, מאגר מידע, או תיאור דרך האימות..." },
  { id: "note",         label: "הערת תהליך",       iconKey: "note",   ph: "השיקולים שלך — למה זה חשוב, מה שמת לב אליו, איך הגעת להחלטה..." },
];

const GUIDED = {
  error:       ["מה בדיוק שגוי כאן?", "איך גילית את השגיאה?", "מהו המידע הנכון?"],
  verified:    ["מול איזה מקור בדקת?", "מצאת אי-התאמות?", "עד כמה המקור שלך סמכותי?"],
  alternative: ["מה היית מציע/ה במקום?", "למה החלופה שלך עדיפה?", "האם ה-AI היה יכול לדעת את זה?"],
  gap:         ["מה חסר ולמה זה חשוב?", "איך הפער משפיע על הטיעון?", "היכן היית מוסיף/ה את זה?"],
  nuance:      ["מה הידע המקצועי חושף כאן?", "איך זה משטח את המציאות?", "מה מומחה/ית היה/ה שם/ה לב אליו?"],
  accepted:    ["למה זה מספק כמות שהוא?", "האם אימתת לפני שקיבלת?", "מה נותן לך ביטחון לשמור את זה?"],
};

/* ── sample assignment ─────────────────────────────────────────── */
const SAMPLE_PROMPT = `כתוב חיבור אקדמי בן 400 מילים לקורס מבוא לסוציולוגיה בנושא: "כיצד מעמד חברתי משפיע על הישגים לימודיים?" כלול לפחות שלושה מקורות מחקריים, דון במנגנוני שעתוק חברתי, והתייחס להשלכות מדיניות. השתמש ברישום אקדמי פורמלי.`;

const SAMPLE_TEXT = `מעמד חברתי והישגים לימודיים: מנגנוני שעתוק

הקשר בין מעמד חברתי להישגים לימודיים הוא מהתופעות הנחקרות ביותר בסוציולוגיה של החינוך. מחקרים מראים באופן עקבי כי תלמידים מרקע סוציו-אקונומי גבוה משיגים הצלחה אקדמית רבה יותר, דפוס המתקיים בין מדינות ולאורך תקופות היסטוריות (Bourdieu, 1984; Coleman, 1966).

תיאוריית ההון התרבותי של פייר בורדייה מספקת את ההסבר המקובל ביותר לתופעה זו. בורדייה טען כי משפחות ממעמד גבוה מעבירות ידע תרבותי, נטיות וכישורים שמתוגמלים על ידי מוסדות חינוך. ילדים מרקע מועדף מגיעים לבית הספר כשהם כבר מחזיקים בקודים הלשוניים, בהעדפות האסתטיות ובנורמות ההתנהגות שמורים מזהים ומתגמלים (Bourdieu & Passeron, 1977). כך נוצר מעגל שבו הצלחה חינוכית נראית מריטוקרטית בעוד שהיא למעשה משעתקת היררכיות מעמדיות קיימות.

גורמים כלכליים פועלים לצד מנגנונים תרבותיים. על פי דו"ח OECD משנת 2019, תלמידים ברבעון ההכנסה הנמוך ביותר פחותים ב-38% בסיכוייהם להשלים השכלה על-תיכונית בהשוואה לעמיתיהם העשירים ביותר. אילוצים כלכליים מגבילים גישה לשיעורים פרטיים, העשרה חוץ-לימודית וחומרי לימוד. יתרה מזאת, תלמידים ממשפחות בעלות הכנסה נמוכה נושאים לעתים קרובות אחריות ביתית נוספת המפחיתה זמן לימוד פנוי, גורם שלארו (2003) תיעדה בהשוואה האתנוגרפית שלה בין סגנון "הטיפוח המתואם" של מעמד הביניים לבין סגנון "הגידול הטבעי" של מעמד הפועלים.

מנגנונים מוסדיים ממלאים גם הם תפקיד מרכזי. מערכות מיון (tracking) המפצלות תלמידים למסלולים עיוניים או מקצועיים כבר בגיל 10 במדינות כמו גרמניה והולנד, נוטות להתאם באופן חזק למקצוע ההורים ולא ליכולת מוכחת (Oakes, 1985). גם במערכות מקיפות כמו אלה שבמדינות סקנדינביה, מחקרים מראים שציפיות מורים ונוהלי הערכה מעדיפים באופן שיטתי תלמידים שההצגה התרבותית שלהם עולה בקנה אחד עם נורמות מעמד הביניים.

התערבויות מדיניות הראו תוצאות מעורבות. ביטול מערכת המיון בפינלנד בשילוב השקעה כבדה בהכשרת מורים צמצם באופן משמעותי את פערי ההישגים המעמדיים, והפך את פינלנד למערכת החינוך השוויונית בעולם מאז שנות ה-90. תוכניות העברת מזומנים מותנית באמריקה הלטינית שיפרו שיעורי הרשמה בקרב תלמידים מוחלשים אך לא תורגמו באופן עקבי לשיפור בתוצאות למידה.

לסיכום, שעתוק אי-שוויון חינוכי באמצעות מעמד חברתי פועל דרך ערוצים תרבותיים, כלכליים ומוסדיים בו-זמנית. מדיניות אפקטיבית חייבת לטפל בכל שלושת המנגנונים במקום להתייחס לגורם בודד בבידוד.

רשימת מקורות:
Bourdieu, P. (1984). Distinction: A Social Critique of the Judgement of Taste. Harvard University Press.
Bourdieu, P. & Passeron, J.-C. (1977). Reproduction in Education, Society and Culture. Sage.
Coleman, J. (1966). Equality of Educational Opportunity. U.S. Government Printing Office.
Lareau, A. (2003). Unequal Childhoods: Class, Race, and Family Life. University of California Press.
Oakes, J. (1985). Keeping Track: How Schools Structure Inequality. Yale University Press.`;

/* ── shared UI ─────────────────────────────────────────────────── */
const rtl = { direction: "rtl", textAlign: "right" };

const Btn = ({ children, primary, small, disabled, style, ...rest }) => (
  <button disabled={disabled} style={{
    background: primary ? C.accent : C.card,
    color: primary ? "#FFF9F4" : C.ink,
    border: primary ? "none" : `1px solid ${C.border}`,
    borderRadius: small ? "10px" : "7px",
    padding: small ? "4px 12px" : "9px 18px",
    fontFamily: Font.body, fontSize: small ? "12px" : "13px",
    fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1, transition: "all 0.15s ease",
    ...rtl, ...style,
  }} {...rest}>{children}</button>
);

const Badge = ({ type }) => {
  const t = AUDIT_TYPES.find(a => a.id === type);
  const IconFn = Icons[t.icon];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px", ...rtl,
      background: t.color + "14", border: `1px solid ${t.color}33`,
      borderRadius: "8px", padding: "3px 10px",
      fontFamily: Font.body, fontSize: "11px", fontWeight: 600, color: t.color,
    }}>
      {IconFn && IconFn(13, t.color)}
      {t.label}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   TEXT HIGHLIGHTER
   ═══════════════════════════════════════════════════════════════════ */
function DocViewer({ text, annotations, onSelect, activeId, onClickAnnotation }) {
  const ref = useRef(null);
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !ref.current) return;
    const range = sel.getRangeAt(0);
    const pre = document.createRange();
    pre.selectNodeContents(ref.current);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const end = start + sel.toString().length;
    const txt = sel.toString();
    if (txt.trim().length > 2) onSelect({ start, end, text: txt });
  };
  const render = () => {
    if (!text) return null;
    if (!annotations.length) return <span>{text}</span>;
    const sorted = [...annotations].sort((a, b) => a.start - b.start);
    const parts = []; let cursor = 0;
    sorted.forEach((ann, i) => {
      if (ann.start > cursor) parts.push(<span key={`t${i}`}>{text.slice(cursor, ann.start)}</span>);
      const t = AUDIT_TYPES.find(x => x.id === ann.type);
      const active = activeId === ann.id;
      parts.push(
        <span key={ann.id} onClick={e => { e.stopPropagation(); onClickAnnotation(ann.id); }}
          style={{
            backgroundColor: t.color + (active ? "30" : "16"),
            borderBottom: `2px solid ${t.color}`,
            padding: "1px 1px", borderRadius: "2px", cursor: "pointer",
            outline: active ? `2px solid ${t.color}` : "none", outlineOffset: "1px",
            transition: "all 0.2s",
          }}>{text.slice(ann.start, ann.end)}</span>
      );
      cursor = ann.end;
    });
    if (cursor < text.length) parts.push(<span key="end">{text.slice(cursor)}</span>);
    return parts;
  };
  return (
    <div ref={ref} onMouseUp={handleMouseUp} style={{
      fontFamily: Font.display, fontSize: "15.5px", lineHeight: "2",
      color: C.ink, whiteSpace: "pre-wrap", userSelect: "text", cursor: "text", ...rtl,
    }}>{render()}</div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ANNOTATION CARD
   ═══════════════════════════════════════════════════════════════════ */
function AnnCard({ ann, onUpdate, onDelete, onEvidence }) {
  const t = AUDIT_TYPES.find(x => x.id === ann.type);
  const prompts = GUIDED[ann.type] || [];
  const [showEvForm, setShowEvForm] = useState(false);
  const [evKind, setEvKind] = useState("source");
  const [evText, setEvText] = useState("");

  const submitEv = () => {
    if (!evText.trim()) return;
    onEvidence(ann.id, { id: Date.now().toString(), type: evKind, content: evText, ts: new Date().toISOString() });
    setEvText(""); setShowEvForm(false);
  };

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRight: `4px solid ${t.color}`,
      borderRadius: "8px", padding: "14px", marginBottom: "10px", ...rtl,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <Badge type={ann.type} />
        <button onClick={() => onDelete(ann.id)} style={{
          background: "none", border: "none", cursor: "pointer", padding: "2px",
        }}>{Icons.close(14, C.inkFaint)}</button>
      </div>

      <div style={{
        fontFamily: Font.display, fontSize: "12.5px", color: C.inkSoft, fontStyle: "italic",
        padding: "6px 10px", background: C.bg, borderRadius: "4px", marginBottom: "8px",
        borderRight: `3px solid ${t.color}33`, lineHeight: "1.7", ...rtl,
      }}>
        &laquo;{ann.text.length > 140 ? ann.text.slice(0, 140) + "..." : ann.text}&raquo;
      </div>

      <textarea value={ann.note || ""} onChange={e => onUpdate(ann.id, { note: e.target.value })}
        placeholder="כתוב את הניתוח שלך..."
        style={{
          width: "100%", minHeight: "55px", border: `1px solid ${C.borderLight}`, borderRadius: "6px",
          padding: "8px 10px", fontFamily: Font.body, fontSize: "12.5px", resize: "vertical",
          background: C.cardHover, boxSizing: "border-box", lineHeight: "1.7", ...rtl,
        }}
      />

      <div style={{ marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {prompts.map((p, i) => (
          <button key={i} onClick={() => onUpdate(ann.id, { note: (ann.note || "") + (ann.note ? "\n\n" : "") + p + "\n" })}
            style={{
              background: C.cardHover, border: `1px solid ${t.color}25`, borderRadius: "8px",
              padding: "3px 10px", fontSize: "10.5px", fontFamily: Font.body, color: C.inkSoft,
              cursor: "pointer", ...rtl,
            }}>{p}</button>
        ))}
      </div>

      {ann.evidence?.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          {ann.evidence.map(ev => {
            const ek = EVIDENCE_KINDS.find(x => x.id === ev.type);
            return (
              <div key={ev.id} style={{
                background: C.cardHover, border: `1px solid ${C.borderLight}`, borderRadius: "5px",
                padding: "6px 8px", marginBottom: "4px", fontSize: "11.5px", fontFamily: Font.body,
                display: "flex", alignItems: "flex-start", gap: "6px", ...rtl,
              }}>
                {Icons[ek?.iconKey]?.(13, C.inkSoft)}
                <span><strong style={{ color: C.inkSoft }}>{ek?.label}:</strong>{" "}
                <span style={{ color: C.inkSoft }}>{ev.content.length > 150 ? ev.content.slice(0, 150) + "..." : ev.content}</span></span>
              </div>
            );
          })}
        </div>
      )}

      {!showEvForm ? (
        <button onClick={() => setShowEvForm(true)} style={{
          marginTop: "6px", background: "none", border: `1px dashed ${C.border}`, borderRadius: "6px",
          padding: "5px 10px", fontSize: "11.5px", fontFamily: Font.body, color: C.inkFaint,
          cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", ...rtl,
        }}>{Icons.plus(12, C.inkFaint)} צרף ראיה</button>
      ) : (
        <div style={{ marginTop: "6px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: "6px", padding: "8px", ...rtl }}>
          <div style={{ display: "flex", gap: "4px", marginBottom: "6px", flexWrap: "wrap" }}>
            {EVIDENCE_KINDS.map(ek => (
              <button key={ek.id} onClick={() => setEvKind(ek.id)} style={{
                background: evKind === ek.id ? C.ink : C.card, color: evKind === ek.id ? "#FFF9F4" : C.inkSoft,
                border: `1px solid ${C.border}`, borderRadius: "8px", padding: "3px 10px",
                fontSize: "11px", fontFamily: Font.body, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "4px",
              }}>{Icons[ek.iconKey]?.(12, evKind === ek.id ? "#FFF9F4" : C.inkSoft)} {ek.label}</button>
            ))}
          </div>
          <textarea value={evText} onChange={e => setEvText(e.target.value)}
            placeholder={EVIDENCE_KINDS.find(x => x.id === evKind)?.ph}
            style={{
              width: "100%", minHeight: "55px", border: `1px solid ${C.borderLight}`, borderRadius: "5px",
              padding: "7px", fontFamily: Font.body, fontSize: "12px", resize: "vertical",
              boxSizing: "border-box", background: C.card, ...rtl,
            }}
          />
          <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
            <Btn small primary onClick={submitEv}>הוסף</Btn>
            <Btn small onClick={() => { setShowEvForm(false); setEvText(""); }}>ביטול</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   REPORT VIEW
   ═══════════════════════════════════════════════════════════════════ */
function Report({ text, annotations, prompt, title, onBack }) {
  const [instrReport, setInstrReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totalChars = text.length;
  const annotatedChars = annotations.reduce((s, a) => s + (a.end - a.start), 0);
  const coverage = totalChars > 0 ? Math.round((annotatedChars / totalChars) * 100) : 0;
  const byType = AUDIT_TYPES.map(t => ({ ...t, items: annotations.filter(a => a.type === t.id) })).filter(t => t.items.length > 0);
  const totalEvidence = annotations.reduce((s, a) => s + (a.evidence?.length || 0), 0);
  const withNotes = annotations.filter(a => a.note?.trim()).length;
  const unannotatedPct = 100 - coverage;

  const generateInstructorReport = async () => {
    setLoading(true); setError(null);
    try {
      const annSummary = annotations.map(a => {
        const t = AUDIT_TYPES.find(x => x.id === a.type);
        return `[${t.label}] "${a.text.slice(0, 100)}..." — הערת הסטודנט: ${a.note || "(ללא)"} — פריטי ראיה: ${a.evidence?.length || 0}`;
      }).join("\n");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: `You are an educational assessment assistant for a Hebrew-language university course using AI audit pedagogy. Students received AI-generated text and their assignment was to critically audit it. Write your assessment in Hebrew.

ASSIGNMENT PROMPT: ${prompt}
AI-GENERATED TEXT (first 600 chars): ${text.slice(0, 600)}...

STUDENT AUDIT SUMMARY:
- Total annotations: ${annotations.length}
- Text coverage: ${coverage}%
- Evidence pieces: ${totalEvidence}
- With reflections: ${withNotes}/${annotations.length}
- Breakdown: ${byType.map(t => `${t.label}: ${t.items.length}`).join(", ")}

DETAILED ANNOTATIONS:
${annSummary}

Write a concise instructor assessment (200-300 words) in Hebrew covering:
1. עומק המעורבות
2. איכות הביקורתיות
3. נוהלי אימות
4. חוזקות בולטות
5. תחומים לפיתוח
6. מדדי ציון מומלצים` }],
        }),
      });
      const data = await response.json();
      const txt = data.content?.map(b => b.type === "text" ? b.text : "").filter(Boolean).join("\n");
      setInstrReport(txt || "לא התקבל תוכן מהמודל.");
    } catch (err) { setError("לא ניתן היה ליצור דוח. " + err.message); }
    finally { setLoading(false); }
  };

  const StatCard = ({ label, value, sub }) => (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px 16px", textAlign: "center" }}>
      <div style={{ fontFamily: Font.display, fontSize: "28px", fontWeight: 700, color: C.ink }}>{value}</div>
      <div style={{ fontFamily: Font.body, fontSize: "11px", color: C.inkFaint, marginTop: "2px" }}>{label}</div>
      {sub && <div style={{ fontFamily: Font.body, fontSize: "10px", color: C.inkFaint }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px", ...rtl }}>
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontFamily: Font.display, fontSize: "28px", fontWeight: 500, color: C.ink, margin: 0 }}>דוח ביקורת</h1>
            {title && <p style={{ fontFamily: Font.body, fontSize: "13px", color: C.inkFaint, margin: "4px 0 0" }}>{title}</p>}
          </div>
          <Btn onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {Icons.arrow(14, C.ink)} חזרה לסביבת העבודה
          </Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "24px" }}>
          <StatCard label="הערות" value={annotations.length} />
          <StatCard label="כיסוי טקסט" value={`${coverage}%`} sub={`${unannotatedPct}% לא נבדק`} />
          <StatCard label="ראיות" value={totalEvidence} />
          <StatCard label="רפלקציות" value={`${withNotes}/${annotations.length}`} />
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px 20px", marginBottom: "20px" }}>
          <div style={{ fontFamily: Font.body, fontSize: "12px", fontWeight: 600, color: C.ink, marginBottom: "10px" }}>פילוח הערות</div>
          {byType.map(t => {
            const IconFn = Icons[t.icon];
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: t.color, flexShrink: 0 }} />
                <span style={{ fontFamily: Font.body, fontSize: "12.5px", color: C.inkSoft, minWidth: "130px", display: "flex", alignItems: "center", gap: "4px" }}>
                  {IconFn && IconFn(12, t.color)} {t.label}
                </span>
                <div style={{ flex: 1, height: "6px", background: C.bg, borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.max(5, (t.items.length / Math.max(annotations.length, 1)) * 100)}%`, background: t.color, borderRadius: "3px" }} />
                </div>
                <span style={{ fontFamily: Font.body, fontSize: "12px", color: C.inkFaint, minWidth: "18px", textAlign: "left" }}>{t.items.length}</span>
              </div>
            );
          })}
        </div>

        {byType.map(type => {
          const IconFn = Icons[type.icon];
          return (
            <div key={type.id} style={{ marginBottom: "24px" }}>
              <h3 style={{
                fontFamily: Font.body, fontSize: "14px", fontWeight: 600, color: C.ink,
                paddingBottom: "6px", borderBottom: `2px solid ${type.color}`, marginBottom: "10px",
                display: "flex", alignItems: "center", gap: "6px",
              }}>{IconFn && IconFn(15, type.color)} {type.label} ({type.items.length})</h3>
              {type.items.map(ann => (
                <div key={ann.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "12px", marginBottom: "8px" }}>
                  <div style={{
                    fontFamily: Font.display, fontSize: "12.5px", color: C.inkSoft, fontStyle: "italic",
                    padding: "5px 10px", background: C.bg, borderRadius: "4px", borderRight: `3px solid ${type.color}`,
                    marginBottom: "6px", lineHeight: "1.7",
                  }}>&laquo;{ann.text.length > 220 ? ann.text.slice(0, 220) + "..." : ann.text}&raquo;</div>
                  {ann.note && <div style={{ fontFamily: Font.body, fontSize: "12.5px", color: C.ink, lineHeight: "1.7", whiteSpace: "pre-wrap", marginBottom: "6px" }}>{ann.note}</div>}
                  {ann.evidence?.map(ev => {
                    const ek = EVIDENCE_KINDS.find(x => x.id === ev.type);
                    return <div key={ev.id} style={{ background: C.bg, borderRadius: "5px", padding: "5px 8px", marginBottom: "3px", fontSize: "11.5px", fontFamily: Font.body, color: C.inkSoft, display: "flex", alignItems: "flex-start", gap: "5px" }}>
                      {Icons[ek?.iconKey]?.(12, C.inkSoft)} <span><strong>{ek?.label}:</strong> {ev.content}</span>
                    </div>;
                  })}
                </div>
              ))}
            </div>
          );
        })}

        <div style={{
          background: C.card, border: `2px solid ${C.accent}33`, borderRadius: "10px",
          padding: "20px", marginTop: "24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <div style={{ fontFamily: Font.body, fontSize: "14px", fontWeight: 600, color: C.ink }}>הערכת מרצה</div>
              <div style={{ fontFamily: Font.body, fontSize: "11px", color: C.inkFaint }}>ניתוח באמצעות AI של איכות הביקורת</div>
            </div>
            {!instrReport && <Btn primary onClick={generateInstructorReport} disabled={loading || annotations.length === 0}>
              {loading ? "מייצר..." : "צור הערכה"}
            </Btn>}
          </div>
          {error && <div style={{ color: C.error, fontFamily: Font.body, fontSize: "12px", marginBottom: "8px" }}>{error}</div>}
          {instrReport && <div style={{ fontFamily: Font.body, fontSize: "13px", color: C.ink, lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{instrReport}</div>}
          {!instrReport && !loading && <div style={{ fontFamily: Font.body, fontSize: "12px", color: C.inkFaint, fontStyle: "italic" }}>
            לחצו על "צור הערכה" לניתוח AI של עומק וטיב הביקורת של הסטודנט/ית.
          </div>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════ */
export default function AuditSandboxHe() {
  const [view, setView] = useState("landing");
  const [text] = useState(SAMPLE_TEXT);
  const [prompt] = useState(SAMPLE_PROMPT);
  const [title, setTitle] = useState("מבוא לסוציולוגיה — מעמד חברתי והישגים לימודיים");
  const [annotations, setAnnotations] = useState([]);
  const [selection, setSelection] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [sidebarTab, setSidebarTab] = useState("audit");

  const handleSelect = useCallback(sel => setSelection(sel), []);
  const createAnn = (typeId) => {
    if (!selection) return;
    const ann = {
      id: Date.now().toString(), type: typeId, start: selection.start, end: selection.end,
      text: selection.text, note: "", evidence: [], createdAt: new Date().toISOString(),
    };
    setAnnotations(prev => [...prev, ann]);
    setSelection(null); setActiveId(ann.id); setSidebarTab("audit");
    window.getSelection()?.removeAllRanges();
  };
  const updateAnn = (id, upd) => setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...upd } : a));
  const deleteAnn = (id) => { setAnnotations(prev => prev.filter(a => a.id !== id)); if (activeId === id) setActiveId(null); };
  const addEv = (id, ev) => setAnnotations(prev => prev.map(a => a.id === id ? { ...a, evidence: [...(a.evidence || []), ev] } : a));

  if (view === "report") return <Report text={text} annotations={annotations} prompt={prompt} title={title} onBack={() => setView("workspace")} />;

  /* ── LANDING ─────────────────────────────────────────────────── */
  if (view === "landing") return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", ...rtl }}>
      <div style={{ maxWidth: "680px", width: "100%", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "50px", height: "50px", borderRadius: "50%", background: C.accentSoft,
          border: `1.5px solid ${C.accent}33`, marginBottom: "14px",
        }}>{Icons.search(24, C.accent)}</div>

        <h1 style={{ fontFamily: Font.display, fontSize: "38px", fontWeight: 500, color: C.ink, margin: "0 0 6px" }}>
          סביבת ביקורת AI
        </h1>
        <p style={{ fontFamily: Font.body, fontSize: "15px", color: C.inkSoft, margin: "0 0 6px", fontWeight: 300 }}>
          המטלה נכתבה על ידי בינה מלאכותית. התפקיד שלך — לבקר אותה.
        </p>
        <p style={{ fontFamily: Font.body, fontSize: "13px", color: C.inkFaint, margin: "0 0 32px", maxWidth: "500px", display: "inline-block", lineHeight: "1.7" }}>
          קראו בביקורתיות. מצאו שגיאות. אמתו טענות. הציעו חלופות.
          הראו את החשיבה שה-AI לא מסוגל לה — הביקורת שלכם היא המטלה.
        </p>

        <div style={{
          background: C.card, borderRadius: "12px", border: `1px solid ${C.border}`,
          padding: "28px", textAlign: "right", boxShadow: "0 1px 12px rgba(0,0,0,0.03)",
        }}>
          {/* Prompt */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontFamily: Font.body, fontSize: "12px", fontWeight: 600, color: C.inkSoft, letterSpacing: "0.3px" }}>
                פרומפט המטלה
              </label>
              <span style={{
                fontFamily: Font.body, fontSize: "10px", color: C.accent, background: C.accentSoft,
                padding: "2px 8px", borderRadius: "6px", fontWeight: 600,
              }}>קריאה בלבד</span>
            </div>
            <div style={{
              padding: "14px", background: C.bg, borderRadius: "8px", border: `1px solid ${C.border}`,
              fontFamily: Font.display, fontSize: "14px", color: C.ink, lineHeight: "1.7", ...rtl,
            }}>{prompt}</div>
            <p style={{ fontFamily: Font.body, fontSize: "11px", color: C.inkFaint, margin: "6px 0 0", fontStyle: "italic", lineHeight: "1.6" }}>
              פרומפט זה אינו ניתן לעריכה כרגע. אנו בוחנים אפשרויות להתאמה אישית בגרסאות עתידיות.
              כל הסטודנטים מקבלים את אותו פרומפט. הטקסט שנוצר עשוי להשתנות — כולם מיוצרים על ידי אותו מודל.
            </p>
          </div>

          {/* Title */}
          <label style={{ fontFamily: Font.body, fontSize: "12px", fontWeight: 600, color: C.inkSoft, display: "block", marginBottom: "4px" }}>
            כותרת המטלה
          </label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={{
            width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: "7px",
            fontFamily: Font.body, fontSize: "13px", marginBottom: "16px", boxSizing: "border-box",
            background: C.cardHover, ...rtl,
          }} />

          {/* AI text preview */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <label style={{ fontFamily: Font.body, fontSize: "12px", fontWeight: 600, color: C.inkSoft }}>
              הטקסט שנוצר על ידי AI
            </label>
            <span style={{
              fontFamily: Font.body, fontSize: "10px", color: C.info, background: C.infoSoft,
              padding: "2px 8px", borderRadius: "6px", fontWeight: 600,
            }}>נכתב על ידי AI</span>
          </div>
          <div style={{
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: "8px",
            padding: "14px", maxHeight: "180px", overflowY: "auto",
            fontFamily: Font.display, fontSize: "13px", color: C.ink, lineHeight: "1.8",
            whiteSpace: "pre-wrap", ...rtl,
          }}>
            {text.slice(0, 500)}{text.length > 500 ? "..." : ""}
          </div>
          <p style={{ fontFamily: Font.body, fontSize: "11px", color: C.inkFaint, margin: "6px 0 0" }}>
            {text.split(/\s+/).length} מילים — נוצר מהפרומפט שלמעלה — התפקיד שלך: מצא מה שגוי, אמת מה שנכון, השלם מה שחסר
          </p>

          <Btn primary style={{ marginTop: "20px", width: "100%" }} onClick={() => setView("workspace")}>
            התחל ביקורת
          </Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginTop: "28px" }}>
          {[
            { n: "1", t: "קרא ובחר", d: "סמן קטעים לבחינה" },
            { n: "2", t: "תייג וסווג", d: "שגיאה, אומת, חסר, חלופה..." },
            { n: "3", t: "נמק והוכח", d: "הסבר שיקולים, צרף ראיות" },
            { n: "4", t: "הגש דוח", d: "הביקורת שלך היא הציון" },
          ].map(s => (
            <div key={s.n} style={{ padding: "10px" }}>
              <div style={{
                width: "26px", height: "26px", borderRadius: "50%", background: C.ink, color: C.bg,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: Font.body, fontSize: "12px", fontWeight: 700, marginBottom: "6px",
              }}>{s.n}</div>
              <div style={{ fontFamily: Font.body, fontSize: "12px", fontWeight: 600, color: C.ink }}>{s.t}</div>
              <div style={{ fontFamily: Font.body, fontSize: "11px", color: C.inkFaint, lineHeight: "1.5" }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── WORKSPACE ───────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, overflow: "hidden", ...rtl }}>
      {/* Main pane */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          padding: "10px 20px", background: C.card, borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {Icons.search(18, C.accent)}
            <div>
              <div style={{ fontFamily: Font.body, fontSize: "14px", fontWeight: 600, color: C.ink }}>סביבת ביקורת AI</div>
              {title && <div style={{ fontFamily: Font.body, fontSize: "11px", color: C.inkFaint }}>{title}</div>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontFamily: Font.body, fontSize: "11px", color: C.inkFaint }}>
              {annotations.length} הערות | {Math.round(annotations.reduce((s, a) => s + (a.end - a.start), 0) / Math.max(text.length, 1) * 100)}% כוסה
            </span>
            <Btn primary onClick={() => setView("report")}>צור דוח</Btn>
          </div>
        </div>

        {/* AI authorship banner */}
        <div style={{
          padding: "7px 20px", background: C.infoSoft, borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span style={{
            fontFamily: Font.body, fontSize: "10px", color: C.info, background: C.info + "22",
            padding: "2px 8px", borderRadius: "6px", fontWeight: 600,
          }}>נכתב על ידי AI</span>
          <span style={{ fontFamily: Font.body, fontSize: "11.5px", color: C.inkSoft }}>
            טקסט זה נוצר על ידי בינה מלאכותית מפרומפט אחיד. המטלה שלך: בקר אותו בביקורתיות.
          </span>
        </div>

        {/* Selection toolbar */}
        {selection && (
          <div style={{
            padding: "8px 20px", background: C.card, borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap",
          }}>
            <span style={{ fontFamily: Font.body, fontSize: "11px", color: C.inkFaint, marginLeft: "4px" }}>תייג כ:</span>
            {AUDIT_TYPES.map(t => {
              const IconFn = Icons[t.icon];
              return (
                <button key={t.id} onClick={() => createAnn(t.id)} title={t.desc} style={{
                  background: t.color + "14", border: `1px solid ${t.color}44`, borderRadius: "10px",
                  padding: "3px 11px", fontFamily: Font.body, fontSize: "11.5px", color: t.color,
                  cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px",
                  whiteSpace: "nowrap",
                }}>{IconFn && IconFn(12, t.color)} {t.label}</button>
              );
            })}
            <button onClick={() => { setSelection(null); window.getSelection()?.removeAllRanges(); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", marginRight: "auto" }}>
              {Icons.close(14, C.inkFaint)}
            </button>
          </div>
        )}

        {/* Hint */}
        {!selection && annotations.length === 0 && (
          <div style={{
            padding: "8px 20px", background: C.warnSoft, borderBottom: `1px solid ${C.border}`,
            fontFamily: Font.body, fontSize: "12px", color: C.inkSoft, textAlign: "center",
          }}>
            סמנו קטע טקסט כלשהו למטה כדי להתחיל את הביקורת
          </div>
        )}

        {/* Document */}
        <div style={{ flex: 1, overflow: "auto", padding: "28px 44px" }}>
          <DocViewer text={text} annotations={annotations} onSelect={handleSelect} activeId={activeId} onClickAnnotation={setActiveId} />
        </div>

        {/* Legend */}
        <div style={{
          padding: "7px 20px", background: C.card, borderTop: `1px solid ${C.border}`,
          display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center",
        }}>
          {AUDIT_TYPES.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: t.color }} />
              <span style={{ fontFamily: Font.body, fontSize: "10px", color: C.inkFaint }}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div style={{
        width: "370px", background: C.card, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0,
      }}>
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
          {[
            { id: "audit", label: `ביקורת (${annotations.length})` },
            { id: "prompt", label: "פרומפט" },
            { id: "guide", label: "מדריך" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setSidebarTab(tab.id)} style={{
              flex: 1, padding: "10px", background: sidebarTab === tab.id ? C.bg : C.card,
              border: "none", borderBottom: sidebarTab === tab.id ? `2px solid ${C.accent}` : "2px solid transparent",
              fontFamily: Font.body, fontSize: "12px", fontWeight: sidebarTab === tab.id ? 600 : 400,
              color: sidebarTab === tab.id ? C.ink : C.inkFaint, cursor: "pointer",
            }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "12px" }}>
          {sidebarTab === "audit" && (
            annotations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: C.inkFaint, fontFamily: Font.body, fontSize: "13px", lineHeight: "1.8" }}>
                <div style={{ marginBottom: "10px", opacity: 0.5 }}>{Icons.search(28, C.inkFaint)}</div>
                סמנו טקסט במסמך כדי ליצור את ההערה הראשונה.
                <div style={{ marginTop: "10px", fontSize: "11px" }}>
                  כל קטע שלא תבקרו הוא טקסט שלא נבדק — וזה נלקח בחשבון.
                </div>
              </div>
            ) : (
              [...annotations].reverse().map(ann => (
                <AnnCard key={ann.id} ann={ann} onUpdate={updateAnn} onDelete={deleteAnn} onEvidence={addEv} />
              ))
            )
          )}

          {sidebarTab === "prompt" && (
            <div style={{ fontFamily: Font.body, fontSize: "13px", color: C.inkSoft, lineHeight: "1.7", ...rtl }}>
              <div style={{ fontFamily: Font.display, fontSize: "16px", fontWeight: 500, color: C.ink, marginBottom: "10px" }}>פרומפט המטלה</div>
              <div style={{
                background: C.bg, borderRadius: "8px", padding: "14px", border: `1px solid ${C.border}`,
                fontFamily: Font.display, fontSize: "13.5px", lineHeight: "1.7", color: C.ink, marginBottom: "12px",
              }}>{prompt}</div>
              <div style={{
                background: C.accentSoft, borderRadius: "8px", padding: "12px",
                border: `1px solid ${C.accent}25`, fontSize: "12px", lineHeight: "1.7",
              }}>
                <strong style={{ color: C.accent }}>אודות הפרומפט</strong>
                <div style={{ marginTop: "4px", color: C.inkSoft }}>
                  פרומפט זה הוא לקריאה בלבד כרגע. כל הסטודנטים מקבלים את אותו פרומפט.
                  אנו בוחנים אפשרויות להתאמה אישית בגרסאות עתידיות.
                </div>
                <div style={{ marginTop: "6px", color: C.inkSoft }}>
                  תוצרי ה-AI עשויים להשתנות בין סטודנטים גם עם פרומפט זהה — כולם מיוצרים על ידי אותו מודל.
                  הציון שלך מבוסס על איכות המעורבות הביקורתית, לא על הטקסט הספציפי שקיבלת.
                </div>
              </div>
            </div>
          )}

          {sidebarTab === "guide" && (
            <div style={{ fontFamily: Font.body, fontSize: "13px", color: C.inkSoft, lineHeight: "1.7", ...rtl }}>
              <div style={{ fontFamily: Font.display, fontSize: "16px", fontWeight: 500, color: C.ink, marginBottom: "10px" }}>איך הביקורת עובדת</div>
              <div style={{ background: C.bg, borderRadius: "8px", padding: "12px", marginBottom: "14px", fontSize: "12.5px" }}>
                <strong style={{ color: C.ink }}>הביקורת שלך היא המטלה.</strong> ה-AI כתב את הטקסט — התפקיד שלך לבחון אותו כעורך/ת ביקורתי/ת. כל מה שתמצא (וכל מה שתחמיץ) משפיע על הציון.
              </div>

              <div style={{ fontFamily: Font.body, fontSize: "12px", fontWeight: 600, color: C.ink, marginBottom: "8px" }}>סוגי הערות</div>
              {AUDIT_TYPES.map(t => {
                const IconFn = Icons[t.icon];
                return (
                  <div key={t.id} style={{ marginBottom: "8px", padding: "8px 10px", background: t.color + "08", borderRadius: "6px", border: `1px solid ${t.color}18` }}>
                    <div style={{ fontWeight: 600, fontSize: "12px", color: t.color, display: "flex", alignItems: "center", gap: "5px" }}>
                      {IconFn && IconFn(13, t.color)} {t.label}
                    </div>
                    <div style={{ fontSize: "11.5px", color: C.inkSoft, marginTop: "2px" }}>{t.desc}</div>
                  </div>
                );
              })}

              <div style={{ fontFamily: Font.body, fontSize: "12px", fontWeight: 600, color: C.ink, margin: "16px 0 8px" }}>מדדי ציון</div>
              <div style={{ background: C.bg, borderRadius: "8px", padding: "12px", fontSize: "12px", lineHeight: "2" }}>
                <div style={{ color: C.success }}>+ נקודות על שגיאות שנמצאו עם ראיות</div>
                <div style={{ color: C.success }}>+ נקודות על טענות שאומתו כראוי</div>
                <div style={{ color: C.warn }}>+ נקודות על חלופות חזקות שהוצעו</div>
                <div style={{ color: C.gap }}>+ נקודות על זיהוי רכיבים חסרים</div>
                <div style={{ color: C.info }}>+ נקודות על תובנות דיסציפלינריות</div>
                <div style={{ marginTop: "6px", borderTop: `1px solid ${C.border}`, paddingTop: "6px" }}>
                  <div style={{ color: C.error }}>- נקודות על טענות לא מדויקות שנותרו ללא אימות</div>
                  <div style={{ color: C.error }}>- נקודות על שגיאות שהוחמצו</div>
                  <div style={{ color: C.error }}>- נקודות על תיוגי "אושר" ללא נימוק</div>
                </div>
              </div>

              <div style={{ marginTop: "14px", padding: "12px", background: C.bg, borderRadius: "8px", fontSize: "12px", lineHeight: "1.8" }}>
                <strong>טיפים:</strong>
                <div style={{ marginTop: "4px" }}>
                  בדקו כל נתון סטטיסטי ואזכור מקור מול מקורות אמיתיים
                  <br />חפשו מסגור מערבי-צנטרי שמוצג כאוניברסלי
                  <br />שימו לב מתי ה-AI מפשט יתר על המידה מנגנונים סיבתיים
                  <br />חשבו אילו פרספקטיבות או תיאוריות נעדרות
                  <br />ודאו שמחברים מצוטטים באמת טענו את מה שהטקסט מייחס להם
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
