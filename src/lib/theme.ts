import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const read = (): Theme => document.documentElement.dataset.theme === "light" ? "light" : "dark";
const subs = new Set<(t: Theme) => void>();

/** Sets the theme on the page, remembers it, and tells everything that listens. */
export function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", t === "light" ? "#f1f1ee" : "#070708");
  try { localStorage.setItem("theme", t); } catch { /* private window: it lasts the visit */ }
  subs.forEach(f => f(t));
}

/** The current theme. index.html has already set it before the first paint. */
export function useTheme() {
  const [t, set] = useState<Theme>(read);
  useEffect(() => { subs.add(set); return () => { subs.delete(set); }; }, []);
  return t;
}
