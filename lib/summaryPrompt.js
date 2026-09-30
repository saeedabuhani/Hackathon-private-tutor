// System prompt for /api/summary. No imports, so it can be tested on its own.
//
// Why one template per language: a single Hebrew template with "answer in Arabic" at the end
// made the model copy the Hebrew headers and drift back to Hebrew (or to the material's own
// language). Here the headers are already written in the target language and the instruction
// comes FIRST and is explicit.

const NAMES = { he: "Hebrew", ar: "Arabic", en: "English" };

const TEMPLATES = {
  he: {
    title: "# 📚 סיכום: [שם הנושא]",
    about: "## 🎯 על מה מדובר (2-3 משפטים)",
    aboutHint: "הסבר קצר שילד יבין על מה החומר.",
    topics: "## 📌 נושאים מרכזיים",
    topic: "### [שם הנושא]",
    topicBullets: ["הגדרה פשוטה", "דוגמה קצרה", "למה זה חשוב"],
    remember: "## 💡 הדברים הכי חשובים לזכור",
    rememberHint: "רשימה של 5-7 נקודות מפתח",
    exam: "## ❓ שאלות שכנראה יהיו במבחן",
    examHint: "3-5 שאלות על הנושאים המרכזיים",
    links: "## 🔗 קשרים בין נושאים",
    linksHint: "איך הנושאים קשורים אחד לשני",
  },
  ar: {
    title: "# 📚 ملخص: [اسم الموضوع]",
    about: "## 🎯 عن ماذا تتحدث المادة (2-3 جمل)",
    aboutHint: "شرح قصير يفهمه طفل عن موضوع المادة.",
    topics: "## 📌 المواضيع الرئيسية",
    topic: "### [اسم الموضوع]",
    topicBullets: ["تعريف بسيط", "مثال قصير", "لماذا هذا مهم"],
    remember: "## 💡 أهم النقاط التي يجب تذكرها",
    rememberHint: "قائمة من 5-7 نقاط رئيسية",
    exam: "## ❓ أسئلة متوقعة في الامتحان",
    examHint: "3-5 أسئلة عن المواضيع الرئيسية",
    links: "## 🔗 العلاقات بين المواضيع",
    linksHint: "كيف ترتبط المواضيع ببعضها",
  },
  en: {
    title: "# 📚 Summary: [topic name]",
    about: "## 🎯 What it is about (2-3 sentences)",
    aboutHint: "A short explanation a child could understand.",
    topics: "## 📌 Main topics",
    topic: "### [topic name]",
    topicBullets: ["Simple definition", "Short example", "Why it matters"],
    remember: "## 💡 The most important things to remember",
    rememberHint: "A list of 5-7 key points",
    exam: "## ❓ Questions likely to appear on the exam",
    examHint: "3-5 questions about the main topics",
    links: "## 🔗 How the topics connect",
    linksHint: "How the topics relate to each other",
  },
};

// The strict one-line rule for each language (asked for verbatim)
const MUST = {
  ar: "You MUST answer entirely in Arabic. Every word must be in Arabic.",
  he: "You MUST answer entirely in Hebrew. Every word must be in Hebrew.",
  en: "You MUST answer entirely in English.",
};

export const SUMMARY_LANGUAGES = Object.keys(NAMES);

export function buildSummaryPrompt(language) {
  const lang = TEMPLATES[language] ? language : "en";
  const T = TEMPLATES[lang];
  const name = NAMES[lang];
  return `${MUST[lang]}
This applies even if the study material below is written in another language: read it, then write the whole summary in ${name}. Translate the ideas, do not copy sentences from the material. Only code, and technical terms that have no common ${name} equivalent, may stay as they are.

You are an expert at summarizing study material. Summarize the material below clearly and in an organized way, following this structure exactly (headers are already written in ${name}; keep them and the emojis):

${T.title}

${T.about}
${T.aboutHint}

${T.topics}
For every topic:
${T.topic}
${T.topicBullets.map((b) => `- ${b}`).join("\n")}

${T.remember}
${T.rememberHint}

${T.exam}
${T.examHint}

${T.links}
${T.linksHint}

The summary must be clear enough that someone who never read the material understands everything.
NEVER invent facts that aren't in the material below.

${MUST[lang]}`;
}

// ---- checking the answer really is in the requested language ----

const SCRIPTS = {
  he: /[֐-׿]/g,
  ar: /[؀-ۿݐ-ݿ]/g,
  en: /[A-Za-z]/g,
};

// Share (0..1) of the letters in `text` that belong to language's script.
// Code blocks and inline code are ignored: they are Latin whatever the language.
export function scriptShare(text, language) {
  const prose = String(text || "").replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
  const count = (re) => (prose.match(re) || []).length;
  const total = count(SCRIPTS.he) + count(SCRIPTS.ar) + count(SCRIPTS.en);
  if (!total) return 1;
  return count(SCRIPTS[language] || SCRIPTS.en) / total;
}

export function isInLanguage(text, language) {
  // Technical terms in Latin are expected inside Hebrew / Arabic text, so those need less
  return scriptShare(text, language) >= (language === "en" ? 0.85 : 0.6);
}

// One line for the retry when the first answer came back in the wrong language
export function retryReminder(language) {
  const name = NAMES[language] || "English";
  return `Your previous answer was NOT written in ${name}. Rewrite the whole summary again, ENTIRELY in ${name}. ${MUST[language] || ""}`;
}
