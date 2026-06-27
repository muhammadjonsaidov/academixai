import { createContext, useContext, useState, useEffect, createElement, type ReactNode } from "react";
import { uz } from "./uz";
import { en } from "./en";
import { ru } from "./ru";
import type { Translations } from "./uz";

export type Lang = "uz" | "en" | "ru";

const LANGS: Record<Lang, Translations> = { uz, en, ru };
const STORAGE_KEY = "academix_lang";

const LangContext = createContext<{
  lang: Lang;
  t: Translations;
  setLang: (l: Lang) => void;
}>({ lang: "uz", t: uz, setLang: () => {} });

const isBrowser = typeof localStorage !== "undefined";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (!isBrowser) return "uz";
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    return stored && stored in LANGS ? stored : "uz";
  });

  function setLang(l: Lang) {
    if (isBrowser) localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }

  return createElement(LangContext.Provider, { value: { lang, t: LANGS[lang], setLang } }, children);
}

export function useT() {
  return useContext(LangContext);
}

export function getLang(): Lang {
  if (!isBrowser) return "uz";
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  return stored && stored in LANGS ? stored : "uz";
}

export function getAiLangInstruction(): string {
  return LANGS[getLang()].aiLang;
}

export type { Translations };
export { uz, en, ru };
