import { useEffect, useState } from "react";

export type Section = { id: string; label: string };

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

/**
 * The dot rail. Same object on every route; only the contents change, so a project page
 * reads as the same site one level down rather than as a different website.
 */
export function Index({ sections, cur }: { sections: Section[]; cur: string }) {
  return (
    <nav className="idx" aria-label="Sections">
      {sections.map(s => (
        <a key={s.id} href={`#${s.id}`} className={cur === s.id ? "cur" : ""}
           aria-current={cur === s.id ? "true" : undefined}>
          <i aria-hidden="true" /><span>{s.label}</span>
        </a>
      ))}
    </nav>
  );
}
