import {
  useCallback,
  useEffect,
  useLayoutEffect,
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
import { SectionIndexCorner, sectionIndexCornerAbsoluteWrap } from "../components/SectionIndexCorner";
import { scrollWindowToY } from "../lenisBridge";
import { WorkProjectsExperience, workSectionMinHeightVh } from "../components/WorkProjectsExperience";
import { WORK_PROJECTS } from "../data/workProjects";

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
/** Name panel → letter stagger → then rest of hero (meta, TOC, copy, …). */
/** Gradient panel: inset() reveal from TL toward BR (single smooth tween). */
const NAME_PANEL_IN_S = 0.82;
const NAME_LETTER_STAGGER_S = 0.06;
const NAME_LETTER_IN_S = 1.22;
/**
 * Intro choreography (overlapping, one continuous gesture):
 * lines → panel → letters start mid-panel → hero rail starts mid–letters.
 */
/** Letters begin when this fraction of the panel tween remains (0.5 ≈ halfway through box). */
const INTRO_BOX_LETTER_BLEND = 0.5;
/** First meta/TOC motion this long after the first letter starts (rail overlaps letter tail). */
const INTRO_LETTER_REST_GAP_S = 0.18;
/** Small offsets so rail items read as one unit (seconds, after --rest-intro-delay). */
const REST_RAIL_INDEX_S = 0.055;
const REST_RAIL_COPY_S = 0.1;
const REST_RAIL_CORNER_S = 0.1;
const REST_RAIL_SCROLL_S = 0.17;

const NAME_LETTER_BLOCK_START_S =
  TEXT_AFTER_LINES_S + NAME_PANEL_IN_S * (1 - INTRO_BOX_LETTER_BLEND);
const REST_INTRO_DELAY_S = NAME_LETTER_BLOCK_START_S + INTRO_LETTER_REST_GAP_S;
/** Vertical line intro ends at this delay (stagger + duration); small buffer so we don’t cut the animation. */
const VERTICAL_LINE_INTRO_MS = (LINE_STAGGER_S + LINE_DURATION_MS / 1000) * 1000 + 50;
/** After scroll cue dismisses, shorten over this much additional scroll (viewport heights). */
const LINE_SCROLL_SPAN_VH = 0.88;
/** Line never shorter than this (0 = fully gone; ~0.28 = subtle stub). */
const LINE_SCALE_MIN = 0.28;
/** Per-frame lerp toward target (higher = snappier). */
const LINE_SMOOTH_ALPHA = 0.09;

/**
 * Scroll-scrubbed animations (e.g. About) hit full progress in this fraction of the
 * section’s scroll span; the rest is “cushion” before the next section enters view.
 */
/** Fraction of sticky scroll range over which section reveal 0→1 runs (larger = longer transition distance). */
const SECTION_SCROLL_ANIM_COMPLETE = 1.92;
/**
 * Work horizontal rail: must be ≤1 so `workRevealProgress` can reach 1 inside the section’s scroll span.
 * Using the global 1.92 here caps progress around ~0.52 — sticky unpins while you’re still mid-rail (e.g. Neutrino),
 * then the page scrolls to Connect; scrolling back rewinds the carousel.
 */
const WORK_SECTION_SCROLL_COMPLETE = 1;

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

/** Document Y for an element’s top (avoids wrong `offsetTop` inside nested layout + Lenis). */
function getElementDocumentTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top + window.scrollY;
}

/** Same px threshold as the scroll-cue dismiss effect — line stays full until then. */
function scrollCueDismissScrollY(vh: number): number {
  return Math.min(200, vh * 0.22);
}

function computeVerticalLineTarget(scrollY: number, vh: number): number {
  const startY = scrollCueDismissScrollY(vh);
  if (scrollY <= startY) {
    return 1;
  }
  const spanPx = vh * LINE_SCROLL_SPAN_VH;
  const raw = 1 - (scrollY - startY) / spanPx;
  return Math.max(LINE_SCALE_MIN, clamp01(raw));
}

/** Sticky scrub: item animates in (fade + slide up); one after another. */
const ABOUT_STAGGER_STEPS = 8;
const CONNECT_STAGGER_STEPS = 8;
/** Progress between one item starting and the next (smaller = closer together). */
const STAGGER_START_INTERVAL = 0.065;
/** Each item’s in-animation spans this much progress (unchanged = not quicker). */
const STAGGER_ANIM_SPAN = 0.28;
/** Quartic ease-out: super smooth, cushioned deceleration into the stop. */
function easeOutQuart(t: number): number {
  return 1 - (1 - t) * (1 - t) * (1 - t) * (1 - t);
}

