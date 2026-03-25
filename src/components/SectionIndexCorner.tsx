import type { CSSProperties } from "react";

type SectionIndexCornerProps = {
  /** Two-digit string, e.g. "01" */
  index: string;
  label: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Big Bebas index + mono label — shared by Home rail and section corners.
 * Tuned line-height + padding so glyphs aren’t clipped; pair with overflow-y-visible parents.
 */
export function SectionIndexCorner({ index, label, className = "", style }: SectionIndexCornerProps) {
  return (
    <div
      className={`flex flex-col items-end gap-0 overflow-visible text-right font-display font-bold text-white ${className}`}
      style={style}
    >
      <span className="block select-none py-[0.16em] text-[clamp(3.5rem,12vw,7.5rem)] leading-[0.95] tracking-tight">
        {index}
      </span>
      <span className="-mt-1 block font-mono text-[clamp(11px,2.4vw,14px)] uppercase leading-tight tracking-[0.28em] text-white/50 sm:-mt-1.5">
        {label}
      </span>
    </div>
  );
}

/** Shared absolute shell (add your own `bottom-*` so Work can sit above the horizontal rail). */
export const sectionIndexCornerAbsoluteWrap =
  "pointer-events-none absolute right-5 z-20 sm:right-10";
