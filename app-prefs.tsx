import { useEffect, useState, useCallback } from "react";

// ---------- Theme ----------
const THEME_KEY = "sb-theme";
export type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(THEME_KEY)) as Theme | null;
    const initial: Theme = stored === "dark" || stored === "light" ? stored : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  return { theme, toggle };
}

// ---------- Language ----------
const LANG_KEY = "sb-lang";

export const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "Русский" },
  { code: "bn", label: "বাংলা" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "ur", label: "اردو" },
  { code: "tr", label: "Türkçe" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ไทย" },
];

export function languageLabel(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.label ?? "English";
}

export function useLanguage() {
  const [lang, setLangState] = useState<string>("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(LANG_KEY) : null;
    if (stored) setLangState(stored);
  }, []);

  const setLang = useCallback((code: string) => {
    setLangState(code);
    try {
      localStorage.setItem(LANG_KEY, code);
    } catch {}
  }, []);

  return { lang, setLang };
}
