"use client";

import useStore from "@/store/useStore";
import { useTranslation, SITE_LANGUAGES } from "@/lib/translations";

const LANGUAGE_LABELS = { en: "EN", he: "עב", ar: "عر" };
const THEME_ICONS = { dark: "🌙", light: "☀️", auto: "💻" };
const NEXT_THEME = { dark: "light", light: "auto", auto: "dark" };

// Site language (EN | עב | عر) and theme (dark -> light -> auto). Used in the top bar and
// on the login / register pages.
export default function PreferencesControls() {
  const { t } = useTranslation();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const siteLanguage = useStore((s) => s.siteLanguage);
  const setSiteLanguage = useStore((s) => s.setSiteLanguage);

  const themeName = { dark: t.themeDark, light: t.themeLight, auto: t.themeAuto }[theme];

  return (
    <div className="flex items-center gap-3">
      <div
        role="group"
        aria-label={t.languageLabel}
        dir="ltr" // keep EN | עב | عر in this order even when the page is RTL
        className="flex gap-1 rounded-lg bg-slate-800 p-1"
      >
        {SITE_LANGUAGES.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setSiteLanguage(lang)}
            aria-pressed={siteLanguage === lang}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              siteLanguage === lang
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-100"
            }`}
          >
            {LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setTheme(NEXT_THEME[theme] || "dark")}
        title={`${t.themeLabel}: ${themeName}`}
        aria-label={`${t.themeLabel}: ${themeName}`}
        className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm leading-none hover:bg-slate-700"
      >
        {THEME_ICONS[theme] || THEME_ICONS.dark}
      </button>
    </div>
  );
}
