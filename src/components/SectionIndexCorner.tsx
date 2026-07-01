import type { CSSProperties } from "react";

type SectionIndexCornerProps = {
  label: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Big display section word used as a corner watermark — shared by the Home hero rail and each
 * section corner. Tuned line-height + padding so glyphs aren't clipped; pair with
 * overflow-visible parents.
 */
export function SectionIndexCorner({ label, className = "", style }: SectionIndexCornerProps) {
  return (
    <div
      className={`flex flex-col items-end gap-0 overflow-visible text-right font-display font-bold uppercase text-white ${className}`}
      style={style}
    >
      <span className="block select-none py-[0.16em] text-[clamp(2rem,6.5vw,4.25rem)] leading-[0.95] tracking-tight">
        {label}
      </span>
    </div>
  );
}

/** Shared absolute shell (add your own `bottom-*` so Work can sit above the horizontal rail). */
export const sectionIndexCornerAbsoluteWrap =
  "pointer-events-none absolute right-5 z-20 sm:right-10";
