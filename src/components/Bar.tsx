import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { A, out } from "../lib/router";
import { prefersReducedMotion } from "../lib/useReveal";
import { listen } from "../lib/live";
import type { Section } from "./Index";

const RESUME = "/Adam-Zhu-Resume.pdf";

/** Where each section begins and ends, in scroll positions. A section starts when its top
    reaches the reading line, a little under the bar. Projects on the pinned stage have no
    box of their own to measure, so they split the stage's run the way the stage does. */
function spans(sections: Section[]) {
  const max = document.documentElement.scrollHeight - innerHeight;
  const line = innerHeight * 0.4;
  const stage = document.querySelector<HTMLElement>(".pstage.pinned");
  const starts = sections.map(s => {
    const el = document.getElementById(s.id);
    if (!el) return null;
    if (stage && stage.contains(el)) {
      const i = Number(el.dataset.i ?? 0), n = Number(getComputedStyle(stage).getPropertyValue("--n")) || 1;
      return stage.getBoundingClientRect().top + scrollY + i * (stage.offsetHeight - innerHeight) / n;
    }
    return el.getBoundingClientRect().top + scrollY - line;
  });
  return starts.map((a, i) => {
    const s0 = Math.max(0, Math.min(max, a ?? 0));
    const next = starts.slice(i + 1).find(x => x != null);
    return [s0, Math.max(s0 + 1, Math.min(max, next ?? max))] as const;
  });
}

/** The track: one piece per section, each filling as you read through it. */
function useTrack(sections: Section[]) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !sections.length) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const sp = spans(sections);
      // the last sections can be too short to reach the reading line; the end of the page finishes them
      const end = scrollY >= document.documentElement.scrollHeight - innerHeight - 2;
      [...el.children].forEach((c, i) => {
        const [a, b] = sp[i];
        const f = end ? 1 : Math.min(1, Math.max(0, (scrollY - a) / (b - a)));
        (c as HTMLElement).style.setProperty("--f", String(f));
      });
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    const ro = new ResizeObserver(on);
    ro.observe(document.body);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); ro.disconnect(); cancelAnimationFrame(raf); };
  }, [sections]);
  return ref;
}

/** Whether you have left the top of the page. */
function useLifted() {
  const [lifted, setLifted] = useState(false);
  useEffect(() => {
    const read = () => setLifted(scrollY > 0);
    read();
    addEventListener("scroll", read, { passive: true });
    return () => removeEventListener("scroll", read);
  }, []);
  return lifted;
}

/**
 * The top bar, the same object on every route. At the top of a page it lies flat: the mark
 * and the links, nothing behind them. Once you scroll it gathers into a frosted pill over the
 * content; a chip inside it says where you are, and a track along its lower edge shows the
 * whole page as a strip of sections, each in its own colour.
 *
 * The mark is the year wheel in small, a ring with the today dot at the top in the colour of
 * whatever you are looking at. How far along you are is the track's job, not the mark's.
 */
export function Bar({ home = true, sections = [], cur }: { home?: boolean; sections?: Section[]; cur?: string }) {
  const pill = useRef<HTMLDivElement>(null);
  const chipText = useRef<HTMLSpanElement>(null);
  const lifted = useLifted();
  const track = useTrack(sections);
  const jump = (i: number) => {
    const [a] = spans(sections)[i];
    scrollTo({ top: i === 0 ? 0 : a + 2, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  const sec = sections.find(s => s.id === cur);
  const showChip = lifted && !!sec && sec.id !== sections[0]?.id;
  const chip = sec ? `${sec.group ?? ""}|${sec.n ?? ""}|${sec.label}` : "";
  /* "Projects / 01 TrueLine". The group drops out on a phone, where the pill is narrow. */
  const label = (c: string) => {
    const [g, n, l] = c.split("|");
    return <>{g && <span className="g">{g} / </span>}{n && `${n} `}{l}</>;
  };


  /* TrueLine's demo narrates itself into the chip while it plays: "Board 18.1 · 4.3 ft" as the
     ball rolls. The words arrive every frame, so they go straight into the span; React only
     hears when the readout starts or stops. The readout keeps a fixed width so the chip
     holds still while the numbers change. */
  const liveEl = useRef<HTMLSpanElement>(null);
  const [liveOn, setLiveOn] = useState(false);
  useEffect(() => listen(t => {
    if (t && liveEl.current) liveEl.current.textContent = t;
    setLiveOn(!!t);
  }), []);
  const showLive = showChip && liveOn && sec?.id === "p-trueline";
  const [liveW, setLiveW] = useState(0);
  useLayoutEffect(() => {
    const read = () => setLiveW(liveEl.current?.offsetWidth ?? 0);
    read();
    addEventListener("resize", read);
    return () => removeEventListener("resize", read);
  }, []);

  // the chip's width is measured from its text, so it can glide between labels
  const [chipW, setChipW] = useState(0);
  useLayoutEffect(() => { setChipW(chipText.current?.scrollWidth ?? 0); }, [chip, showLive]);

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

  return (
    <header className={`bar${lifted ? " lifted" : ""}`}>
      <div className="pill glass" ref={pill}>
        <A className="mark" href={home ? "#adam" : "/#projects"}
           aria-label={home ? "Adam Zhu, back to the top" : "Adam Zhu, back to the work"}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle className="ring" cx="12" cy="12" r="8.6" fill="none" strokeWidth="1.7" />
            <g className="az" fill="currentColor" transform="translate(12 12.6) scale(.236) translate(-33 -31)">
              <path d="M12 44 L20.5 18 L27.5 18 L36 44 L29.4 44 L27.7 38.2 L20.3 38.2 L18.6 44 Z M21.9 32.6 L26.1 32.6 L24 25.4 Z" />
              <path d="M36.5 18 L54 18 L54 23.6 L44.2 38.4 L54 38.4 L54 44 L36 44 L36 38.4 L45.8 23.6 L36.5 23.6 Z" />
            </g>
            <circle className="today" cx="12" cy="3.4" r="1.8" />
          </svg>
          <span>Adam Zhu</span>
        </A>

        <span className={`chip${showChip ? " on" : ""}${showLive ? " talking" : ""}`} aria-hidden={!showChip}
              style={{ width: showChip ? chipW + 38 + (showLive && liveW ? liveW + 10 : 0) : 0 }}>
          <i aria-hidden="true" />
          <span className="roll">
            {prev && <span key={`was-${prev}`} className="t out">{label(prev)}</span>}
            <span ref={chipText} key={chip} className={`t${prev ? " in" : ""}`}>{chip && label(chip)}</span>
          </span>
          <span className={`live${showLive ? " on" : ""}`} ref={liveEl} />
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

        {/* the page as a strip: a piece per section, filling as you read; any piece jumps there.
            A pointer convenience only: the links and headings already carry the page for a
            keyboard or a screen reader, and six more tab stops on every page would be in the way. */}
        {sections.length > 1 && (
          <div className="track" ref={track} aria-hidden="true">
            {sections.map((s, i) => (
              <button type="button" key={s.id} tabIndex={-1}
                      className={s.id === cur ? "on" : ""} onClick={() => jump(i)}
                      style={s.accent ? { "--c": s.accent } as CSSProperties : undefined}>
                <i /><span className="peek" aria-hidden="true">{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
