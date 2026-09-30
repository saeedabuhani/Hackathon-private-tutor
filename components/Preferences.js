"use client";

import { useEffect, useState } from "react";
import useStore from "@/store/useStore";

const THEMES = ["dark", "light", "auto"];
const LANGUAGES = ["en", "he", "ar"];

function applyToHtml(theme, lang) {
  const root = document.documentElement;
  // "auto" follows the device: resolve it to a real theme so CSS only needs [data-theme="light"]
  const resolved =
    theme === "auto"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : theme;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  root.lang = lang;
  root.dir = lang === "he" || lang === "ar" ? "rtl" : "ltr";
}

// Renders nothing. Keeps three things in step: the store (theme, siteLanguage), localStorage
// (so the choice survives a refresh) and the <html> element (data-theme, lang, dir).
// The inline script in app/layout.js sets the same html attributes before the first paint,
// so there's no flash of the wrong theme; this component takes over once React is running.
export default function Preferences() {
  const theme = useStore((s) => s.theme);
  const siteLanguage = useStore((s) => s.siteLanguage);
  const [hydrated, setHydrated] = useState(false);

  // 1. Load what was saved last time (defaults are dark + English)
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      const savedLang = localStorage.getItem("siteLanguage");
      useStore.setState({
        ...(THEMES.includes(savedTheme) ? { theme: savedTheme } : {}),
        ...(LANGUAGES.includes(savedLang) ? { siteLanguage: savedLang } : {}),
      });
    } catch {
      // storage blocked (private mode): just use the defaults
    }
    setHydrated(true);
  }, []);

  // 2. Apply and save whenever a choice changes (not before step 1, or we'd overwrite it)
  useEffect(() => {
    if (!hydrated) return;
    applyToHtml(theme, siteLanguage);
    try {
      localStorage.setItem("theme", theme);
      localStorage.setItem("siteLanguage", siteLanguage);
    } catch {
      // ignore
    }
  }, [hydrated, theme, siteLanguage]);

  // 3. In "auto", follow the device if it switches between light and dark while the app is open
  useEffect(() => {
    if (!hydrated || theme !== "auto") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyToHtml("auto", siteLanguage);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [hydrated, theme, siteLanguage]);

  return null;
}