function sectionStaggerStyle(
  totalSteps: number,
  index: number,
  progress: number,
  reducedMotion: boolean,
  slidePx = 28,
): CSSProperties | undefined {
  if (reducedMotion) {
    return undefined;
  }
  const tLinear = clamp01((progress - index * STAGGER_START_INTERVAL) / STAGGER_ANIM_SPAN);
  const tMove = easeOutQuart(tLinear);
  /** Opacity lags motion so the fade stays readable over more scroll. */
  const tFade = Math.pow(tMove, 1.48);
  return {
    opacity: tFade,
    transform: `translateY(${(1 - tMove) * slidePx}px)`,
  };
}

export default function Home() {
  const heroRef = useRef<HTMLElement | null>(null);
  const aboutRef = useRef<HTMLElement | null>(null);
  const workRef = useRef<HTMLElement | null>(null);
  const connectRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  /** Name split 0→2 so Zhu/Adam keep moving past first viewport. */
  const [heroNameProgress, setHeroNameProgress] = useState(0);
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
  const [workRevealProgress, setWorkRevealProgress] = useState(() =>
    getInitialReducedMotion() ? 1 : 0,
  );
  const [connectRevealProgress, setConnectRevealProgress] = useState(() =>
    getInitialReducedMotion() ? 1 : 0,
  );
  /** Only apply scroll-driven shorten after the vertical line’s intro animation has finished. */
  const [verticalLineIntroDone, setVerticalLineIntroDone] = useState(false);
  const verticalLineInnerRef = useRef<HTMLDivElement | null>(null);
  const lineSmoothRef = useRef(1);
  const lineTargetRef = useRef(1);
  /** 0 = idle; non-zero = rAF loop is running (don’t cancel on every scroll). */
  const lineAnimRafRef = useRef(0);
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
  /** Same frame as vertical-line shorten — avoids cue vs line desync from async React state. */
  const [scrollPastCueDismiss, setScrollPastCueDismiss] = useState(false);
  const scrollPastCueDismissRef = useRef(false);

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
  /** Bridge fade on shell only so CSS can run the panel intro on the inner layer. */
  const nameBackingShellStyle: CSSProperties = useMemo(() => {
    if (reducedMotion) {
      return { opacity: 1 };
    }
    return { opacity: 1 - sectionBridge * 0.94 };
  }, [reducedMotion, sectionBridge]);

  const nameBackingStyle: CSSProperties = useMemo(() => {
    if (reducedMotion) {
      return { transform: "translate3d(0, 0, 0)", borderRadius: "0.25rem" };
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
      willChange: "transform",
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

      const sectionEl =
        id === "home"
          ? heroRef.current ?? el
          : id === "about"
            ? aboutRef.current ?? el
            : id === "work"
              ? workRef.current ?? el
              : id === "connect"
                ? connectRef.current ?? el
                : el;

      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const targetY = Math.max(0, Math.min(maxY, Math.round(getElementDocumentTop(sectionEl))));

      /** Jump to the section’s start so Contents matches what you see; reveal progress follows scroll. */
      const run = () => scrollWindowToY(targetY, { immediate: true });
      run();
      window.requestAnimationFrame(run);
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
      const dismissThreshold = scrollCueDismissScrollY(vh);

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
      setVerticalLineIntroDone(true);
      return;
    }
    if (introStep < 2) {
      return;
    }
    const t = window.setTimeout(() => setVerticalLineIntroDone(true), VERTICAL_LINE_INTRO_MS);
    return () => window.clearTimeout(t);
  }, [introStep, reducedMotion]);

  const applyVerticalLineTransform = useCallback((scale: number) => {
    const el = verticalLineInnerRef.current;
    if (!el) {
      return;
    }
    el.style.setProperty("transform-origin", "top");
    el.style.setProperty("transform", `scaleY(${scale})`);
  }, []);

  /** Hand off from CSS keyframes to JS so our transform can apply. */
  useLayoutEffect(() => {
    if (reducedMotion || !verticalLineIntroDone) {
      return;
    }
    lineSmoothRef.current = 1;
    lineTargetRef.current = computeVerticalLineTarget(window.scrollY, window.innerHeight);
    applyVerticalLineTransform(1);
  }, [verticalLineIntroDone, reducedMotion, applyVerticalLineTransform]);

  /** One continuous rAF loop — no stop/start on scroll, so no back‑and‑forth glitch. */
  useEffect(() => {
    if (reducedMotion || !verticalLineIntroDone) {
      if (lineAnimRafRef.current !== 0) {
        cancelAnimationFrame(lineAnimRafRef.current);
        lineAnimRafRef.current = 0;
      }
      return;
    }
    const vh = window.innerHeight;
    lineSmoothRef.current = 1;
    lineTargetRef.current = computeVerticalLineTarget(window.scrollY, vh);
    applyVerticalLineTransform(1);

    const tick = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const past =
        activeSection === "home" && y > scrollCueDismissScrollY(vh);
      if (past !== scrollPastCueDismissRef.current) {
        scrollPastCueDismissRef.current = past;
        setScrollPastCueDismiss(past);
      }

      const t = computeVerticalLineTarget(y, vh);
      lineTargetRef.current = t;
      const s = lineSmoothRef.current;
      const next = s + (t - s) * LINE_SMOOTH_ALPHA;
      lineSmoothRef.current = next;
      applyVerticalLineTransform(next);
      lineAnimRafRef.current = requestAnimationFrame(tick);
    };
    lineAnimRafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(lineAnimRafRef.current);
      lineAnimRafRef.current = 0;
    };
  }, [verticalLineIntroDone, reducedMotion, applyVerticalLineTransform, activeSection]);

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
        setHeroNameProgress(reducedMotion ? 0 : Math.min(2, Math.max(0, raw)));
      }

      const scrollY = window.scrollY;

      const aboutEl = aboutRef.current ?? document.getElementById("about");
      if (!aboutEl) {
        setSectionBridge(0);
        setAboutRevealProgress(0);
      } else {
        const aboutTop = aboutEl.offsetTop;
        const aboutH = aboutEl.offsetHeight;

        if (reducedMotion) {
          const marker = scrollY + vh * 0.38;
          setSectionBridge(marker >= aboutTop ? 1 : 0);
          setAboutRevealProgress(1);
        } else {
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
        }
      }

      const applyStickyReveal = (
        sectionEl: HTMLElement | null,
        setReveal: (n: number) => void,
        scrollCompleteK: number = SECTION_SCROLL_ANIM_COMPLETE,
      ) => {
        if (!sectionEl) {
          setReveal(0);
          return;
        }
        if (reducedMotion) {
          setReveal(1);
          return;
        }
        const top = sectionEl.offsetTop;
        const h = sectionEl.offsetHeight;
        const stickyScrollRange = Math.max(h - vh, 1);
        const revealRaw =
          (scrollY - top) / Math.max(stickyScrollRange * scrollCompleteK, 1);
        setReveal(clamp01(revealRaw));
      };

      applyStickyReveal(
        workRef.current ?? document.getElementById("work"),
        setWorkRevealProgress,
        WORK_SECTION_SCROLL_COMPLETE,
      );
      applyStickyReveal(
        connectRef.current ?? document.getElementById("connect"),
        setConnectRevealProgress,
      );
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
        const top = getElementDocumentTop(el);
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

  /** Name split: 0→1 eases like before; 1→2 continues so Zhu/Adam keep moving. */
  const maxSplitPx = Math.min(viewportW * 0.12, 140);
  const splitPx =
    reducedMotion
      ? 0
      : heroNameProgress <= 1
        ? Math.pow(heroNameProgress, HERO_NAME_SCROLL_EASE) * maxSplitPx
        : maxSplitPx + (heroNameProgress - 1) * 72;

  /** Inline bridge parallax only after intro lines + text are allowed (avoids fighting landing-rise). */
  const bridgeOn = introStep >= 2 && sectionBridge > 0;

  /** Background layers follow overall scroll progress per sticky section. */
  const aboutDecorOpacity = reducedMotion ? 1 : aboutRevealProgress;
  const workDecorOpacity = reducedMotion ? 1 : workRevealProgress;
  const connectDecorOpacity = reducedMotion ? 1 : connectRevealProgress;

  const onIntroOverlayEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "opacity") {
      return;
    }
    setIntroStep((s) => (s === 1 ? 2 : s));
  };

  const motionClass = reducedMotion ? "landing-no-motion" : "landing-motion";
  const linkClass =
    "group inline-flex items-center gap-2 border border-white/25 bg-black/55 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/95 transition-colors hover:border-white/55 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  const tocLinkClass = (id: string) =>
    `group block w-full text-left font-mono text-[10px] uppercase tracking-[0.22em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
      activeSection === id ? "text-white" : "text-white/45 hover:text-white"
    }`;

  /** Index span must match label hover. */
  const tocIndexClass = (id: string) =>
    activeSection === id ? "text-white" : "text-white/45 group-hover:text-white";

  const showOverlay = introStep < 2 && !reducedMotion;

  return (
    <div
      className={`min-h-dvh bg-black text-white [&_a]:cursor-none [&_a:hover]:text-white ${motionClass}`}
      data-intro-step={introStep}
      style={
        {
          "--line-ease": LINE_EASE,
          "--line-dur": `${LINE_DURATION_MS}ms`,
          "--line-stagger": `${LINE_STAGGER_S}s`,
          "--text-after-lines": `${TEXT_AFTER_LINES_S}s`,
          "--name-panel-dur": `${NAME_PANEL_IN_S}s`,
          "--name-letter-stagger": `${NAME_LETTER_STAGGER_S}s`,
          "--name-letter-dur": `${NAME_LETTER_IN_S}s`,
          "--letter-block-start": `${NAME_LETTER_BLOCK_START_S}s`,
          "--rest-intro-delay": `${REST_INTRO_DELAY_S}s`,
          "--rest-rail-index": `${REST_RAIL_INDEX_S}s`,
          "--rest-rail-copy": `${REST_RAIL_COPY_S}s`,
          "--rest-rail-corner": `${REST_RAIL_CORNER_S}s`,
          "--rest-rail-scroll": `${REST_RAIL_SCROLL_S}s`,
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
            <div className="landing-el landing-meta flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 sm:text-[11px]">
              <a
                href="#home"
                className="inline-flex items-center gap-2.5 normal-case text-white/50 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("home");
                }}
              >
                <img
                  src={`${import.meta.env.BASE_URL}favicon.svg`}
                  alt=""
                  width={36}
                  height={36}
                  className="h-8 w-8 shrink-0 rounded-[10px] sm:h-9 sm:w-9"
                  decoding="async"
                />
                <span className="font-sans text-[12px] font-medium tracking-[0.08em] text-inherit sm:text-[13px]">
                  Adam Zhu
                </span>
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
              <div className="intro-line-inner intro-line-inner-h h-px w-full origin-left bg-white" />
            </div>
          </div>

          {/* Tighter pt under top rule; extra pb so corner index (Bebas) isn’t clipped at viewport bottom */}
          <div className="flex min-h-0 flex-1 flex-col justify-center px-5 pb-24 sm:px-10 sm:pb-28 lg:pb-32">
            <div className="mx-auto w-full max-w-[1600px] pb-12 pt-4 sm:pb-14 sm:pt-5 lg:pb-16">
              <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(4.5rem,auto)_minmax(0,1fr)] lg:gap-x-10 xl:gap-x-16">
                <div className="landing-name flex min-w-0 flex-col justify-center lg:min-h-0">
                  <div className="mx-auto w-fit max-w-full" style={nameGroupScaleStyle}>
                    <div className="relative isolate inline-block w-fit max-w-full select-none font-display text-[clamp(5.25rem,24vw,17.5rem)] font-bold uppercase leading-[0.76] tracking-[0.02em]">
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -left-[0.55rem] -right-[0.55rem] -top-[1.55rem] -bottom-[1.55rem] z-0 sm:-left-[0.72rem] sm:-right-[0.72rem] sm:-top-[1.8rem] sm:-bottom-[1.8rem]"
                        style={nameBackingShellStyle}
                      >
                        <div
                          className="landing-name-backing bg-az-name-panel absolute inset-0 ring-1 ring-inset ring-[rgba(81,43,135,0.38)] ring-offset-0"
                          style={nameBackingStyle}
                        />
                      </div>
                      <div className="landing-name-fill relative z-10 w-fit min-w-0">
                        <div
                          className="block w-max"
                          style={{
                            transform: reducedMotion ? undefined : `translateY(${-splitPx}px)`,
                          }}
                        >
                          {"Adam".split("").map((ch, i) => (
                            <span
                              key={`adam-${i}`}
                              className="landing-name-letter inline-block"
                              style={{ "--name-letter-i": i } as CSSProperties}
                            >
                              <HoverLetter char={ch} reducedMotion={reducedMotion} />
                            </span>
                          ))}
                        </div>
                        <div
                          className="mt-[0.02em] block w-max pl-[clamp(3.25rem,19vw,14rem)]"
                          style={{
                            transform: reducedMotion ? undefined : `translateX(${splitPx}px)`,
                          }}
                        >
                          {"Zhu".split("").map((ch, i) => (
                            <span
                              key={`zhu-${i}`}
                              className="landing-name-letter inline-block"
                              style={{ "--name-letter-i": i + 4 } as CSSProperties}
                            >
                              <HoverLetter char={ch} reducedMotion={reducedMotion} />
                            </span>
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
                        ? { transform: `translateY(${sectionBridge * -10}px)` }
                        : undefined
                  }
                >
                  <div
                    className="intro-line intro-line-v pointer-events-none relative flex min-h-0 w-full flex-1 flex-col items-center overflow-hidden"
                    aria-hidden
                  >
                    <div
                      ref={verticalLineInnerRef}
                      className={`intro-line-inner intro-line-inner-v min-h-[min(44vh,28rem)] w-px min-w-px flex-1 origin-top bg-white${
                        verticalLineIntroDone && !reducedMotion ? " intro-line-v-driven" : ""
                      }`}
                    />
                  </div>
                  {/* Fixed slot so hiding the cue doesn’t collapse flex / jump the line */}
                  <div
                    className="landing-el landing-scroll-cue-under mt-auto flex min-h-[5.25rem] shrink-0 flex-col items-center justify-end gap-0 pt-5 pb-2 sm:min-h-[5.75rem] sm:pt-6 sm:pb-3"
                    aria-hidden={
                      !(showScrollCue && activeSection === "home" && !scrollPastCueDismiss)
                    }
                  >
                    <div
                      className={`flex flex-col items-center gap-0 transition-opacity duration-300 ease-out ${
                        showScrollCue && activeSection === "home" && !scrollPastCueDismiss
                          ? "opacity-100"
                          : "pointer-events-none opacity-0"
                      }`}
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">Scroll</span>
                      <span className="scroll-cue-arrow inline-flex text-white/50">
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
                  </div>
                </div>

                <div className="landing-rail flex min-h-[min(52vh,520px)] flex-col gap-12 overflow-visible pt-6 lg:min-h-0 lg:flex-1 lg:self-stretch lg:pt-8">
                  <div className="landing-el landing-index flex">
                    <nav
                      className="bg-az-toc-panel flex w-full flex-col gap-4 border border-white/18 p-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                      aria-label="On this page"
                    >
                      <span className="text-white/50">Contents</span>
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
                      <div className="intro-line-inner intro-line-inner-h h-px w-full origin-left bg-white" />
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
                      <p className="font-mono text-[12px] uppercase leading-relaxed tracking-[0.14em] text-white/55 sm:text-[13px]">
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
                    className="landing-el landing-corner-index relative z-10 mt-auto w-full self-end overflow-visible pb-3 pt-4 lg:pb-4 lg:pt-6"
                  >
                    <SectionIndexCorner index="01" label="Home" className="pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Mobile cue: same reserved height so layout doesn’t jump when it fades */}
              <div
                className="landing-el landing-scroll-cue-under mt-40 flex min-h-[3.5rem] flex-col items-center justify-center gap-0 lg:hidden"
                aria-hidden={
                  !(showScrollCue && activeSection === "home" && !scrollPastCueDismiss)
                }
              >
                <div
                  className={`flex flex-col items-center gap-0 transition-opacity duration-300 ease-out ${
                    showScrollCue && activeSection === "home" && !scrollPastCueDismiss
                      ? "opacity-100"
                      : "pointer-events-none opacity-0"
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">Scroll</span>
                  <span className="scroll-cue-arrow inline-flex text-white/50">
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
              </div>
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
        className="relative scroll-mt-0 bg-black min-h-[260vh]"
        aria-labelledby="about-heading"
      >
        <div className="sticky top-0 z-10 relative min-h-dvh w-full overflow-x-clip overflow-y-visible bg-black">
          <div
            aria-hidden
            className="bg-az-atmos-about pointer-events-none absolute inset-0"
            style={{ opacity: aboutDecorOpacity }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.11)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.11)_1px,transparent_1px)] [background-size:min(3.5rem,10vw)_min(3.5rem,10vw)]"
            style={{ opacity: 0.055 * aboutDecorOpacity }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
            style={{ opacity: aboutDecorOpacity }}
          />

          <div className="relative z-10 mx-auto flex min-h-dvh max-w-[1600px] flex-col justify-center px-5 pb-20 pt-28 sm:px-10 sm:pb-28 sm:pt-32">
            <div className="grid gap-14 lg:grid-cols-12 lg:gap-10 lg:gap-y-16">
              <div className="flex flex-col gap-0 lg:col-span-7">
                <div style={sectionStaggerStyle(ABOUT_STAGGER_STEPS,0, aboutRevealProgress, reducedMotion)}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50 sm:text-[11px]">
                    02 · About
                  </p>
                </div>
                <div className="mt-5 sm:mt-6" style={sectionStaggerStyle(ABOUT_STAGGER_STEPS,1, aboutRevealProgress, reducedMotion)}>
                  <h2
                    id="about-heading"
                    className="font-display text-[clamp(2.5rem,7.5vw,4.75rem)] font-bold uppercase leading-[0.92] tracking-[0.02em] text-white"
                  >
                    Curiosity
                    <span className="block text-white">driven by data</span>
                  </h2>
                </div>
                <div className="mt-10" style={sectionStaggerStyle(ABOUT_STAGGER_STEPS,2, aboutRevealProgress, reducedMotion)}>
                  <p className="max-w-xl font-mono text-sm uppercase leading-relaxed tracking-[0.14em] text-white/85 sm:text-[15px]">
                    I&apos;m a statistics &amp; machine learning student at{" "}
                    <span className="text-white">Carnegie Mellon</span> — interested in rigorous methods,
                    clear communication, and tools that actually help people decide under uncertainty.
                  </p>
                </div>
                <div className="mt-6" style={sectionStaggerStyle(ABOUT_STAGGER_STEPS,3, aboutRevealProgress, reducedMotion)}>
                  <p className="max-w-xl font-mono text-[12px] uppercase leading-relaxed tracking-[0.12em] text-white/50 sm:text-[13px]">
                    This space is yours to shape: research threads, coursework highlights, side projects,
                    and what you want to explore next.
                  </p>
                </div>
              </div>

              <aside className="flex flex-col gap-4 lg:col-span-5 lg:justify-center">
                <div
                  className="bg-az-card border border-white/18 p-6 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                  style={sectionStaggerStyle(ABOUT_STAGGER_STEPS,4, aboutRevealProgress, reducedMotion)}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/55">Now</p>
                  <p className="mt-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-white/90 sm:text-[12px]">
                    CMU · Statistics &amp; ML — coursework, research, and experiments in inference &
                    learning.
                  </p>
                </div>
                <div style={sectionStaggerStyle(ABOUT_STAGGER_STEPS,5, aboutRevealProgress, reducedMotion, 28)}>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-az-card-muted border border-white/14 p-4 sm:p-5">
                      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/55">Focus</p>
                      <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/80 sm:text-[11px]">
                        Modeling, evaluation, and honest uncertainty.
                      </p>
                    </div>
                    <div className="bg-az-card-muted border border-white/14 p-4 sm:p-5">
                      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/55">Based</p>
                      <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/80 sm:text-[11px]">
                        Pittsburgh — on campus &amp; remote-friendly collabs.
                      </p>
                    </div>
                  </div>
                </div>
                <div style={sectionStaggerStyle(ABOUT_STAGGER_STEPS,6, aboutRevealProgress, reducedMotion, 24)}>
                  <div className="h-px w-full bg-gradient-to-r from-white/40 via-white/10 to-transparent" aria-hidden />
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                    Scroll for work &amp; connect — or jump from the contents rail.
                  </p>
                </div>
              </aside>
            </div>

            <div
              aria-hidden
              className={`${sectionIndexCornerAbsoluteWrap} bottom-10 sm:bottom-12`}
              style={sectionStaggerStyle(ABOUT_STAGGER_STEPS, 7, aboutRevealProgress, reducedMotion, 32)}
            >
              <SectionIndexCorner index="02" label="About" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Work: tall track + sticky — horizontal project rail, then handoff to Connect ─── */}
      <section
        id="work"
        ref={workRef}
        className="relative scroll-mt-0 bg-black"
        style={{ minHeight: `${workSectionMinHeightVh(WORK_PROJECTS.length)}vh` }}
        aria-labelledby="work-heading"
      >
        <div className="sticky top-0 z-10 relative min-h-dvh w-full overflow-x-clip overflow-y-visible bg-black">
          <div
            aria-hidden
            className="bg-az-atmos-work pointer-events-none absolute inset-0"
            style={{ opacity: workDecorOpacity }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.11)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.11)_1px,transparent_1px)] [background-size:min(3.5rem,10vw)_min(3.5rem,10vw)]"
            style={{ opacity: 0.055 * workDecorOpacity }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-white/32 to-transparent"
            style={{ opacity: workDecorOpacity }}
          />

          <WorkProjectsExperience
            workRevealProgress={workRevealProgress}
            reducedMotion={reducedMotion}
            viewportW={viewportW}
          />
        </div>
      </section>

      {/* ─── Connect: tall track + sticky panel (scrub reveal) ─── */}
      <section
        id="connect"
        ref={connectRef}
        className="relative scroll-mt-0 bg-black min-h-[260vh]"
        aria-labelledby="connect-heading"
      >
        <div className="sticky top-0 z-10 relative min-h-dvh w-full overflow-x-clip overflow-y-visible bg-black">
          <div
            aria-hidden
            className="bg-az-atmos-connect pointer-events-none absolute inset-0"
            style={{ opacity: connectDecorOpacity }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.11)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.11)_1px,transparent_1px)] [background-size:min(3.5rem,10vw)_min(3.5rem,10vw)]"
            style={{ opacity: 0.055 * connectDecorOpacity }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
            style={{ opacity: connectDecorOpacity }}
          />

          <div className="relative z-10 mx-auto flex min-h-dvh max-w-[1600px] flex-col justify-center px-5 pb-28 pt-28 sm:px-10 sm:pb-32 sm:pt-32">
            <div className="grid gap-14 lg:grid-cols-12 lg:gap-10 lg:gap-y-16">
              <div className="flex flex-col gap-0 lg:col-span-7">
                <div style={sectionStaggerStyle(CONNECT_STAGGER_STEPS, 0, connectRevealProgress, reducedMotion)}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50 sm:text-[11px]">
                    04 · Connect
                  </p>
                </div>
                <div className="mt-5 sm:mt-6" style={sectionStaggerStyle(CONNECT_STAGGER_STEPS, 1, connectRevealProgress, reducedMotion)}>
                  <h2
                    id="connect-heading"
                    className="font-display text-[clamp(2.5rem,7.5vw,4.75rem)] font-bold uppercase leading-[0.92] tracking-[0.02em] text-white"
                  >
                    Let&apos;s
                    <span className="block text-white">talk</span>
                  </h2>
                </div>
                <div className="mt-10" style={sectionStaggerStyle(CONNECT_STAGGER_STEPS, 2, connectRevealProgress, reducedMotion)}>
                  <p className="max-w-xl font-mono text-sm uppercase leading-relaxed tracking-[0.14em] text-white/85 sm:text-[15px]">
                    Reach out for collaborations, research questions, coursework, or opportunities. I read
                    everything — concise subject lines and a clear ask get a faster reply.
                  </p>
                </div>
                <div
                  className="mt-10 flex flex-wrap gap-4"
                  style={sectionStaggerStyle(CONNECT_STAGGER_STEPS, 3, connectRevealProgress, reducedMotion, 26)}
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
                    {EMAIL}
                  </a>
                </div>
              </div>

              <aside className="flex flex-col gap-4 lg:col-span-5 lg:justify-center">
                <div
                  className="bg-az-card border border-white/18 p-6 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                  style={sectionStaggerStyle(CONNECT_STAGGER_STEPS, 4, connectRevealProgress, reducedMotion)}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/55">Open to</p>
                  <p className="mt-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-white/90 sm:text-[12px]">
                    Research chats, stats/ML tooling feedback, and thoughtful internships — especially where
                    rigor and communication both matter.
                  </p>
                </div>
                <div style={sectionStaggerStyle(CONNECT_STAGGER_STEPS, 5, connectRevealProgress, reducedMotion, 28)}>
                  <div className="bg-az-card-muted border border-white/14 p-5 sm:p-6">
                    <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/55">Based</p>
                    <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/80 sm:text-[11px]">
                      Pittsburgh &amp; CMU — hybrid-friendly; time zone US Eastern.
                    </p>
                  </div>
                </div>
                <div style={sectionStaggerStyle(CONNECT_STAGGER_STEPS, 6, connectRevealProgress, reducedMotion, 24)}>
                  <div className="h-px w-full bg-gradient-to-r from-white/40 via-white/10 to-transparent" aria-hidden />
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                    Prefer email for longer threads — links above for code &amp; professional context.
                  </p>
                </div>
              </aside>
            </div>

            <div aria-hidden className={`${sectionIndexCornerAbsoluteWrap} bottom-10 z-20 sm:bottom-12`}>
              <SectionIndexCorner index="04" label="Connect" />
            </div>
          </div>
        </div>
      </section>

      <style>{`
        /* Lenis drives smooth wheel scroll; CSS smooth + Lenis fights and feels mushy. */
        html {
          scroll-behavior: auto;
        }

        .landing-motion .intro-line-inner-h {
          transform: scaleX(0);
        }
        .landing-motion .intro-line-inner-v:not(.intro-line-v-driven) {
          transform: scaleY(0);
        }
        .landing-motion[data-intro-step="2"] .intro-line-top .intro-line-inner {
          animation: landing-line-x var(--line-dur) var(--line-ease) forwards;
          animation-delay: 0s;
        }
        .landing-motion[data-intro-step="2"] .intro-line-v .intro-line-inner:not(.intro-line-v-driven) {
          animation: landing-line-y var(--line-dur) var(--line-ease) forwards;
          animation-delay: var(--line-stagger);
        }
        .landing-motion[data-intro-step="2"] .intro-line-mid .intro-line-inner {
          animation: landing-line-x var(--line-dur) var(--line-ease) forwards;
          animation-delay: calc(var(--line-stagger) * 2);
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
        /* Hero name column: no transform (WebKit + background-clip:text breaks under ancestor transforms). */
        .landing-name {
          -webkit-font-smoothing: auto;
          -moz-osx-font-smoothing: auto;
        }
        .landing-motion .landing-name {
          transform: none;
        }
        /**
         * Pure white glyphs; transparency is on the layer (opacity) so color stays #fff, not gray rgba().
         * Slight opacity lets the gradient panel show through underneath.
         */
        .landing-name-fill {
          color: #fff;
          -webkit-text-fill-color: #fff;
          opacity: 0.92;
          text-shadow:
            0 0.02em 0.07em rgba(0, 0, 0, 0.28),
            0 0.01em 0.03em rgba(0, 0, 0, 0.2);
        }
        .landing-motion .landing-name-backing {
          opacity: 1;
          /* inset() interpolates smoothly (polygon() multi-stop reads stepped in many browsers). */
          clip-path: inset(0 100% 100% 0);
        }
        .landing-motion[data-intro-step="2"] .landing-name-backing {
          animation: landing-name-panel-in var(--name-panel-dur) cubic-bezier(0.33, 0, 0.18, 1) forwards;
          animation-delay: var(--text-after-lines);
        }
        .landing-motion .landing-name-letter {
          opacity: 0;
        }
        .landing-motion[data-intro-step="2"] .landing-name-letter {
          animation: landing-letter-in var(--name-letter-dur) cubic-bezier(0.28, 0.65, 0.18, 1) forwards;
          animation-delay: calc(
            var(--letter-block-start) + var(--name-letter-i) * var(--name-letter-stagger)
          );
        }
        .landing-motion[data-intro-step="2"] .landing-el {
          animation: landing-rise 0.58s cubic-bezier(0.26, 0.9, 0.2, 1) forwards;
          animation-fill-mode: both;
        }
        .landing-motion[data-intro-step="2"] .landing-meta {
          animation-delay: calc(var(--rest-intro-delay) + 0s);
        }
        .landing-motion[data-intro-step="2"] .landing-index {
          animation-delay: calc(var(--rest-intro-delay) + var(--rest-rail-index));
        }
        .landing-motion[data-intro-step="2"] .landing-copy {
          animation-delay: calc(var(--rest-intro-delay) + var(--rest-rail-copy));
        }
        .landing-motion[data-intro-step="2"] .landing-corner-index {
          animation-delay: calc(var(--rest-intro-delay) + var(--rest-rail-corner));
        }
        .landing-motion[data-intro-step="2"] .landing-scroll-cue-under {
          animation-delay: calc(var(--rest-intro-delay) + var(--rest-rail-scroll));
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
        .landing-no-motion .landing-name-backing {
          opacity: 1 !important;
          clip-path: none !important;
          animation: none !important;
        }
        .landing-no-motion .landing-name-letter {
          opacity: 1 !important;
          animation: none !important;
          transform: none !important;
        }
        .landing-no-motion .landing-name-fill {
          opacity: 1 !important;
        }

        /* Single continuous reveal: shrink right/bottom insets from TL toward BR (smooth, not stepped). */
        @keyframes landing-name-panel-in {
          from {
            clip-path: inset(0 100% 100% 0);
          }
          to {
            clip-path: inset(0 0 0 0);
          }
        }
        /* One curve for opacity + Y — easing does the gradual fade/rise (no mid keyframe “stairs”). */
        @keyframes landing-letter-in {
          from {
            opacity: 0;
            transform: translate3d(0, 0.46em, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
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
