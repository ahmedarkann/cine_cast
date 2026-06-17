import { useEffect } from "react";

const SITE_NAME = "cineCAST";
const DEFAULT_DESCRIPTION = "Slovakia's casting platform connecting performers with film, TV, and commercial productions.";

export function usePageMeta({ title, description } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Slovak Casting Agency`;
    const desc = description || DEFAULT_DESCRIPTION;

    document.title = fullTitle;

    const setMeta = (selector, value) => {
      let el = document.querySelector(selector);
      if (el) el.setAttribute("content", value);
    };

    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:description"]', desc);

    return () => {
      document.title = `${SITE_NAME} — Slovak Casting Agency`;
    };
  }, [title, description]);
}
