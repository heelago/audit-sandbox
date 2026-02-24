import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Text 1: The original SAMPLE_TEXT from the prototype ─────────────────────
const TEXT_1 = `מעמד חברתי והישגים לימודיים: מנגנוני שעתוק

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

// ── Text 2: Variation by דנה — same topic, slightly different framing ───────
const TEXT_2 = `השפעת מעמד חברתי על הישגים אקדמיים: ניתוח סוציולוגי

אחת הממצאים העקביים ביותר בסוציולוגיה של החינוך היא ההתאמה בין מעמד חברתי-כלכלי להישגים לימודיים. ממחקריו המוקדמים של קולמן (1966) ועד לנתוני PISA העכשוויים, תלמידים ממשפחות מבוססות מגיעים באופן שיטתי להישגים גבוהים יותר ממקביליהם מרקע מוחלש (Sirin, 2005; OECD, 2018).

המנגנון התרבותי עומד במרכז ההסבר הסוציולוגי. תיאוריית ההון התרבותי של בורדייה (1984) מתארת כיצד משפחות ממעמד גבוה מקנות לילדיהן כישורים, ידע ונטיות המוכרים ומתוגמלים על ידי המערכת החינוכית. ברנשטיין (1971) הרחיב גישה זו בתיאורו של "הקוד המרוחב" — צורת שיח המאפיינת מעמדות גבוהים ומתאימה לדרישות האקדמיה, בניגוד ל"קוד המצומצם" של מעמדות נמוכים. ילדים ממעמד הביניים מפתחים באופן טבעי את הקוד המרוחב בסביבה הביתית, ובכך זוכים ליתרון מובנה.

הממד הכלכלי מחזק את הפער התרבותי. נתוני ה-OECD מ-2018 מצביעים על כך שתלמידים ברבעון ההכנסה הנמוך ביותר נמוכים ב-42% בסיכוייהם להשלים לימודים אקדמיים. הפער מתבטא בגישה לא שווה למשאבים חינוכיים — שיעורים פרטיים, ספרים, טכנולוגיה — ובהכרח לעסוק בעבודה בשעות שתלמידים עשירים מקדישים ללימודים. לארו (2003) הדגימה כיצד סגנון הגידול במשפחות מעמד הביניים ("טיפוח מתואם") מכין ילדים למשא ומתן עם מוסדות, בעוד סגנון "הצמיחה הטבעית" של מעמד הפועלים אינו מקנה כלים אלה.

מוסדות חינוך עצמם משעתקים אי-שוויון. מערכות הפיצול (tracking) במדינות כמו גרמניה, אוסטריה והולנד מפנות תלמידים למסלולים אקדמיים או מקצועיים בגיל 10-12, כאשר ההתאמה למקצוע ההורים חזקה יותר מההתאמה ליכולת (Oakes, 1985). אפילו במערכות אינטגרטיביות, ציפיות מורים ושיטות הערכה מעדיפות באופן סמוי את ההביטוס של מעמד הביניים.

מבחינת מדיניות, הרפורמה הפינית של שנות ה-70 — ביטול מסלולים עם השקעה מסיבית בהכשרת מורים — הקטינה משמעותית את הפערים המעמדיים בהישגים. תוכניות Bolsa Família בברזיל העלו שיעורי הרשמה, אך ההשפעה על תוצאות למידה בפועל הייתה מוגבלת.

לסיכום, שעתוק אי-שוויון חינוכי מתרחש בערוצים תרבותיים, כלכליים ומוסדיים הפועלים בו-זמנית. מדיניות יעילה מחייבת התמודדות מערכתית עם כלל המנגנונים, ולא טיפול נקודתי בגורם בודד.

