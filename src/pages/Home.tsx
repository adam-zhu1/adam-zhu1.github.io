import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type TransitionEvent,
} from "react";

/** Hero name letters: small random nudge on hover (skipped when reduced motion). */
function HoverLetter({
  char,
  reducedMotion,
}: {
  char: string;
  reducedMotion: boolean;
}) {
  const [jitter, setJitter] = useState<{ x: number; y: number } | null>(null);

  return (
    <span
      className="inline-block origin-center transition-transform duration-[480ms] ease-[cubic-bezier(0.25,0.85,0.35,1)]"
      style={{
        transform:
          jitter && !reducedMotion ? `translate(${jitter.x}px, ${jitter.y}px)` : undefined,
      }}
      onMouseEnter={() => {
        if (reducedMotion) {
          return;
        }
        /** Max ~±3px per axis — very subtle drift */
        const n = 3;
        setJitter({
          x: (Math.random() - 0.5) * 2 * n,
          y: (Math.random() - 0.5) * 2 * n,
        });
      }}
      onMouseLeave={() => setJitter(null)}
    >
      {char}
    </span>
  );
}
import { CustomCursor } from "../components/CustomCursor";

const GITHUB_URL = "https://github.com/adam-zhu1";
const LINKEDIN_URL = "https://www.linkedin.com/in/adamzhu";
const EMAIL = "adamzhu@andrew.cmu.edu";
const EMAIL_MAILTO = `mailto:${EMAIL}`;

/** Sections: TOC + scroll targets (HashRouter: use click handlers, not raw hash links) */
const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "connect", label: "Connect" },
] as const;

/** Easing: accelerates, then eases into the end (ease-in-out style) */
const LINE_EASE = "cubic-bezier(0.45, 0, 0.15, 1)";
const LINE_DURATION_MS = 780;
const LINE_STAGGER_S = 0.09;
/** After last line finishes, text begins (seconds) */
const TEXT_AFTER_LINES_S =
  LINE_STAGGER_S * 3 + LINE_DURATION_MS / 1000 + 0.08;

/** Bump if you need everyone to see the cue again after changing placement */
const SCROLL_CUE_SESSION_KEY = "landingScrollCueDismissed_v2";

function IconGitHub({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
    </svg>
  );
}

/** 0 = black overlay, 1 = overlay fading, 2 = lines + text sequence */
type IntroStep = 0 | 1 | 2;

function getInitialReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getInitialIntroStep(): IntroStep {
  return getInitialReducedMotion() ? 2 : 0;
}

