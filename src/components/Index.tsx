import { useEffect, useState } from "react";

/** A section of a page. `group` and `n` give a project its pip among the others in the bar's chip;
    `accent` colours its piece of the bar's track. */
export type Section = { id: string; label: string; group?: string; n?: string; accent?: string };

/** Marks whichever section owns the middle band of the viewport. */
export function useCurrentSection(sections: Section[], initial = sections[0]?.id ?? "") {
  const [cur, setCur] = useState(initial);
  useEffect(() => {
    const obs = sections.map(s => {
      const el = document.getElementById(s.id);
      if (!el) return null;
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setCur(s.id); }),
        { rootMargin: "-40% 0px -50% 0px" });
      io.observe(el);
      return io;
    });
    return () => obs.forEach(o => o?.disconnect());
  }, [sections]);
  return cur;
}