רשימת מקורות:
Bernstein, B. (1971). Class, Codes and Control, Vol. 1. Routledge.
Bourdieu, P. (1984). Distinction: A Social Critique of the Judgement of Taste. Harvard University Press.
Coleman, J. (1966). Equality of Educational Opportunity. U.S. Government Printing Office.
Lareau, A. (2003). Unequal Childhoods: Class, Race, and Family Life. University of California Press.
Oakes, J. (1985). Keeping Track: How Schools Structure Inequality. Yale University Press.
OECD (2018). Equity in Education: Breaking Down Barriers to Social Mobility. OECD Publishing.
Sirin, S. R. (2005). Socioeconomic Status and Academic Achievement. Review of Educational Research, 75(3), 417-453.`;

// ── Text 3: Variation by מירב — same topic, different emphasis ──────────────
const TEXT_3 = `מעמד חברתי והצלחה לימודית: מנגנוני שעתוק ואפשרויות לשינוי

הפער בהישגים לימודיים בין תלמידים ממעמדות שונים הוא תופעה חוצת-תרבויות שזכתה לתשומת לב מחקרית רבה מאז מחקרו הפורץ של קולמן (1966). עשורים של מחקר סוציולוגי מראים כי מעמד חברתי-כלכלי הוא המנבא החזק ביותר להצלחה אקדמית, חזק אף יותר מאינטליגנציה או מוטיבציה אישית (Bourdieu, 1984; Sirin, 2005).

בורדייה (1984) הציע את המסגרת התיאורטית המשפיעה ביותר להבנת תופעה זו. לפי תיאוריית ההון התרבותי, משפחות ממעמד גבוה מצוידות ב"הון תרבותי" — ידע, נימוסים, העדפות אסתטיות וכישורי שפה — שמוסדות חינוך מכירים בו ומתגמלים אותו, גם כשהדבר אינו מוצהר. בורדייה תיאר כיצד ילדי מעמד הביניים "יורשים" הביטוס — מערכת נטיות פנימית — שמתאים באופן טבעי לדרישות בית הספר.

המנגנון הכלכלי פועל במקביל ומחזק את הפער. על פי נתוני OECD מ-2020, בממוצע במדינות החברות, תלמידים מהרבעון הסוציו-אקונומי הנמוך ביותר פחותים ב-35% בסיכוייהם להגיע להשכלה גבוהה. פער זה מתורגם לגישה לא שווה לשיעורים פרטיים, פעילויות העשרה, טכנולוגיה וחומרי לימוד. כמו כן, כפי שלארו (2003) הדגימה, ילדים ממשפחות עניות נושאים אחריות ביתית כבדה יותר — מטלות, השגחה על אחים — שמצמצמת את הזמן הפנוי ללימודים.

מנגנונים מוסדיים ממלאים תפקיד משלים חשוב. מערכות מיון (tracking) כפי שתיאר אוקס (1985) מפצלות תלמידים למסלולים שונים על בסיס הערכות שמשקפות לעתים קרובות רקע מעמדי יותר מיכולת אקדמית. בגרמניה והולנד, מיון מתרחש כבר בגיל 10, והמחקר מראה התאמה חזקה יותר למקצוע ההורים מאשר לציונים. אפילו בסקנדינביה, שם אין מיון רשמי מוקדם, ציפיות מורים ונוהלי הערכה מעדיפים באופן סמוי את ההון התרבותי של מעמד הביניים.

ברמת המדיניות, דגם פינלנד הוא דוגמה מובילה: ביטול הפיצול האקדמי בשילוב עם הכשרה איכותית של מורים ומשאבים שווים הפחיתו את הפער המעמדי בהישגים באופן דרמטי מאז שנות ה-80. מנגד, תוכניות העברה מותנית כמו Oportunidades במקסיקו הצליחו להעלות שיעורי נוכחות אך פחות בשיפור איכות הלמידה עצמה.

סיכום: אי-שוויון חינוכי מתמשך הוא תוצר של מנגנונים תרבותיים, כלכליים ומוסדיים הפועלים במשולב. פתרון דורש גישה מערכתית — לא תיקון נקודתי, אלא שינוי מבני במספר חזיתות בו-זמנית.