export default function Home() {
  const heroRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(getInitialReducedMotion);
  const [introStep, setIntroStep] = useState<IntroStep>(getInitialIntroStep);
  const [viewportW, setViewportW] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  const [activeSection, setActiveSection] = useState<string>("home");
  const [showScrollCue, setShowScrollCue] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    try {
      return sessionStorage.getItem(SCROLL_CUE_SESSION_KEY) !== "1";
    } catch {
      return true;
    }
  });

  const dismissScrollCue = useCallback(() => {
    setShowScrollCue((prev) => {
      if (!prev) {
        return prev;
      }
      try {
        sessionStorage.setItem(SCROLL_CUE_SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      return false;
    });
  }, []);

  const scrollToSection = useCallback(
    (id: (typeof SECTIONS)[number]["id"]) => {
      const el = document.getElementById(id);
      if (!el) {
        return;
      }
      if (id !== "home") {
        dismissScrollCue();
      }
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    },
    [dismissScrollCue],
  );

  /** Hide scroll hint after user scrolls or leaves the landing section */
  useEffect(() => {
    if (!showScrollCue) {
      return;
    }
    const check = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      /* Enough movement that they’ve engaged; still dismiss if they jump via TOC */
      if (y > Math.min(200, vh * 0.22)) {
        dismissScrollCue();
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [showScrollCue, dismissScrollCue]);

  useEffect(() => {
    if (activeSection !== "home") {
      dismissScrollCue();
    }
  }, [activeSection, dismissScrollCue]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    if (mq.matches) {
      setIntroStep(2);
    }
    const onMq = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      if (e.matches) {
        setIntroStep(2);
      }
    };
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    const id = window.requestAnimationFrame(() => {
      setIntroStep(1);
    });
    return () => window.cancelAnimationFrame(id);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || introStep !== 1) {
      return;
    }
    const ms = 780;
    const t = window.setTimeout(() => {
      setIntroStep((s) => (s === 1 ? 2 : s));
    }, ms);
    return () => window.clearTimeout(t);
  }, [introStep, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    const root = document.documentElement;
    root.classList.add("cursor-none");
    document.body.classList.add("cursor-none");
    return () => {
      root.classList.remove("cursor-none");
      document.body.classList.remove("cursor-none");
    };
  }, [reducedMotion]);

  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const update = () => {
      const el = heroRef.current;
      if (!el) {
        return;
      }
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top;
      const raw = (0 - top) / vh;
      const p = Math.min(Math.max(raw, 0), 1);
      setProgress(reducedMotion ? 0 : p);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reducedMotion]);

  /**
   * TOC highlight: use scroll position, not IntersectionObserver (home is ~220vh tall,
   * so observers often picked the wrong section, e.g. About always “active”).
   */
  useEffect(() => {
    const updateActive = () => {
      const marker = window.scrollY + window.innerHeight * 0.35;
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) {
          continue;
        }
        const top = el.offsetTop;
        if (top <= marker) {
          current = s.id;
        }
      }
      setActiveSection(current);
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, []);

  const splitPx = progress * Math.min(viewportW * 0.12, 140);

  const onIntroOverlayEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "opacity") {
      return;
    }
    setIntroStep((s) => (s === 1 ? 2 : s));
  };

  const motionClass = reducedMotion ? "landing-no-motion" : "landing-motion";
  const linkClass =
    "group inline-flex items-center gap-2 border border-white bg-black px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

  const tocLinkClass = (id: string) =>
    `block w-full text-left font-mono text-[10px] uppercase tracking-[0.22em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
      activeSection === id ? "text-white" : "text-brand hover:text-white"
    }`;

  const tocIndexClass = (id: string) =>
    activeSection === id ? "text-white" : "text-brand";

  const showOverlay = introStep < 2 && !reducedMotion;

  return (
    <div
      className={`min-h-dvh bg-black text-white [&_a]:cursor-none ${motionClass}`}
      data-intro-step={introStep}
      style={
        {
          "--line-ease": LINE_EASE,
          "--line-dur": `${LINE_DURATION_MS}ms`,
          "--line-stagger": `${LINE_STAGGER_S}s`,
          "--text-after-lines": `${TEXT_AFTER_LINES_S}s`,
        } as CSSProperties
      }
    >
      <CustomCursor />

      {showOverlay && (
        <div
          className={`pointer-events-none fixed inset-0 z-50 bg-black transition-opacity duration-[700ms] ease-out ${
            introStep === 1 ? "opacity-0" : "opacity-100"
          }`}
          aria-hidden
          onTransitionEnd={onIntroOverlayEnd}
        />
      )}

      {/* ─── Home (hero + sticky name split) ─── */}
      <section id="home" ref={heroRef} className="min-h-[220vh] scroll-mt-0">
        <div className="sticky top-0 flex min-h-dvh flex-col">
          <div className="px-5 pt-6 sm:px-10 sm:pt-8">
            <div className="landing-el landing-meta flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-brand sm:text-[11px]">
              <a
                href="#home"
                className="text-brand transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("home");
                }}
              >
                adamzhu.io
              </a>
              <span>CMU · STAT / ML</span>
            </div>
            <div className="intro-line intro-line-top mt-6 h-px w-full overflow-hidden sm:mt-7">
              <div className="intro-line-inner intro-line-inner-h h-px w-full origin-left bg-brand" />
            </div>
          </div>

          {/* Tighter pt under top rule; pb keeps space above bottom rule */}
          <div className="flex min-h-0 flex-1 flex-col justify-center px-5 pb-12 sm:px-10 lg:pb-16">
            <div className="mx-auto w-full max-w-[1600px] pb-10 pt-4 sm:pb-12 sm:pt-5">
              <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(4.5rem,auto)_minmax(0,1fr)] lg:gap-x-10 xl:gap-x-16">
                <div className="landing-el landing-name flex flex-col justify-center lg:min-h-0">
                  <div
                    className="select-none font-display text-[clamp(5.25rem,24vw,17.5rem)] font-bold uppercase leading-[0.76] tracking-[0.02em]"
                    style={{ willChange: "transform" }}
                  >
                    <div
                      className="block w-max text-white"
                      style={{
                        transform: reducedMotion ? undefined : `translateX(${-splitPx}px)`,
                      }}
                    >
                      {"Adam".split("").map((ch, i) => (
                        <HoverLetter key={`adam-${i}`} char={ch} reducedMotion={reducedMotion} />
                      ))}
                    </div>
                    <div
                      className="mt-[0.02em] block w-max pl-[clamp(3.25rem,19vw,14rem)] text-brand"
                      style={{
                        transform: reducedMotion ? undefined : `translateX(${splitPx}px)`,
                      }}
                    >
                      {"Zhu".split("").map((ch, i) => (
                        <HoverLetter key={`zhu-${i}`} char={ch} reducedMotion={reducedMotion} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vertical rule + scroll: min column height + min line length so both extend lower; cue sits lower */}
                <div className="hidden h-full min-h-0 flex-col items-center self-stretch lg:flex lg:min-h-[min(88vh,60rem)]">
                  <div
                    className="intro-line intro-line-v pointer-events-none relative flex min-h-0 w-full flex-1 flex-col items-center overflow-hidden"
                    aria-hidden
                  >
                    <div className="intro-line-inner intro-line-inner-v min-h-[min(44vh,28rem)] w-px min-w-px flex-1 origin-top bg-brand" />
                  </div>
                  {showScrollCue && activeSection === "home" && (
                    <div className="landing-el landing-scroll-cue-under mt-auto flex shrink-0 flex-col items-center gap-0 pt-5 pb-2 sm:pt-6 sm:pb-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand">Scroll</span>
                      <span className="scroll-cue-arrow inline-flex text-brand">
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="square"
                          aria-hidden
                        >
                          <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                      </span>
                    </div>
                  )}
                </div>

                <div className="landing-rail flex min-h-[min(52vh,520px)] flex-col justify-between gap-12 pt-6 lg:min-h-0 lg:pt-8">
                  <div className="landing-el landing-index flex">
                    <nav
                      className="flex w-full flex-col gap-4 border border-brand p-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white"
                      aria-label="On this page"
                    >
                      <span className="text-brand">Contents</span>
                      <ul className="flex flex-col gap-2.5">
                        {SECTIONS.map((s, i) => (
                          <li key={s.id}>
                            <a
                              href={`#${s.id}`}
                              className={tocLinkClass(s.id)}
                              aria-current={activeSection === s.id ? "page" : undefined}
                              onClick={(e) => {
                                e.preventDefault();
                                scrollToSection(s.id);
                              }}
                            >
                              <span className={tocIndexClass(s.id)}>{String(i + 1).padStart(2, "0")}</span>{" "}
                              {s.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>

                  <div className="landing-el landing-copy space-y-10">
                    <div className="intro-line intro-line-mid h-px w-full overflow-hidden">
                      <div className="intro-line-inner intro-line-inner-h h-px w-full origin-left bg-brand" />
                    </div>
                    <div className="space-y-3">
                      <p className="font-mono text-[12px] uppercase leading-relaxed tracking-[0.14em] text-white sm:text-[13px]">
                        Carnegie Mellon University
                      </p>
                      <p className="font-mono text-[12px] uppercase leading-relaxed tracking-[0.14em] text-brand sm:text-[13px]">
                        Statistics &amp; machine learning
                      </p>
                    </div>

                    <nav className="flex flex-wrap gap-3 sm:gap-4" aria-label="Social links">
                      <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={linkClass}>
                        <IconGitHub className="h-4 w-4" />
                        GitHub
                      </a>
                      <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className={linkClass}>
                        <IconLinkedIn className="h-4 w-4" />
                        LinkedIn
                      </a>
                      <a href={EMAIL_MAILTO} className={linkClass}>
                        <IconMail className="h-4 w-4" />
                        Email
                      </a>
                    </nav>
                  </div>

                  <p className="landing-el landing-deco font-display text-[clamp(4rem,14vw,9rem)] font-bold leading-none text-brand lg:text-right">
                    01
                  </p>
                </div>
              </div>

              {/* No vertical line on small screens — single cue under grid (desktop uses column above) */}
              {showScrollCue && activeSection === "home" && (
                <div className="landing-el landing-scroll-cue-under mt-40 flex flex-col items-center gap-0 lg:hidden">
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand">Scroll</span>
                  <span className="scroll-cue-arrow inline-flex text-brand">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="square"
                      aria-hidden
                    >
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 pb-8 sm:px-10 sm:pb-10">
            <div className="intro-line intro-line-foot h-px w-full overflow-hidden">
              <div className="intro-line-inner intro-line-inner-h h-px w-full origin-left bg-brand" />
            </div>
            <div className="landing-el landing-footer-meta flex justify-between pt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-brand sm:text-[11px]">
              <span>P. 001</span>
              <button
                type="button"
                className="text-right text-brand transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                onClick={() => scrollToSection("about")}
              >
                <span className="block">Next · About</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── About ─── */}
      <section
        id="about"
        className="scroll-mt-2 border-t border-brand px-5 py-24 sm:px-10 sm:py-28"
        aria-labelledby="about-heading"
      >
        <div className="mx-auto max-w-[1600px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-brand">02 · About</p>
          <h2 id="about-heading" className="mt-6 font-display text-5xl font-bold uppercase tracking-[0.02em] text-white sm:text-6xl md:text-7xl">
            About
          </h2>
          <p className="mt-8 max-w-2xl font-mono text-sm uppercase leading-relaxed tracking-[0.12em] text-white sm:text-base">
            I&apos;m a statistics and machine learning student at Carnegie Mellon. This section is a
            placeholder — swap in your story, interests, and what you&apos;re looking for next.
          </p>
        </div>
      </section>

      {/* ─── Work ─── */}
      <section
        id="work"
        className="scroll-mt-2 border-t border-brand px-5 py-24 sm:px-10 sm:py-28"
        aria-labelledby="work-heading"
      >
        <div className="mx-auto max-w-[1600px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-brand">03 · Work</p>
          <h2 id="work-heading" className="mt-6 font-display text-5xl font-bold uppercase tracking-[0.02em] text-white sm:text-6xl md:text-7xl">
            Work
          </h2>
          <p className="mt-8 max-w-2xl font-mono text-sm uppercase leading-relaxed tracking-[0.12em] text-white sm:text-base">
            Projects, research, and builds will go here — cards, links to write-ups, or case studies.
          </p>
        </div>
      </section>

      {/* ─── Connect ─── */}
      <section
        id="connect"
        className="scroll-mt-2 border-t border-brand px-5 py-24 sm:px-10 sm:py-28"
        aria-labelledby="connect-heading"
      >
        <div className="mx-auto max-w-[1600px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-brand">04 · Connect</p>
          <h2 id="connect-heading" className="mt-6 font-display text-5xl font-bold uppercase tracking-[0.02em] text-white sm:text-6xl md:text-7xl">
            Connect
          </h2>
          <p className="mt-8 max-w-xl font-mono text-sm uppercase leading-relaxed tracking-[0.12em] text-white sm:text-base">
            Reach out for collaborations, questions, or opportunities.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={linkClass}>
              <IconGitHub className="h-4 w-4" />
              GitHub
            </a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className={linkClass}>
              <IconLinkedIn className="h-4 w-4" />
              LinkedIn
            </a>
            <a href={EMAIL_MAILTO} className={linkClass}>
              <IconMail className="h-4 w-4" />
              {EMAIL}
            </a>
          </div>
        </div>
      </section>

      <style>{`
        html {
          scroll-behavior: smooth;
        }
        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }

        .landing-motion .intro-line-inner-h {
          transform: scaleX(0);
        }
        .landing-motion .intro-line-inner-v {
          transform: scaleY(0);
        }
        .landing-motion[data-intro-step="2"] .intro-line-top .intro-line-inner {
          animation: landing-line-x var(--line-dur) var(--line-ease) forwards;
          animation-delay: 0s;
        }
        .landing-motion[data-intro-step="2"] .intro-line-v .intro-line-inner {
          animation: landing-line-y var(--line-dur) var(--line-ease) forwards;
          animation-delay: var(--line-stagger);
        }
        .landing-motion[data-intro-step="2"] .intro-line-mid .intro-line-inner {
          animation: landing-line-x var(--line-dur) var(--line-ease) forwards;
          animation-delay: calc(var(--line-stagger) * 2);
        }
        .landing-motion[data-intro-step="2"] .intro-line-foot .intro-line-inner {
          animation: landing-line-x var(--line-dur) var(--line-ease) forwards;
          animation-delay: calc(var(--line-stagger) * 3);
        }

        .landing-no-motion .intro-line-inner-h {
          transform: scaleX(1);
        }
        .landing-no-motion .intro-line-inner-v {
          transform: scaleY(1);
        }

        @keyframes landing-line-x {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        @keyframes landing-line-y {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }

        .landing-motion .landing-el {
          opacity: 0;
          transform: translateY(18px);
        }
        .landing-motion[data-intro-step="2"] .landing-el {
          animation: landing-rise 0.62s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .landing-motion[data-intro-step="2"] .landing-meta {
          animation-delay: calc(var(--text-after-lines) + 0s);
        }
        .landing-motion[data-intro-step="2"] .landing-name {
          animation-delay: calc(var(--text-after-lines) + 0.06s);
        }
        .landing-motion[data-intro-step="2"] .landing-index {
          animation-delay: calc(var(--text-after-lines) + 0.12s);
        }
        .landing-motion[data-intro-step="2"] .landing-copy {
          animation-delay: calc(var(--text-after-lines) + 0.18s);
        }
        .landing-motion[data-intro-step="2"] .landing-deco {
          animation-delay: calc(var(--text-after-lines) + 0.24s);
        }
        .landing-motion[data-intro-step="2"] .landing-scroll-cue-under {
          animation-delay: calc(var(--text-after-lines) + 0.28s);
        }
        .landing-motion[data-intro-step="2"] .landing-footer-meta {
          animation-delay: calc(var(--text-after-lines) + 0.34s);
        }

        .scroll-cue-arrow {
          animation: scroll-cue-bob 1.35s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .scroll-cue-arrow {
            animation: none;
          }
        }

        @keyframes scroll-cue-bob {
          0%,
          100% {
            opacity: 0.45;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(8px);
          }
        }

        .landing-no-motion .landing-el {
          opacity: 1 !important;
          transform: none !important;
          animation: none !important;
        }

        @keyframes landing-rise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
