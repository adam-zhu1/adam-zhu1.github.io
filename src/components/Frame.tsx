import { useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from "react";
import { whenSeen } from "../lib/useReveal";

const EASES = [
  "cubic-bezier(.22,1,.36,1)",
  "cubic-bezier(.4,0,.2,1)",
  "cubic-bezier(.16,1,.3,1)",
  "cubic-bezier(.65,0,.35,1)",
];

export type FrameHandle = { show: () => void };

/**
 * A thin frame that draws itself: four edges, each with its own speed and delay, then the
 * corner ticks and the labels. It watches itself, so `.on` always lands on the element the
 * edge selectors target. `hold` keeps it dark until something else (the boot) says go.
 */
export function Frame({ className = "", tag, label, seed = 0, hold = false, threshold = 0.45, handleRef, children }: {
  className?: string; tag?: string; label?: ReactNode; seed?: number;
  hold?: boolean; threshold?: number; handleRef?: Ref<FrameHandle>; children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    ref.current?.querySelectorAll<HTMLElement>(":scope > .edge").forEach((e, i) => {
      e.style.setProperty("--d", `${0.9 + ((i + seed) % 4) * 0.28}s`);
      e.style.setProperty("--dl", `${((i * 3 + seed) % 4) * 0.12}s`);
      e.style.setProperty("--e", EASES[(i + seed) % 4]);
    });
  }, [seed]);

  useEffect(() => {
    const el = ref.current;
    if (!el || hold || on) return;
    /* band-gated like every other reveal, so a frame never draws itself while it is still
       a sliver at the bottom of the screen */
    return whenSeen(el, () => setOn(true), threshold);
  }, [hold, on, threshold]);

  useImperativeHandle(handleRef, () => ({ show: () => setOn(true) }), []);

  return (
    <div className={`win ${className}${on ? " on" : ""}`} ref={ref}>
      <i className="edge t" /><i className="edge r" /><i className="edge b" /><i className="edge l" />
      <i className="corner tl" /><i className="corner tr" /><i className="corner br" /><i className="corner bl" />
      {tag && <span className="tag">{tag}</span>}
      {children}
      {label && <span className="lbl">{label}</span>}
    </div>
  );
}