רשימת מקורות:
Bourdieu, P. (1984). Distinction: A Social Critique of the Judgement of Taste. Harvard University Press.
Coleman, J. (1966). Equality of Educational Opportunity. U.S. Government Printing Office.
Lareau, A. (2003). Unequal Childhoods: Class, Race, and Family Life. University of California Press.
Oakes, J. (1985). Keeping Track: How Schools Structure Inequality. Yale University Press.
OECD (2020). Education at a Glance 2020. OECD Publishing.
Sirin, S. R. (2005). Socioeconomic Status and Academic Achievement. Review of Educational Research, 75(3), 417-453.`;

// ── Helper: find a substring and return [start, end] ────────────────────────
function locate(text: string, needle: string): [number, number] {
  const idx = text.indexOf(needle);
  if (idx === -1) {
    throw new Error(`Substring not found in text: "${needle.slice(0, 60)}..."`);
  }
  return [idx, idx + needle.length];
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// ── Assignment prompt ───────────────────────────────────────────────────────
const PROMPT = `כתוב חיבור אקדמי בן 400 מילים לקורס מבוא לסוציולוגיה בנושא: "כיצד מעמד חברתי משפיע על הישגים לימודיים?" כלול לפחות שלושה מקורות מחקריים, דון במנגנוני שעתוק חברתי, והתייחס להשלכות מדיניות. השתמש ברישום אקדמי פורמלי.`;

// ── Main seed function ──────────────────────────────────────────────────────
async function main() {
  console.log("Clearing existing data...");
  await prisma.beyondRubricFinding.deleteMany();
  await prisma.rubricMatch.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.annotation.deleteMany();
  await prisma.score.deleteMany();
  await prisma.rubricItem.deleteMany();
  await prisma.calibrationLog.deleteMany();
  await prisma.generatedText.deleteMany();
  await prisma.assignment.deleteMany();

  console.log("Creating assignment...");
  const assignment = await prisma.assignment.create({
    data: {
      title: "מבוא לסוציולוגיה — מעמד חברתי והישגים לימודיים",
      promptText: PROMPT,
      courseContext: "קורס מבוא לסוציולוגיה, שנה א׳, סמסטר ב׳. הסטודנטים למדו על שעתוק חברתי, תיאוריות מעמד, וגישות ביקורתיות לחינוך.",
      requirements: "400 מילים, לפחות 3 מקורות מחקריים, דיון במנגנוני שעתוק, התייחסות למדיניות, רישום אקדמי פורמלי.",
      knownPitfalls: "AI נוטה לפשט יתר את מנגנוני השעתוק, להציג נתונים סטטיסטיים שאינם ניתנים לאימות, לייחס טענות שגוי למחברים, ולהתעלם מפרספקטיבות לא-מערביות.",
      modelVersion: "claude-sonnet-4-20250514",
      status: "calibrating",
      instructorCode: "PROF01",
    },
  });

  console.log("Creating generated texts...");
  const text1 = await prisma.generatedText.create({
    data: {
      assignmentId: assignment.id,
      studentCode: "STU001",
      studentName: "דנה לוי",
      textContent: TEXT_1,
      wordCount: wordCount(TEXT_1),
      generationMeta: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        temperature: 0.7,
        tokenCount: 1847,
        generatedAt: "2025-01-15T10:23:00Z",
      }),
      difficultyRating: 3.2,
      rawQualityScore: 7.1,
      status: "analyzed",
    },
  });

  const text2 = await prisma.generatedText.create({
    data: {
      assignmentId: assignment.id,
      studentCode: "STU002",
      studentName: "יוסי כהן",
      textContent: TEXT_2,
      wordCount: wordCount(TEXT_2),
      generationMeta: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        temperature: 0.7,
        tokenCount: 1923,
        generatedAt: "2025-01-15T10:24:12Z",
      }),
      difficultyRating: 3.5,
      rawQualityScore: 6.8,
      status: "analyzed",
    },
  });

  const text3 = await prisma.generatedText.create({
    data: {
      assignmentId: assignment.id,
      studentCode: "STU003",
      studentName: "מירב אברהם",
      textContent: TEXT_3,
      wordCount: wordCount(TEXT_3),
      generationMeta: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        temperature: 0.7,
        tokenCount: 1891,
        generatedAt: "2025-01-15T10:25:33Z",
      }),
      difficultyRating: 3.0,
      rawQualityScore: 7.4,
      status: "analyzed",
    },
  });

  // ── RubricItems for Text 1 (STU001 — דנה לוי) ────────────────────────────
  console.log("Creating rubric items for Text 1...");

  // Issue 1: Unverifiable OECD 38% statistic
  const [s1, e1] = locate(
    TEXT_1,
    'פחותים ב-38% בסיכוייהם להשלים השכלה על-תיכונית בהשוואה לעמיתיהם העשירים ביותר'
  );
  await prisma.rubricItem.create({
    data: {
      textId: text1.id,
      passSource: "factual-verification",
      severity: "critical",
      category: "factual",
      locationStart: s1,
      locationEnd: e1,
      description:
        'הנתון "38%" אינו מופיע בדו"ח OECD 2019 בצורה זו. דו"ח Education at a Glance 2019 מציג פערים בהשכלה גבוהה אך הנתון המדויק שונה ותלוי-מדינה. AI נוטה ליצור נתונים סטטיסטיים שנראים אמינים אך אינם ניתנים לאימות.',
      idealResponse:
        "על הסטודנט לזהות שהנתון אינו ניתן לאימות, לחפש את הדו\"ח המקורי, ולציין שנתוני OECD מוצגים לפי מדינה ולא כממוצע גלובלי פשוט.",
      flaggedText:
        'פחותים ב-38% בסיכוייהם להשלים השכלה על-תיכונית בהשוואה לעמיתיהם העשירים ביותר',
      confirmed: true,
    },
  });

  // Issue 2: Bernstein/Bourdieu misattribution — linguistic codes attributed to Bourdieu
  const [s2, e2] = locate(
    TEXT_1,
    'בקודים הלשוניים, בהעדפות האסתטיות ובנורמות ההתנהגות'
  );
  await prisma.rubricItem.create({
    data: {
      textId: text1.id,
      passSource: "citation-accuracy",
      severity: "critical",
      category: "citation",
      locationStart: s2,
      locationEnd: e2,
      description:
        'הטקסט מייחס את מושג "הקודים הלשוניים" לבורדייה, אך המושג שייך לברנשטיין (Bernstein, 1971). בורדייה דיבר על "הביטוס" ו"הון תרבותי", לא על קודים לשוניים מרוחבים ומצומצמים. זהו שיבוש ייחוס נפוץ ב-AI.',
      idealResponse:
        "על הסטודנט לזהות שקודים לשוניים הם של ברנשטיין ולא בורדייה, ולהסביר את ההבדל בין שתי הגישות.",
      flaggedText:
        'בקודים הלשוניים, בהעדפות האסתטיות ובנורמות ההתנהגות',
      confirmed: true,
    },
  });

  // Issue 3: Western-centric framing of tracking systems
  const [s3, e3] = locate(
    TEXT_1,
    'מערכות מיון (tracking) המפצלות תלמידים למסלולים עיוניים או מקצועיים כבר בגיל 10 במדינות כמו גרמניה והולנד'
  );
  await prisma.rubricItem.create({
    data: {
      textId: text1.id,
      passSource: "disciplinary-review",
      severity: "moderate",
      category: "disciplinary",
      locationStart: s3,
      locationEnd: e3,
      description:
        "הדיון במערכות מיון מתמקד באופן בלעדי בדגמים אירופיים מערביים ומתעלם ממערכות מיון בהקשרים שונים — כמו מערכת הבגרויות הישראלית, מערכות הבחינות באסיה המזרחית, או דפוסי הפרדה חינוכית בדרום הגלובלי. מסגור זה מציג את חוויית המערב כאוניברסלית.",
      idealResponse:
        "על הסטודנט לזהות את ההטיה המערבית-צנטרית ולהציע דוגמאות ממערכות חינוך נוספות, במיוחד מהקשרים לא-מערביים.",
      flaggedText:
        'מערכות מיון (tracking) המפצלות תלמידים למסלולים עיוניים או מקצועיים כבר בגיל 10 במדינות כמו גרמניה והולנד',
      confirmed: true,
    },
  });

  // Issue 4: Missing intersectional analysis (gap)
  const [s4, e4] = locate(
    TEXT_1,
    'לסיכום, שעתוק אי-שוויון חינוכי באמצעות מעמד חברתי פועל דרך ערוצים תרבותיים, כלכליים ומוסדיים בו-זמנית. מדיניות אפקטיבית חייבת לטפל בכל שלושת המנגנונים במקום להתייחס לגורם בודד בבידוד.'
  );
  await prisma.rubricItem.create({
    data: {
      textId: text1.id,
      passSource: "gap-detection",
      severity: "moderate",
      category: "gap",
      locationStart: s4,
      locationEnd: e4,
      description:
        "הסיכום מתייחס למעמד חברתי כגורם מבודד ומתעלם לחלוטין מאינטרסקציונליות — חפיפה של מעמד עם מגדר, מוצא אתני, גזע, מוגבלות ומיקום גיאוגרפי. חיבור אקדמי בסוציולוגיה ב-2024 צריך להתייחס לכך שמעמד אינו פועל בחלל ריק.",
      idealResponse:
        "על הסטודנט לציין שהטקסט חסר ניתוח אינטרסקציונלי ולהסביר כיצד ציר מעמד מצטלב עם צירים נוספים של אי-שוויון.",
      flaggedText:
        'לסיכום, שעתוק אי-שוויון חינוכי באמצעות מעמד חברתי פועל דרך ערוצים תרבותיים, כלכליים ומוסדיים בו-זמנית.',
      confirmed: true,
    },
  });

  // Issue 5: Oversimplification of Finland's education reform
  const [s5, e5] = locate(
    TEXT_1,
    'ביטול מערכת המיון בפינלנד בשילוב השקעה כבדה בהכשרת מורים צמצם באופן משמעותי את פערי ההישגים המעמדיים, והפך את פינלנד למערכת החינוך השוויונית בעולם מאז שנות ה-90'
  );
  await prisma.rubricItem.create({
    data: {
      textId: text1.id,
      passSource: "structural-analysis",
      severity: "moderate",
      category: "structural",
      locationStart: s5,
      locationEnd: e5,
      description:
        'הטקסט מציג את הרפורמה הפינית כסיפור הצלחה חד-ממדי ומפשט יתר על המידה. הרפורמה החלה בשנות ה-70 (לא ה-90), כללה שינויים מבניים רחבים הרבה מעבר לביטול מיון והכשרת מורים (מערכת רווחה, שוויון כלכלי, אוטונומיה מוניציפלית), ויש עליה ביקורת גוברת לגבי ירידה בהישגים בעשור האחרון.',
      idealResponse:
        "על הסטודנט לזהות את הפישוט היתר ולציין שהרפורמה הפינית החלה בשנות ה-70, היא רב-ממדית, ויש עליה גם ביקורת.",
      flaggedText:
        'ביטול מערכת המיון בפינלנד בשילוב השקעה כבדה בהכשרת מורים צמצם באופן משמעותי את פערי ההישגים המעמדיים, והפך את פינלנד למערכת החינוך השוויונית בעולם מאז שנות ה-90',
      confirmed: true,
    },
  });

  // ── RubricItems for Text 2 (STU002 — יוסי כהן) ───────────────────────────
  console.log("Creating rubric items for Text 2...");

  // Issue 6: Bernstein's codes presented as extension of Bourdieu — misattribution
  const [s6, e6] = locate(
    TEXT_2,
    'ברנשטיין (1971) הרחיב גישה זו בתיאורו של "הקוד המרוחב" — צורת שיח המאפיינת מעמדות גבוהים ומתאימה לדרישות האקדמיה, בניגוד ל"קוד המצומצם" של מעמדות נמוכים'
  );
  await prisma.rubricItem.create({
    data: {
      textId: text2.id,
      passSource: "citation-accuracy",
      severity: "moderate",
      category: "citation",
      locationStart: s6,
      locationEnd: e6,
      description:
        'הטקסט מציג את ברנשטיין כ"מרחיב" של בורדייה, אך היסטורית ברנשטיין פיתח את תיאוריית הקודים באופן עצמאי ומוקדם יותר (1958-1971). בורדייה וברנשטיין עבדו במקביל עם מסגרות שונות. הצגת ברנשטיין כהמשך של בורדייה היא שיבוש היסטוריוגרפי.',
      idealResponse:
        "על הסטודנט לזהות שברנשטיין אינו 'הרחבה' של בורדייה אלא גישה עצמאית, ולהבהיר את היחס ההיסטורי בין שתי התיאוריות.",
      flaggedText:
        'ברנשטיין (1971) הרחיב גישה זו',
      confirmed: true,
    },
  });

  // Issue 7: Unverifiable 42% statistic in Text 2
  const [s7, e7] = locate(
    TEXT_2,
    'נמוכים ב-42% בסיכוייהם להשלים לימודים אקדמיים'
  );
  await prisma.rubricItem.create({
    data: {
      textId: text2.id,
      passSource: "factual-verification",
      severity: "critical",
      category: "factual",
      locationStart: s7,
      locationEnd: e7,
      description:
        'הנתון "42%" שמיוחס לנתוני OECD 2018 אינו מופיע בדו"ח Equity in Education בצורה זו. הדו"ח מציג פערים שונים לפי מדינה ולפי מדד, ואינו מסכם אותם בנתון גלובלי יחיד. זהו דפוס אופייני של AI — יצירת נתון שנראה ספציפי ואמין אך שאינו ניתן לאימות.',
      idealResponse:
        'על הסטודנט לנסות לאמת את הנתון מול הדו"ח המקורי ולגלות שהוא אינו מופיע כנתון מצרפי.',
      flaggedText:
        'נמוכים ב-42% בסיכוייהם להשלים לימודים אקדמיים',
      confirmed: true,
    },
  });

  // Issue 8: Missing discussion of digital divide in Text 2
  const [s8, e8] = locate(
    TEXT_2,
    'הפער מתבטא בגישה לא שווה למשאבים חינוכיים — שיעורים פרטיים, ספרים, טכנולוגיה'
  );
  await prisma.rubricItem.create({
    data: {
      textId: text2.id,
      passSource: "gap-detection",
      severity: "minor",
      category: "gap",
      locationStart: s8,
      locationEnd: e8,
      description:
        'הטקסט מזכיר "טכנולוגיה" ברשימת משאבים אך אינו מפתח את הנושא. הפער הדיגיטלי (digital divide) הפך למנגנון שעתוק חשוב בפני עצמו, במיוחד מאז מגפת הקורונה. היעדרו בולט בחיבור אקדמי עכשווי.',
      idealResponse:
        "על הסטודנט לציין שהפער הדיגיטלי הוא רכיב חסר ולהסביר את חשיבותו כמנגנון שעתוק עכשווי.",
      flaggedText:
        'הפער מתבטא בגישה לא שווה למשאבים חינוכיים — שיעורים פרטיים, ספרים, טכנולוגיה',
      confirmed: true,
    },
  });

  // ── RubricItems for Text 3 (STU003 — מירב אברהם) ─────────────────────────
  console.log("Creating rubric items for Text 3...");

  // Issue 9: Unverifiable 35% OECD 2020 statistic
  const [s9, e9] = locate(
    TEXT_3,
    'פחותים ב-35% בסיכוייהם להגיע להשכלה גבוהה'
  );
  await prisma.rubricItem.create({
    data: {
      textId: text3.id,
      passSource: "factual-verification",
      severity: "critical",
      category: "factual",
      locationStart: s9,
      locationEnd: e9,
      description:
        'הנתון "35%" שמיוחס ל-Education at a Glance 2020 אינו מופיע בדו"ח בצורה מצרפית זו. הדו"ח מציג נתונים לפי מדינה ומדד, ואינו נותן ממוצע גלובלי פשוט של פערים בגישה להשכלה גבוהה. שוב, דפוס אופייני של נתוני-רוח (hallucinated statistics).',
      idealResponse:
        'על הסטודנט לזהות שנתון אחוזי מצרפי כזה לא סביר כייצוג של דו"ח OECD ולנסות לאמת אותו.',
      flaggedText:
        'פחותים ב-35% בסיכוייהם להגיע להשכלה גבוהה',
      confirmed: true,
    },
  });

  // Issue 10: Oversimplified claim about intelligence vs. SES
  const [s10, e10] = locate(
    TEXT_3,
    'מעמד חברתי-כלכלי הוא המנבא החזק ביותר להצלחה אקדמית, חזק אף יותר מאינטליגנציה או מוטיבציה אישית'
  );
  await prisma.rubricItem.create({
    data: {
      textId: text3.id,
      passSource: "structural-analysis",
      severity: "moderate",
      category: "structural",
      locationStart: s10,
      locationEnd: e10,
      description:
        'הטענה שמעמד חברתי-כלכלי הוא "המנבא החזק ביותר — חזק אף יותר מאינטליגנציה" היא פישוט יתר של ויכוח מורכב בספרות. מטא-אנליזות (כמו Sirin, 2005) מראות מתאם בינוני (r≈0.30), וההשוואה לאינטליגנציה תלויה באופן המדידה ובהקשר. הצגה כה מוחלטת אינה מדויקת מבחינה אקדמית.',
      idealResponse:
        "על הסטודנט לזהות את הצגת הטענה כוודאית מדי ולציין שגודל ההשפעה תלוי-הקשר ותלוי-מדידה.",
      flaggedText:
        'מעמד חברתי-כלכלי הוא המנבא החזק ביותר להצלחה אקדמית, חזק אף יותר מאינטליגנציה או מוטיבציה אישית',
      confirmed: true,
    },
  });

  // ── Calibration logs ──────────────────────────────────────────────────────
  console.log("Creating calibration logs...");
  await prisma.calibrationLog.createMany({
    data: [
      {
        assignmentId: assignment.id,
        action: "initial_generation",
        notes: "Generated 3 texts from shared prompt with claude-sonnet-4-20250514, temperature 0.7",
      },
      {
        assignmentId: assignment.id,
        action: "automated_analysis",
        notes: "Ran factual-verification, citation-accuracy, structural-analysis, disciplinary-review, and gap-detection passes on all 3 texts",
      },
      {
        assignmentId: assignment.id,
        action: "professor_review",
        notes: "Professor confirmed 10 rubric items across 3 texts. Noted that OECD statistics are consistently hallucinated across all variants — good discriminating issue.",
      },
    ],
  });

  console.log("Seed completed successfully!");
  console.log(`  Assignment: ${assignment.id} (${assignment.title})`);
  console.log(`  Text 1: ${text1.id} (${text1.studentCode} — ${text1.studentName}, ${wordCount(TEXT_1)} words)`);
  console.log(`  Text 2: ${text2.id} (${text2.studentCode} — ${text2.studentName}, ${wordCount(TEXT_2)} words)`);
  console.log(`  Text 3: ${text3.id} (${text3.studentCode} — ${text3.studentName}, ${wordCount(TEXT_3)} words)`);
  console.log("  Rubric items: 10 (5 for Text 1, 3 for Text 2, 2 for Text 3)");
  console.log("  Calibration logs: 3");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
