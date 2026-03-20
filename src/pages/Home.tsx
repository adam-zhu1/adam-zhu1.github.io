import {
  useCallback,
  useEffect,
  useMemo,
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
        /** Max ~±4px per axis — very subtle drift */
        const n = 4;
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

/**
 * Scroll-scrubbed animations (e.g. About) hit full progress in this fraction of the
 * section’s scroll span; the rest is “cushion” before the next section enters view.
 */
const SECTION_SCROLL_ANIM_COMPLETE = 0.62;

/** Bump if you need everyone to see the cue again after changing placement */
const SCROLL_CUE_SESSION_KEY = "landingScrollCueDismissed_v2";
/** Cue only shows when scroll is within this many px of the top (“all the way up”). */
const SCROLL_CUE_AT_TOP_MAX_PX = 72;

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

function clamp01(n: number): number {
  return Math.min(Math.max(n, 0), 1);
}

/** About sticky scrub: item `index` animates in top-to-bottom (slide up + fade); last step = corner 02/About. */
const ABOUT_STAGGER_STEPS = 8;

function aboutStaggerStyle(
  index: number,
  progress: number,
  reducedMotion: boolean,
  slidePx = 34,
): CSSProperties | undefined {
  if (reducedMotion) {
    return undefined;
  }
  const slot = 1 / ABOUT_STAGGER_STEPS;
  /** Fraction of each slot used for the in-animation (rest is hold / next item starts). */
  const soft = 0.52;
  const t = clamp01((progress - index * slot) / (slot * soft));
  return {
    opacity: t,
    transform: `translateY(${(1 - t) * slidePx}px)`,
  };
}

export default function Home() {
  const heroRef = useRef<HTMLElement | null>(null);
  const aboutRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  /** 0 = Home / “01”; 1 = About handoff — drives big index, lines, backing morph. */
  const [sectionBridge, setSectionBridge] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(getInitialReducedMotion);
  const [introStep, setIntroStep] = useState<IntroStep>(getInitialIntroStep);
  const [viewportW, setViewportW] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  const [activeSection, setActiveSection] = useState<string>("home");
  /** About: 0 = black / hidden, 1 = full reveal (scroll-driven; 1 if reduced motion). */
  const [aboutRevealProgress, setAboutRevealProgress] = useState(() =>
    getInitialReducedMotion() ? 1 : 0,
  );
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

  /** Eased 0→1: letters move slower early, still reach full split at raw progress 1. */
  const HERO_NAME_SCROLL_EASE = 1.72;
  const scrollMotionEased = useMemo(
    () => (reducedMotion ? 0 : Math.pow(progress, HERO_NAME_SCROLL_EASE)),
    [progress, reducedMotion],
  );

  /**
   * Brand panel behind the hero name: scroll 0→1 drifts gently and morphs from a
   * tight frame toward a softer “pill” — keeps motion subtle so type stays focal.
   */
  const nameBackingStyle: CSSProperties = useMemo(() => {
    if (reducedMotion) {
      return { transform: "translate3d(0, 0, 0)", borderRadius: "0.25rem", opacity: 1 };
    }
    const p = scrollMotionEased;
    const b = sectionBridge;
    const tx = (p - 0.5) * 20;
    const ty = p * 14;
    const rot = (p - 0.5) * 1.4;
    const s = 1 + p * 0.015;
    const borderRadius = `${0.125 + p * 2}rem`;
    const bridgeLift = -b * 52;
    const bridgeScale = 1 - b * 0.14;
    return {
      transform: `translate3d(${tx}px, ${ty + bridgeLift}px, 0) rotate(${rot * (1 - b * 0.35)}deg) scale(${s * bridgeScale})`,
      borderRadius,
      opacity: 1 - b * 0.94,
      willChange: "transform, opacity",
    };
  }, [scrollMotionEased, reducedMotion, sectionBridge]);

  /** Whole name + panel scales down slightly as you move through the hero (stays on-screen). */
  const nameGroupScaleStyle: CSSProperties = useMemo(
    () =>
      reducedMotion
        ? {}
        : {
            transform: `scale(${1 - scrollMotionEased * 0.045})`,
            transformOrigin: "center center",
          },
    [scrollMotionEased, reducedMotion],
  );

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
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const smooth = !reduced;

      /** About: landing at block-start is black (reveal=0). Jump to where scrub is finished. */
      if (id === "about") {
        const aboutEl = aboutRef.current ?? el;
        const vh = window.innerHeight;
        const aboutTop = aboutEl.offsetTop;
        const aboutH = aboutEl.offsetHeight;
        const stickyScrollRange = Math.max(aboutH - vh, 1);
        const maxY = Math.max(0, document.documentElement.scrollHeight - vh);
        const targetY = Math.min(
          aboutTop + stickyScrollRange * SECTION_SCROLL_ANIM_COMPLETE + 12,
          maxY,
        );
        const run = () => window.scrollTo({ top: targetY, behavior: "auto" });
        run();
        window.requestAnimationFrame(run);
        setAboutRevealProgress(1);
        return;
      }

      el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    },
    [dismissScrollCue],
  );

  /**
   * Scroll cue: hide after scrolling down into the page; show again only when
   * scrolled back to the very top of Home (same session). Leaving Home hides it.
   */
  useEffect(() => {
    const check = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const dismissThreshold = Math.min(200, vh * 0.22);

      if (activeSection !== "home") {
        dismissScrollCue();
        return;
      }

      if (y <= SCROLL_CUE_AT_TOP_MAX_PX) {
        setShowScrollCue(true);
        try {
          sessionStorage.removeItem(SCROLL_CUE_SESSION_KEY);
        } catch {
          /* ignore */
        }
        return;
      }

      if (y > dismissThreshold) {
        dismissScrollCue();
      }
    };

    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
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

  /** Hero progress + Home→About bridge (01→02, backing morph, line parallax). */
  useEffect(() => {
    const update = () => {
      const el = heroRef.current;
      const vh = window.innerHeight;
      if (el) {
        const top = el.getBoundingClientRect().top;
        const raw = (0 - top) / vh;
        const p = clamp01(raw);
        setProgress(reducedMotion ? 0 : p);
      }

      const aboutEl = aboutRef.current ?? document.getElementById("about");
      if (!aboutEl) {
        setSectionBridge(0);
        setAboutRevealProgress(0);
        return;
      }

      const scrollY = window.scrollY;
      const aboutTop = aboutEl.offsetTop;
      const aboutH = aboutEl.offsetHeight;

      if (reducedMotion) {
        const marker = scrollY + vh * 0.38;
        setSectionBridge(marker >= aboutTop ? 1 : 0);
        setAboutRevealProgress(1);
        return;
      }

      const start = aboutTop - vh * 1.38;
      const end = aboutTop - vh * 0.06;
      const range = Math.max(end - start, 1);
      const br = clamp01((scrollY - start) / range);
      setSectionBridge(br);

      /** Sticky About: 0→1 in the first part of the section scroll; then cushion before Work. */
      const stickyScrollRange = Math.max(aboutH - vh, 1);
      const revealRaw =
        (scrollY - aboutTop) / Math.max(stickyScrollRange * SECTION_SCROLL_ANIM_COMPLETE, 1);
      setAboutRevealProgress(clamp01(revealRaw));
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
   * TOC highlight: use scroll position, not IntersectionObserver (home is tall,
   * so observers often picked the wrong section, e.g. About always “active”).
   */
  useEffect(() => {
    const updateActive = () => {
      const marker = window.scrollY + window.innerHeight * 0.35;
      let current: (typeof SECTIONS)[number]["id"] = SECTIONS[0].id;
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

  /** Same max spread as pre–full-section edit; driven by eased scroll (see scrollMotionEased). */
  const splitPx = scrollMotionEased * Math.min(viewportW * 0.12, 140);

  /** Inline bridge parallax only after intro lines + text are allowed (avoids fighting landing-rise). */
  const bridgeOn = introStep >= 2 && sectionBridge > 0;

  /** About: background layers still follow overall scroll progress. */
  const aboutDecorOpacity = reducedMotion ? 1 : aboutRevealProgress;

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
    `group block w-full text-left font-mono text-[10px] uppercase tracking-[0.22em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
      activeSection === id ? "text-white" : "text-brand hover:text-white"
    }`;

  /** Index span must match label hover — explicit brand was blocking inherited hover. */
  const tocIndexClass = (id: string) =>
    activeSection === id ? "text-white" : "text-brand group-hover:text-white";

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
      <section id="home" ref={heroRef} className="min-h-[125vh] scroll-mt-0">
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
            <div
              className="intro-line intro-line-top mt-6 h-px w-full overflow-hidden sm:mt-7"
              style={
                reducedMotion
                  ? undefined
                  : bridgeOn
                    ? { transform: `translateX(${sectionBridge * 18}px)` }
                    : undefined
              }
            >
              <div className="intro-line-inner intro-line-inner-h h-px w-full origin-left bg-brand" />
            </div>
          </div>

          {/* Tighter pt under top rule; pb keeps space above bottom rule */}
          <div className="flex min-h-0 flex-1 flex-col justify-center px-5 pb-12 sm:px-10 lg:pb-16">
            <div className="mx-auto w-full max-w-[1600px] pb-10 pt-4 sm:pb-12 sm:pt-5">
              <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(4.5rem,auto)_minmax(0,1fr)] lg:gap-x-10 xl:gap-x-16">
                <div className="landing-el landing-name flex min-w-0 flex-col justify-center lg:min-h-0">
                  <div className="mx-auto w-fit max-w-full" style={nameGroupScaleStyle}>
                    <div className="relative isolate inline-block w-fit max-w-full select-none font-display text-[clamp(5.25rem,24vw,17.5rem)] font-bold uppercase leading-[0.76] tracking-[0.02em]">
                      <div
                        aria-hidden
                        className="pointer-events-none absolute left-[0.35rem] right-[0.35rem] -top-[0.65rem] -bottom-[0.65rem] z-0 bg-brand/[0.07] ring-1 ring-inset ring-brand/[0.14] sm:left-[0.45rem] sm:right-[0.45rem] sm:-top-[0.8rem] sm:-bottom-[0.8rem]"
                        style={nameBackingStyle}
                      />
                      <div className="relative z-10 w-fit min-w-0">
                        <div
                          className="block w-max text-white"
                          style={{
                            transform: reducedMotion ? undefined : `translateY(${-splitPx}px)`,
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
                  </div>
                </div>

                {/* Vertical rule + scroll: min column height + min line length so both extend lower; cue sits lower */}
                <div
                  className="hidden h-full min-h-0 flex-col items-center self-stretch lg:flex lg:min-h-[min(88vh,60rem)]"
                  style={
                    reducedMotion
                      ? undefined
                      : bridgeOn
                        ? { transform: `translateY(${sectionBridge * -22}px)` }
                        : undefined
                  }
                >
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

                <div className="landing-rail flex min-h-[min(52vh,520px)] flex-col gap-12 pt-6 lg:min-h-0 lg:flex-1 lg:self-stretch lg:pt-8">
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

                  <div
                    className="landing-el landing-copy space-y-10"
                    style={
                      reducedMotion
                        ? undefined
                        : bridgeOn
                          ? {
                              opacity: clamp01(1 - sectionBridge * 0.92),
                              transform: `translate3d(${sectionBridge * 8}px, ${sectionBridge * 28}px, 0)`,
                            }
                          : undefined
                    }
                  >
                    <div
                      className="intro-line intro-line-mid h-px w-full overflow-hidden"
                      style={
                        reducedMotion
                          ? undefined
                          : bridgeOn
                            ? { transform: `translateX(${-sectionBridge * 22}px)` }
                            : undefined
                      }
                    >
                      <div className="intro-line-inner intro-line-inner-h h-px w-full origin-left bg-brand" />
                    </div>
                    <div
                      className="space-y-3"
                      style={
                        reducedMotion
                          ? undefined
                          : bridgeOn
                            ? {
                                transform: `translateY(${sectionBridge * 12}px)`,
                                opacity: clamp01(1 - sectionBridge * 0.55),
                              }
                            : undefined
                      }
                    >
                      <p className="font-mono text-[12px] uppercase leading-relaxed tracking-[0.14em] text-white sm:text-[13px]">
                        Carnegie Mellon University
                      </p>
                      <p className="font-mono text-[12px] uppercase leading-relaxed tracking-[0.14em] text-brand sm:text-[13px]">
                        Statistics &amp; machine learning
                      </p>
                    </div>

                    <nav
                      className="flex flex-wrap gap-3 sm:gap-4"
                      aria-label="Social links"
                      style={
                        reducedMotion
                          ? undefined
                          : bridgeOn
                            ? {
                                opacity: clamp01(1 - sectionBridge * 0.75),
                                transform: `translateY(${sectionBridge * 18}px) scale(${1 - sectionBridge * 0.04})`,
                                transformOrigin: "left center",
                              }
                            : undefined
                      }
                    >
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

                  <div
                    aria-hidden
                    className="landing-el landing-corner-index mt-auto flex w-full flex-col items-end gap-2 self-end pt-4 text-right font-display font-bold leading-none text-brand pointer-events-none lg:pt-6"
                  >
                    <span className="block text-[clamp(3.5rem,12vw,7.5rem)] tracking-tight">01</span>
                    <span className="block font-mono text-[clamp(11px,2.4vw,14px)] uppercase tracking-[0.28em] text-brand/90">
                      Home
                    </span>
                  </div>
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
            <div
              className="intro-line intro-line-foot h-px w-full overflow-hidden"
              style={
                reducedMotion
                  ? undefined
                  : bridgeOn
                    ? { transform: `translateX(${sectionBridge * 14}px)` }
                    : undefined
              }
            >
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
        {/* Extra scroll after hero before About (animations feel “done” before the next screen). */}
        <div aria-hidden className="pointer-events-none min-h-[min(48vh,520px)] w-full shrink-0" />
      </section>

      {/* ─── About: tall track + sticky full-viewport panel (scrub reveal while pinned) ─── */}
      <section
        id="about"
        ref={aboutRef}
        className="relative scroll-mt-0 border-t border-brand/50 bg-black min-h-[260vh]"
        aria-labelledby="about-heading"
      >
        <div className="sticky top-0 z-10 relative min-h-dvh w-full overflow-hidden bg-black">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-30%,rgba(230,57,70,0.14),transparent_55%),linear-gradient(180deg,rgba(12,12,12,0.95)_0%,#000_45%,#030303_100%)]"
            style={{ opacity: aboutDecorOpacity }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(230,57,70,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(230,57,70,0.45)_1px,transparent_1px)] [background-size:min(3.5rem,10vw)_min(3.5rem,10vw)]"
            style={{ opacity: 0.07 * aboutDecorOpacity }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent"
            style={{ opacity: aboutDecorOpacity }}
          />

          <div className="relative z-10 mx-auto flex min-h-dvh max-w-[1600px] flex-col justify-center px-5 pb-20 pt-28 sm:px-10 sm:pb-28 sm:pt-32">
            <div className="grid gap-14 lg:grid-cols-12 lg:gap-10 lg:gap-y-16">
              <div className="flex flex-col gap-0 lg:col-span-7">
                <div style={aboutStaggerStyle(0, aboutRevealProgress, reducedMotion)}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-brand/90 sm:text-[11px]">
                    02 · About
                  </p>
                </div>
                <div className="mt-5 sm:mt-6" style={aboutStaggerStyle(1, aboutRevealProgress, reducedMotion)}>
                  <h2
                    id="about-heading"
                    className="font-display text-[clamp(2.5rem,7.5vw,4.75rem)] font-bold uppercase leading-[0.92] tracking-[0.02em] text-white"
                  >
                    Curiosity
                    <span className="block text-brand">driven by data</span>
                  </h2>
                </div>
                <div className="mt-10" style={aboutStaggerStyle(2, aboutRevealProgress, reducedMotion)}>
                  <p className="max-w-xl font-mono text-sm uppercase leading-relaxed tracking-[0.14em] text-white/85 sm:text-[15px]">
                    I&apos;m a statistics &amp; machine learning student at{" "}
                    <span className="text-white">Carnegie Mellon</span> — interested in rigorous methods,
                    clear communication, and tools that actually help people decide under uncertainty.
                  </p>
                </div>
                <div className="mt-6" style={aboutStaggerStyle(3, aboutRevealProgress, reducedMotion)}>
                  <p className="max-w-xl font-mono text-[12px] uppercase leading-relaxed tracking-[0.12em] text-brand/90 sm:text-[13px]">
                    This space is yours to shape: research threads, coursework highlights, side projects,
                    and what you want to explore next.
                  </p>
                </div>
              </div>

              <aside className="flex flex-col gap-4 lg:col-span-5 lg:justify-center">
                <div
                  className="border border-brand/45 bg-brand/[0.04] p-6 backdrop-blur-sm"
                  style={aboutStaggerStyle(4, aboutRevealProgress, reducedMotion)}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand">Now</p>
                  <p className="mt-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-white/90 sm:text-[12px]">
                    CMU · Statistics &amp; ML — coursework, research, and experiments in inference &
                    learning.
                  </p>
                </div>
                <div style={aboutStaggerStyle(5, aboutRevealProgress, reducedMotion, 28)}>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="border border-white/15 bg-white/[0.03] p-4 sm:p-5">
                      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-brand">Focus</p>
                      <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/80 sm:text-[11px]">
                        Modeling, evaluation, and honest uncertainty.
                      </p>
                    </div>
                    <div className="border border-white/15 bg-white/[0.03] p-4 sm:p-5">
                      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-brand">Based</p>
                      <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/80 sm:text-[11px]">
                        Pittsburgh — on campus &amp; remote-friendly collabs.
                      </p>
                    </div>
                  </div>
                </div>
                <div style={aboutStaggerStyle(6, aboutRevealProgress, reducedMotion, 24)}>
                  <div className="h-px w-full bg-gradient-to-r from-brand/50 via-brand/20 to-transparent" aria-hidden />
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                    Scroll for work &amp; connect — or jump from the contents rail.
                  </p>
                </div>
              </aside>
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute bottom-6 right-5 flex flex-col items-end gap-2 text-right font-display font-bold leading-none text-brand sm:bottom-8 sm:right-10"
              style={aboutStaggerStyle(7, aboutRevealProgress, reducedMotion, 32)}
            >
              <span className="block text-[clamp(3.5rem,12vw,7.5rem)] tracking-tight">02</span>
              <span className="block font-mono text-[clamp(11px,2.4vw,14px)] uppercase tracking-[0.28em] text-brand/90">
                About
              </span>
            </div>
          </div>
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
        <div aria-hidden className="pointer-events-none min-h-[min(32vh,360px)] w-full" />
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
        /* Hero name uses gradient + background-clip:text — ancestor transform hides it in WebKit */
        .landing-motion .landing-name {
          transform: none;
        }
        .landing-motion[data-intro-step="2"] .landing-el {
          animation: landing-rise 0.62s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-fill-mode: both;
        }
        .landing-motion[data-intro-step="2"] .landing-meta {
          animation-delay: calc(var(--text-after-lines) + 0s);
        }
        .landing-motion[data-intro-step="2"] .landing-name {
          animation: landing-name-rise 0.62s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: calc(var(--text-after-lines) + 0.06s);
          animation-fill-mode: both;
        }
        .landing-motion[data-intro-step="2"] .landing-index {
          animation-delay: calc(var(--text-after-lines) + 0.12s);
        }
        .landing-motion[data-intro-step="2"] .landing-copy {
          animation-delay: calc(var(--text-after-lines) + 0.18s);
        }
        .landing-motion[data-intro-step="2"] .landing-corner-index {
          animation-delay: calc(var(--text-after-lines) + 0.18s);
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
        @keyframes landing-name-rise {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
