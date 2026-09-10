import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../lib/useReveal";

/**
 * The opening: a black sheet while the wheel assembles itself on top, then the sheet lifts
 * and the page is underneath. Storage is wrapped because a sandboxed frame throws on access,
 * and a thrown error here would take the whole page's motion down with it.
 */
export const seen = {
  get() { try { return !!sessionStorage.getItem("booted"); } catch { return false; } },
  set() { try { sessionStorage.setItem("booted", "1"); } catch { /* storage blocked */ } },
};

export function Boot({ play, onDone }: { play: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<"run" | "fade" | "gone">("run");
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) { setPhase("gone"); onDone(); return; }
    scrollTo(0, 0);
    play();
    const t1 = setTimeout(() => setHint(true), 700);
    const t2 = setTimeout(() => { setPhase("fade"); onDone(); }, 2500);
    const t3 = setTimeout(() => setPhase("gone"), 3400);
    seen.set();
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [play, onDone]);

  const skip = () => { setPhase("fade"); onDone(); setTimeout(() => setPhase("gone"), 900); };
  if (phase === "gone") return null;
  return (
    <div className={`boot${phase === "fade" ? " done" : ""}${hint ? " hint-on" : ""}`} aria-hidden="true">
      <button className="hint" type="button" onClick={skip}>Click to skip</button>
    </div>
  );
}
