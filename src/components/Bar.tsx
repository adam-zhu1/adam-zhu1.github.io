import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { A, out } from "../lib/router";
import { useLiquidGlass } from "../lib/glass";
import { prefersReducedMotion } from "../lib/useReveal";
import type { Section } from "./Index";

const RESUME = "/Adam-Zhu-Resume.pdf";

/** How far down the page you are, 0 to 1, and whether you have left the top. */
function useScrollProgress() {
  const [p, setP] = useState(0);
  const [lifted, setLifted] = useState(false);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      setP(max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0);
      setLifted(scrollY > 0);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return [p, lifted] as const;
}

/**
 * The top bar, the same object on every route. At the top of a page it lies flat: the mark
 * and the links, nothing behind them. Once you scroll it gathers into a pill of liquid glass
 * over the content, and a chip inside it says where you are, in that section's colour.
 *
 * The mark is the year wheel in small: its arc fills as you read down the page and the
 * today dot rides the end of it, so the logo doubles as the scroll position.
 */
export function Bar({ home = true, sections = [], cur }: { home?: boolean; sections?: Section[]; cur?: string }) {
  const pill = useRef<HTMLDivElement>(null);
  const chipText = useRef<HTMLSpanElement>(null);
  const [p, lifted] = useScrollProgress();
  useLiquidGlass(pill);

  const sec = sections.find(s => s.id === cur);
  const showChip = lifted && !!sec && sec.id !== sections[0]?.id;
  const chip = sec ? `${sec.group ?? ""}|${sec.n ?? ""}|${sec.label}` : "";
  /* "Projects / 01 TrueLine". The group drops out on a phone, where the pill is narrow. */
  const label = (c: string) => {
    const [g, n, l] = c.split("|");
    return <>{g && <span className="g">{g} / </span>}{n && `${n} `}{l}</>;
  };

  // the chip's width is measured from its text, so it can glide between labels
  const [chipW, setChipW] = useState(0);
  useLayoutEffect(() => { setChipW(chipText.current?.scrollWidth ?? 0); }, [chip]);

  // a label change rolls: the old one goes up and out while the new one comes up from below
  const [prev, setPrev] = useState<string | null>(null);
  const last = useRef(chip);
  useEffect(() => {
    if (last.current === chip) return;
    const was = last.current;
    last.current = chip;
    if (!was || prefersReducedMotion()) return;
    setPrev(was);
    const t = setTimeout(() => setPrev(null), 460);
    return () => clearTimeout(t);
  }, [chip]);

  const angle = p * 360;

  return (
    <header className={`bar${lifted ? " lifted" : ""}`}>
      <div className="pill glass" ref={pill}>
        <A className="mark" href={home ? "#adam" : "/#projects"}
           aria-label={home ? "Adam Zhu, back to the top" : "Adam Zhu, back to the work"}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle className="track" cx="12" cy="12" r="8.6" fill="none" strokeWidth="1.7" />
            <circle className="arc" cx="12" cy="12" r="8.6" fill="none" stroke="var(--frame)" strokeWidth="1.7"
                    strokeLinecap="round" pathLength={100} strokeDasharray="100 100"
                    strokeDashoffset={100 - Math.max(p * 100, 0.01)} transform="rotate(-90 12 12)" />
            <g className="az" fill="currentColor" transform="translate(12 12.6) scale(.236) translate(-33 -31)">
              <path d="M12 44 L20.5 18 L27.5 18 L36 44 L29.4 44 L27.7 38.2 L20.3 38.2 L18.6 44 Z M21.9 32.6 L26.1 32.6 L24 25.4 Z" />
              <path d="M36.5 18 L54 18 L54 23.6 L44.2 38.4 L54 38.4 L54 44 L36 44 L36 38.4 L45.8 23.6 L36.5 23.6 Z" />
            </g>
            <g transform={`rotate(${angle} 12 12)`}><circle className="today" cx="12" cy="3.4" r="1.8" /></g>
          </svg>
          <span>Adam Zhu</span>
        </A>

        <span className={`chip${showChip ? " on" : ""}`} aria-hidden={!showChip}
              style={{ width: showChip ? chipW + 38 : 0 }}>
          <i aria-hidden="true" />
          <span className="roll">
            {prev && <span key={`was-${prev}`} className="t out">{label(prev)}</span>}
            <span ref={chipText} key={chip} className={`t${prev ? " in" : ""}`}>{chip && label(chip)}</span>
          </span>
        </span>

        <nav className="links" aria-label="Site">
          {home ? <>
            <a href="#projects">Work</a>
            <a href="#contact">Contact</a>
          </> : <>
            <A href="/#projects">Work</A>
            <A href="/#contact">Contact</A>
          </>}
          <a className="cv" {...out} href={RESUME}>Resume<i aria-hidden="true">&#8599;</i></a>
        </nav>
      </div>
    </header>
  );
}
