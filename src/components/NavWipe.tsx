import { useEffect, useState, type TransitionEvent } from "react";

type NavWipePhase = "cover" | "exit";

/** Deep navy→purple ink, near-black — calm rather than loud. */
const WIPE_BACKGROUND = "linear-gradient(140deg, #0A102E 0%, #191036 55%, #0A0A14 100%)";

/**
 * Full-screen wipe for section navigation: a dark ink panel slides up over the page with the
 * destination label in display type, the scroll jump happens while the page is covered, then the
 * panel continues off the top. Pointer-events stay off so a missed transitionend can never trap
 * the page behind the overlay (the parent also clears it on a safety timeout).
 */
export function NavWipe({
  label,
  phase,
  onCovered,
  onDone,
}: {
  label: string;
  phase: NavWipePhase;
  onCovered: () => void;
  onDone: () => void;
}) {
  /* Mounts at translateY(100%); flips one frame later so the enter transition actually plays. */
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, []);

  const y = !entered ? "100%" : phase === "cover" ? "0%" : "-101%";
  const onEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "transform") {
      return;
    }
    if (phase === "cover") {
      onCovered();
    } else {
      onDone();
    }
  };

  return (
    <div
      aria-hidden
      onTransitionEnd={onEnd}
      className="pointer-events-none fixed inset-0 z-[70] flex items-end px-5 pb-8 sm:px-10 sm:pb-10"
      style={{
        background: WIPE_BACKGROUND,
        transform: `translate3d(0, ${y}, 0)`,
        transition: "transform 0.44s cubic-bezier(0.76, 0, 0.24, 1)",
      }}
    >
      <span className="select-none font-display text-[clamp(3.5rem,12vw,9rem)] font-bold uppercase leading-[0.9] text-white/95">
        {label}
      </span>
    </div>
  );
}
