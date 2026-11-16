import { useEffect, useRef, useState } from "react";
import { A, out } from "../lib/router";
import { setTheme, useTheme } from "../lib/theme";
import type { Section } from "./Index";

const RESUME = "/Adam-Zhu-Resume.pdf";

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

/** Day and night, as one switch: the sun and the moon share a track and the knob slides. */
function ThemeSwitch() {
  const t = useTheme();
  const light = t === "light";
  return (
    <button type="button" className={`theme${light ? " light" : ""}`} role="switch" aria-checked={!light}
            aria-label="Dark mode" onClick={() => setTheme(light ? "dark" : "light")}>
      <i aria-hidden="true" />
      <svg viewBox="0 0 16 16" aria-hidden="true" className="sun">
        <circle cx="8" cy="8" r="3" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
          <line key={a} x1="8" y1="1.6" x2="8" y2="3.1" transform={`rotate(${a} 8 8)`} />
        ))}
      </svg>
      <svg viewBox="0 0 16 16" aria-hidden="true" className="moon">
        <path d="M12.6 10.2A5.2 5.2 0 0 1 5.8 3.4a5.2 5.2 0 1 0 6.8 6.8Z" />
      </svg>
    </button>
  );
}

/**
 * The top bar, the same object on every route. At the top of a page it lies flat: the mark
 * and the links. Once you scroll it gathers into a plain pill: a near-solid surface, a hairline
 * edge and a soft shadow, nothing refracted. It only carries the way out (the links, the resume) and the light switch; where
 * you are inside the projects is the wheel's to show, not the bar's.
 */
export function Bar({ home = true }: { home?: boolean; sections?: Section[]; cur?: string }) {
  const pill = useRef<HTMLDivElement>(null);
  const lifted = useLifted();
  const links = useRef<HTMLElement>(null);
  const hov = useRef<HTMLSpanElement>(null);
  /* one soft highlight that slides from link to link under the pointer, instead of each lighting up on its own */
  const over = (e: React.PointerEvent) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>(".links > a:not(.cv)");
    const h = hov.current, box = links.current;
    if (!h || !box) return;
    if (!a) { h.style.opacity = "0"; return; }
    const was = h.style.opacity === "1";
    h.style.transition = was ? "" : "none";
    h.style.transform = `translateX(${a.offsetLeft}px)`;
    h.style.width = `${a.offsetWidth}px`;
    if (!was) { void h.offsetWidth; h.style.transition = ""; }
    h.style.opacity = "1";
  };

  return (
    <header className={`bar${lifted ? " lifted" : ""}`}>
      <div className="pill" ref={pill}>
        <A className="mark" href={home ? "#adam" : "/#projects"}
           aria-label={home ? "Adam Zhu, back to the top" : "Adam Zhu, back to the projects"}>
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

        <nav className="links" aria-label="Site" ref={links} onPointerOver={over} onPointerLeave={() => { if (hov.current) hov.current.style.opacity = "0"; }}>
          <span className="hov" ref={hov} aria-hidden="true" />
          {home ? <>
            <a href="#projects">Projects</a>
            <a href="#contact">Contact</a>
          </> : <>
            <A href="/#projects">Projects</A>
            <A href="/#contact">Contact</A>
          </>}
          <a className="cv" {...out} href={RESUME}>Resume<i aria-hidden="true">&#8599;</i></a>
          <ThemeSwitch />
        </nav>
      </div>
    </header>
  );
}
