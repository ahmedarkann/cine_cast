import { useState, useEffect, useCallback } from "react";
import { getLang, setLang as setLangFn, t as tFn } from "@/lib/i18n";

export function useLang() {
  const [lang, setLangState] = useState(getLang);

  useEffect(() => {
    const handler = () => setLangState(getLang());
    window.addEventListener("langchange", handler);
    return () => window.removeEventListener("langchange", handler);
  }, []);

  const setLang = useCallback((l) => {
    setLangFn(l);
  }, []);

  const t = useCallback((section, key) => tFn(section, key), [lang]); // eslint-disable-line

  return { lang, setLang, t };
}