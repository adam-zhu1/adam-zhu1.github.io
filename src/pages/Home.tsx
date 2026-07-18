import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type TransitionEvent,
} from "react";
import { CustomCursor } from "../components/CustomCursor";
import { WorkGraph } from "../components/WorkGraph";
import { ScrollDebugOverlay } from "../components/ScrollDebugOverlay";
import { SectionIndexCorner, sectionIndexCornerAbsoluteWrap } from "../components/SectionIndexCorner";
import { NavWipe } from "../components/NavWipe";
import { TrajectoryChart } from "../components/TrajectoryChart";
import { WORK_PROJECTS } from "../data/workProjects";
import { SECTIONS, type SectionId } from "../data/sections";

const GITHUB_URL = "https://github.com/adam-zhu1";
const LINKEDIN_URL = "https://www.linkedin.com/in/adam-zhu-cmu/";
const EMAIL = "adamzhu@andrew.cmu.edu";
const EMAIL_MAILTO = `mailto:${EMAIL}`;
/**
 * Resume PDF in public/ — copied from the master at
 * ~/Internships/2027 Internships/00 MASTER RESUME/resume.pdf.
 * Bump ?v= whenever the PDF changes so cached copies refresh.
 */
const RESUME_URL = `${import.meta.env.BASE_URL}Adam-Zhu-Resume.pdf?v=20260716`;

/** Short labels for the project panels (used in the intro list + progress dots). */
const PROJECT_NAV_LABELS: Record<string, string> = {
  nist: "NIST",
  trueline: "TrueLine",
  csafe: "CSAFE",
  vrac: "VRAC",
  "cor-robotics": "COR Robotics",
  first: "Neutrino",
  publication: "Publication",
};

/**
 * `inert` spread for React 18: `""` sets the attribute, omitting it clears it. (Passing a boolean
 * would render `inert="false"`, which the browser still treats as inert.)
 */
function inertWhen(inactive: boolean): Record<string, unknown> {
  return inactive ? { inert: "" } : {};
}

/** Work panels: an intro panel (index 0) followed by one panel per project. */
const WORK_PANEL_COUNT = WORK_PROJECTS.length + 1;

/**
 * Vertical scroll (dvh) that advances the work rail by one panel. >100 slows the rail so a flick
 * doesn't jump a whole panel. The last panel's marker must stay 100dvh so the rail lands exactly
 * on the final panel at the end of the section.
 */
const WORK_PANEL_SCROLL_DVH = 145;

function clamp01(n: number): number {
  return Math.min(Math.max(n, 0), 1);
}

/* ── Hero intro choreography (time-based, plays once on load) ─────────────────────────── */
const LINE_EASE = "cubic-bezier(0.45, 0, 0.15, 1)";
const LINE_DURATION_MS = 780;
const LINE_STAGGER_S = 0.09;
const TEXT_AFTER_LINES_S = LINE_STAGGER_S * 3 + LINE_DURATION_MS / 1000 + 0.08;
const NAME_PANEL_IN_S = 0.82;
const NAME_LETTER_STAGGER_S = 0.06;
const NAME_LETTER_IN_S = 1.22;
const INTRO_BOX_LETTER_BLEND = 0.5;
const INTRO_LETTER_REST_GAP_S = 0.18;
const REST_RAIL_INDEX_S = 0.055;
const REST_RAIL_COPY_S = 0.1;
const REST_RAIL_CORNER_S = 0.1;
const REST_RAIL_SCROLL_S = 0.17;
const NAME_LETTER_BLOCK_START_S =
  TEXT_AFTER_LINES_S + NAME_PANEL_IN_S * (1 - INTRO_BOX_LETTER_BLEND);
const REST_INTRO_DELAY_S = NAME_LETTER_BLOCK_START_S + INTRO_LETTER_REST_GAP_S;

/** Hero name letters: small random nudge on hover (skipped when reduced motion). */
function HoverLetter({ char, reducedMotion }: { char: string; reducedMotion: boolean }) {
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
        const n = 4;
        setJitter({ x: (Math.random() - 0.5) * 2 * n, y: (Math.random() - 0.5) * 2 * n });
      }}
      onMouseLeave={() => setJitter(null)}
    >
      {char}
    </span>
  );
}

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

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function IconExternal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

const linkPillClass =
  "group/pill inline-flex items-center gap-2 border border-white/25 bg-black/40 px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/85 transition-colors hover:border-white/55 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Project link buttons (GitHub / paper / site …). Renders nothing when there are no links. */
function ProjectLinks({
  links,
  className,
}: {
  links?: { label: string; url: string }[];
  className?: string;
}) {
  if (!links || links.length === 0) {
    return null;
  }
  return (
    <ul className={`flex flex-wrap gap-2.5 p-0 ${className ?? ""}`}>
      {links.map((l) => (
        <li key={l.url} className="list-none">
          <a href={l.url} target="_blank" rel="noreferrer noopener" className={linkPillClass}>
            {l.label}
            <IconExternal className="h-3 w-3 opacity-65 transition-opacity group-hover/pill:opacity-100" />
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Draft skills — edit freely. Grouped for a compact, scannable block in About. */
const SKILL_GROUPS: { label: string; items: string[] }[] = [
  { label: "Languages", items: ["Python", "Swift", "R", "SQL", "C", "Java", "MATLAB", "Bash"] },
  {
    label: "Libraries",
    items: [
      "NumPy",
      "pandas",
      "scikit-learn",
      "PyTorch",
      "OpenCV",
      "Core ML",
      "SwiftUI",
      "AVFoundation",
      "FastAPI",
      "matplotlib",
      "tidyverse",
      "ggplot2",
    ],
  },
  {
    label: "Tools",
    items: ["Git", "Jupyter", "RStudio", "LaTeX", "MongoDB", "REST APIs", "JSON/JSON-LD", "Regex"],
  },
  {
    label: "Methods",
    items: [
      "Statistical inference",
      "Hypothesis testing",
      "Regression",
      "GLMs",
      "ANOVA",
      "Classification",
      "Feature engineering",
      "Model evaluation",
      "Experimental design",
      "Machine learning",
      "Deep learning",
      "Computer vision",
      "Object detection",
      "Data viz",
    ],
  },
];

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

const linkClass =
  "group inline-flex items-center gap-2 border border-white/25 bg-black/55 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/95 transition-colors hover:border-white/55 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Reusable on-enter reveal: fades/slides in once an ancestor has `is-in`. */
function reveal(i: number): { className: string; style: CSSProperties } {
  return { className: "reveal-item", style: { "--ri": i } as CSSProperties };
}

const SECTION_SHELL =
  "snap-start relative flex min-h-dvh w-full items-center overflow-hidden px-5 py-24 sm:px-10 lg:pl-28";

/**
 * Scroll runway (desktop, motion allowed): runway sections are 118dvh tall with their content
 * pinned via sticky, so reaching the next section takes extra scrolling instead of a single
 * flick. Bump 118dvh to slow the pacing further. The inner keeps its natural min-h-dvh height
 * (no fixed h-dvh) so content taller than the viewport isn't compressed. The Work rail already
 * paces itself with one full-viewport snap marker per panel; Contact is last, so no runway.
 */
const SECTION_RUNWAY = "lg:h-[128dvh]";
const SECTION_RUNWAY_INNER = "lg:sticky lg:top-0";
/** SECTION_SHELL minus snap-start, for the pinned inner of a runway section (snap stays on the outer). */
const SECTION_INNER =
  "relative flex min-h-dvh w-full items-center overflow-hidden px-5 py-24 sm:px-10 lg:pl-28";

export default function Home() {
  const [reducedMotion, setReducedMotion] = useState(getInitialReducedMotion);
  const [introStep, setIntroStep] = useState<IntroStep>(getInitialIntroStep);
  const [activeScreen, setActiveScreen] = useState<SectionId>("home");
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set(["home"]));
  const [activePanel, setActivePanel] = useState(0);
  const [viewportW, setViewportW] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1280,
  );

  /** Below lg (1024px): vertical Work cards and no scroll snapping; the desktop rail is untouched. */
  const isMobile = viewportW < 1024;

  const heroRef = useRef<HTMLElement | null>(null);
  const aboutSectionRef = useRef<HTMLElement | null>(null);
  const workSectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const activeScreenRef = useRef<SectionId>("home");
  const activePanelRef = useRef(0);
  const vwRef = useRef(viewportW);

  /* ── Reduced motion ─────────────────────────────────────────── */
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

  /* ── Intro choreography 0 → 1 → 2 ───────────────────────────── */
  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    const id = window.requestAnimationFrame(() => setIntroStep(1));
    return () => window.cancelAnimationFrame(id);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || introStep !== 1) {
      return;
    }
    const t = window.setTimeout(() => setIntroStep((s) => (s === 1 ? 2 : s)), 780);
    return () => window.clearTimeout(t);
  }, [introStep, reducedMotion]);

  /* ── Hide native cursor while the custom cursor is active (fine pointers only) ───── */
  useEffect(() => {
    if (reducedMotion || window.matchMedia("(pointer: coarse)").matches) {
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

  /* ── Hero aurora cursor parallax (fine pointers only, motion allowed) ── */
  useEffect(() => {
    const el = heroRef.current;
    if (!el || reducedMotion || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--hero-px", px.toFixed(3));
      el.style.setProperty("--hero-py", py.toFixed(3));
    };
    const schedule = () => {
      if (!raf) {
        raf = window.requestAnimationFrame(apply);
      }
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      py = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      schedule();
    };
    const reset = () => {
      px = 0;
      py = 0;
      schedule();
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", reset, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
    };
  }, [reducedMotion]);

  /* ── Viewport width (panel sizing) ─────────────────────────── */
  useEffect(() => {
    const onResize = () => {
      vwRef.current = window.innerWidth;
      setViewportW(window.innerWidth);
    };
    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Single scroll loop: active section, reveals, and the horizontal work track ── */
  useEffect(() => {
    let raf = 0;
    const run = () => {
      raf = 0;
      const vh = window.innerHeight;
      const vw = vwRef.current;
      const scrollY = window.scrollY;

      /* Active section: last section whose top is above the 40% marker. */
      const marker = scrollY + vh * 0.4;
      let current: SectionId = "home";
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) {
          continue;
        }
        const top = el.getBoundingClientRect().top + scrollY;
        if (top <= marker) {
          current = s.id;
        }
      }
      if (current !== activeScreenRef.current) {
        activeScreenRef.current = current;
        setActiveScreen(current);
        /* Keep the URL shareable: reflect the active section as a #hash (bare path on home). */
        window.history.replaceState(
          null,
          "",
          current === "home"
            ? window.location.pathname + window.location.search
            : `#${current}`,
        );
      }

      /* Reveal sections once their top crosses into view. */
      for (const id of ["about", "connect"]) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < vh * 0.82) {
          setRevealed((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
        }
      }

      /* Horizontal work rail: map vertical progress through the tall section to translateX. */
      const sec = workSectionRef.current;
      const track = trackRef.current;
      if (sec && track && !reducedMotion) {
        const top = sec.getBoundingClientRect().top;
        const total = sec.offsetHeight - vh;
        const scrolled = clamp01(total > 0 ? -top / total : 0);
        const maxShift = (WORK_PANEL_COUNT - 1) * vw;
        track.style.transform = `translate3d(${-(scrolled * maxShift)}px, 0, 0)`;
        const idx = Math.round(scrolled * (WORK_PANEL_COUNT - 1));
        if (idx !== activePanelRef.current) {
          activePanelRef.current = idx;
          setActivePanel(idx);
        }
      }
    };
    const onScroll = () => {
      if (raf === 0) {
        raf = window.requestAnimationFrame(run);
      }
    };
    run();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
    };
  }, [reducedMotion]);

  const goToScreen = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    },
    [reducedMotion],
  );

  /* ── Ink wipe navigation: cover the page, jump instantly while hidden, then exit up. ── */
  const [wipe, setWipe] = useState<{ label: string; target: SectionId; phase: "cover" | "exit" } | null>(null);

  /** Safety: never leave the wipe mounted longer than one full cycle, even if transitionend is lost. */
  useEffect(() => {
    if (!wipe) {
      return;
    }
    const t = window.setTimeout(() => setWipe(null), 2600);
    return () => window.clearTimeout(t);
  }, [wipe]);

  const navigateTo = useCallback(
    (id: SectionId) => {
      if (reducedMotion || activeScreenRef.current === id || wipe) {
        goToScreen(id);
        return;
      }
      const label = SECTIONS.find((s) => s.id === id)?.label ?? id;
      setWipe({ label, target: id, phase: "cover" });
    },
    [reducedMotion, goToScreen, wipe],
  );


  /** Jump to a specific work panel (k=0 intro, k>=1 projects) by mapping to its vertical snap slot. */
  const goToPanel = useCallback(
    (k: number) => {
      const sec = workSectionRef.current;
      if (!sec) {
        return;
      }
      if (reducedMotion) {
        document
          .getElementById(WORK_PROJECTS[Math.max(0, k - 1)]?.id ?? "work")
          ?.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }
      const top = sec.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: top + k * window.innerHeight * (WORK_PANEL_SCROLL_DVH / 100),
        behavior: "smooth",
      });
    },
    [reducedMotion],
  );

  const onIntroOverlayEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "opacity") {
      return;
    }
    setIntroStep((s) => (s === 1 ? 2 : s));
  };

  const motionClass = reducedMotion ? "landing-no-motion" : "landing-motion";
  const showOverlay = introStep < 2 && !reducedMotion;
  const navVisible = introStep >= 2 && activeScreen !== "home";

  const tocLinkClass = (id: string) =>
    `group block w-full text-left font-mono text-[10px] uppercase tracking-[0.22em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
      activeScreen === id ? "text-white" : "text-white/45 hover:text-white"
    }`;
  const topNavLinkClass = (id: string) =>
    `rounded-sm px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-3 sm:text-[10px] sm:tracking-[0.22em] ${
      activeScreen === id ? "text-white" : "text-white/50 hover:text-white"
    }`;

  return (
    <div
      className={`relative text-white [&_a]:cursor-none [&_a:hover]:text-white ${motionClass}`}
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
      {/* One continuous backdrop spanning the whole page (color journey + grid) — no per-section seams. */}
      <div aria-hidden className="bg-az-page absolute inset-0 -z-20" />
      <div aria-hidden className="bg-az-grid absolute inset-0 -z-10 opacity-[0.05]" />
      <div
        aria-hidden
        className="bg-az-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.12] mix-blend-soft-light"
      />

      <CustomCursor />
      <ScrollDebugOverlay />

      {wipe && (
        <NavWipe
          label={wipe.label}
          phase={wipe.phase}
          onCovered={() => {
            document
              .getElementById(wipe.target)
              ?.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
            window.setTimeout(
              () => setWipe((w) => (w ? { ...w, phase: "exit" } : w)),
              60,
            );
          }}
          onDone={() => setWipe(null)}
        />
      )}

      {showOverlay && (
        <div
          className={`pointer-events-none fixed inset-0 z-50 bg-black transition-opacity duration-[700ms] ease-out ${
            introStep === 1 ? "opacity-0" : "opacity-100"
          }`}
          aria-hidden
          onTransitionEnd={onIntroOverlayEnd}
        />
      )}

      {/* ─── Persistent top nav ─── */}
      <nav
        aria-label="Primary"
        className={`fixed inset-x-0 top-0 z-40 transition-[transform,opacity] duration-300 ease-out ${
          navVisible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
        <div className="border-b border-white/10 bg-black/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-5 py-3 sm:px-10">
            <a
              href="#home"
              className="inline-flex shrink-0 items-center gap-2.5 normal-case text-white transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Adam Zhu, back to top"
              onClick={(e) => {
                e.preventDefault();
                navigateTo("home");
              }}
            >
              <img
                src={`${import.meta.env.BASE_URL}favicon.svg`}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 rounded-sm"
                decoding="async"
              />
            </a>

            <div className="flex min-w-0 items-center gap-1 sm:gap-3">
              {/* On large screens the numbered side nav handles section jumps, so hide these there. */}
              <ul className="flex items-center gap-0.5 sm:gap-1 lg:hidden">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={topNavLinkClass(s.id)}
                      aria-current={activeScreen === s.id ? "page" : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo(s.id);
                      }}
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href={RESUME_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-white/40 bg-white/10 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white transition-colors hover:border-white/70 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-3.5 sm:text-[10px] sm:tracking-[0.2em]"
              >
                <IconDownload className="h-3.5 w-3.5" />
                Resume
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Slim side rail (desktop): ticks only by default; expands to labels on hover. Hidden on hero. ─── */}
      <nav
        aria-label="Sections"
        className={`group/sn fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 lg:block transition-opacity duration-500 ${
          navVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="relative">
          {/* Panel backdrop fades in only while expanded, so labels stay readable over content. */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-r-2xl border-y border-r border-white/0 bg-black/0 backdrop-blur-0 transition-all duration-300 group-hover/sn:border-white/10 group-hover/sn:bg-black/65 group-hover/sn:backdrop-blur-md"
          />
          <ul className="relative flex flex-col gap-1 py-4 pl-4 pr-3 sm:pl-5">
            {SECTIONS.map((s) => {
              const active = activeScreen === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo(s.id);
                    }}
                    className="group/item flex items-center gap-3 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <span
                      aria-hidden
                      className={`h-px shrink-0 transition-all duration-300 ${
                        active ? "w-7 bg-az-indigo" : "w-4 bg-white/40 group-hover/item:bg-white/80"
                      }`}
                    />
                    <span
                      className={`max-w-0 overflow-hidden whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] opacity-0 transition-all duration-300 group-hover/sn:max-w-[12rem] group-hover/sn:opacity-100 ${
                        active ? "text-white" : "text-white/55"
                      }`}
                    >
                      {s.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ════════════════ 01 · Home (hero) ════════════════ */}
      <section
        id="home"
        ref={heroRef}
        className={`relative snap-start ${reducedMotion ? "" : SECTION_RUNWAY}`}
      >
        <div
          className={`relative isolate flex min-h-dvh flex-col ${
            reducedMotion ? "" : SECTION_RUNWAY_INNER
          }`}
        >
          <div className="px-5 pt-6 sm:px-10 sm:pt-8">
            <div className="landing-el landing-meta flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 sm:text-[11px]">
              <a
                href="#home"
                aria-label="Adam Zhu, back to top"
                className="inline-flex items-center gap-2.5 normal-case text-white/50 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                onClick={(e) => {
                  e.preventDefault();
                  goToScreen("home");
                }}
              >
                <img
                  src={`${import.meta.env.BASE_URL}favicon.svg`}
                  alt=""
                  width={36}
                  height={36}
                  className="h-8 w-8 shrink-0 rounded-sm sm:h-9 sm:w-9"
                  decoding="async"
                />
              </a>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="hidden sm:inline">CMU · STAT / ML</span>
                <a
                  href={RESUME_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Résumé (PDF)"
                  className="group inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-white/40 bg-white/10 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white transition-colors hover:border-white/70 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-3.5 sm:text-[10px] sm:tracking-[0.2em]"
                >
                  <IconDownload className="h-3.5 w-3.5" />
                  Resume
                </a>
              </div>
            </div>
            <div className="intro-line intro-line-top mt-6 h-px w-full overflow-hidden sm:mt-7">
              <div className="intro-line-inner intro-line-inner-h h-px w-full origin-left bg-white" />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-center px-5 pb-24 sm:px-10 sm:pb-28 lg:pb-28">
            <div className="mx-auto w-full max-w-[1600px] pb-10 pt-4 sm:pb-12 sm:pt-5">
              <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(4.5rem,auto)_minmax(0,1fr)] lg:gap-x-10 xl:gap-x-16">
                <div className="landing-name flex min-w-0 flex-col justify-center lg:min-h-0">
                  <div className="mx-auto w-fit max-w-full">
                    <h1
                      aria-label="Adam Zhu"
                      className="relative isolate m-0 inline-block w-fit max-w-full select-none font-display text-[clamp(5.25rem,24vw,17.5rem)] font-bold uppercase leading-[0.76] tracking-[0.02em]"
                    >
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -left-[5%] -right-[5%] -top-[24%] -bottom-[24%] z-0"
                      >
                        <div className="landing-name-backing absolute inset-0">
                          <div className="az-aurora absolute inset-0">
                            <span className="az-aurora__blob az-aurora__blob--a" />
                            <span className="az-aurora__blob az-aurora__blob--b" />
                            <span className="az-aurora__blob az-aurora__blob--c" />
                          </div>
                        </div>
                      </div>
                      <div className="landing-name-fill relative z-10 w-fit min-w-0">
                        <div className="block w-max">
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
                        <div className="mt-[0.02em] block w-max pl-[clamp(3.25rem,19vw,14rem)]">
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
                    </h1>
                  </div>
                </div>

                {/* Vertical rule + scroll cue */}
                <div className="hidden h-full min-h-0 flex-col items-center self-stretch lg:flex lg:min-h-[min(70vh,46rem)]">
                  <div
                    className="intro-line intro-line-v pointer-events-none relative flex min-h-0 w-full flex-1 flex-col items-center overflow-hidden"
                    aria-hidden
                  >
                    <div className="intro-line-inner intro-line-inner-v min-h-[min(40vh,24rem)] w-px min-w-px flex-1 origin-top bg-white" />
                  </div>
                  <div
                    className="landing-el landing-scroll-cue-under mt-auto flex min-h-[5.25rem] shrink-0 flex-col items-center justify-end gap-0 pt-5 pb-2 sm:min-h-[5.75rem] sm:pt-6 sm:pb-3"
                    aria-hidden={activeScreen !== "home"}
                  >
                    <div
                      className={`flex flex-col items-center gap-0 transition-opacity duration-300 ease-out ${
                        activeScreen === "home" ? "opacity-100" : "pointer-events-none opacity-0"
                      }`}
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">Scroll</span>
                      <span className="scroll-cue-arrow inline-flex text-white/50">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden>
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
                        {SECTIONS.map((s) => (
                          <li key={s.id}>
                            <a
                              href={`#${s.id}`}
                              className={tocLinkClass(s.id)}
                              aria-current={activeScreen === s.id ? "page" : undefined}
                              onClick={(e) => {
                                e.preventDefault();
                                navigateTo(s.id);
                              }}
                            >
                              {s.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>

                  <div className="landing-el landing-copy space-y-10">
                    <div className="intro-line intro-line-mid h-px w-full overflow-hidden">
                      <div className="intro-line-inner intro-line-inner-h h-px w-full origin-left bg-white" />
                    </div>
                    <div className="space-y-3">
                      <p className="font-mono text-[12px] uppercase leading-relaxed tracking-[0.14em] text-white sm:text-[13px]">
                        Statistics &amp; machine learning · Carnegie Mellon
                      </p>
                      <p className="font-mono text-[12px] uppercase leading-relaxed tracking-[0.14em] text-white/55 sm:text-[13px]">
                        Data pipelines, statistical inference, and computer vision.
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

                  <div
                    aria-hidden
                    className="landing-el landing-corner-index relative z-10 mt-auto w-full self-end overflow-visible pb-3 pt-4 lg:pb-4 lg:pt-6"
                  >
                    <SectionIndexCorner label="Home" className="pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Mobile scroll cue */}
              <div
                className="landing-el landing-scroll-cue-under mt-16 flex min-h-[3.5rem] flex-col items-center justify-center gap-0 lg:hidden"
                aria-hidden={activeScreen !== "home"}
              >
                <div
                  className={`flex flex-col items-center gap-0 transition-opacity duration-300 ease-out ${
                    activeScreen === "home" ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">Scroll</span>
                  <span className="scroll-cue-arrow inline-flex text-white/50">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden>
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ 02 · About — chaos → trajectory → content (scroll-scrubbed) ════════════════ */}
      <section
        id="about"
        ref={aboutSectionRef}
        className={`relative w-full snap-start ${
          reducedMotion ? "" : isMobile ? SECTION_RUNWAY : "lg:h-[280dvh]"
        }`}
        aria-labelledby="about-heading"
      >
        <div
          className={`${SECTION_INNER} ${revealed.has("about") ? "is-in" : ""} ${
            reducedMotion ? "" : SECTION_RUNWAY_INNER
          }`}
        >
        <TrajectoryChart
          sectionRef={aboutSectionRef}
          mode={reducedMotion || isMobile ? "static" : "scroll"}
        />
        <div
          className="relative z-10 mx-auto w-full max-w-[1600px]"
          style={
            reducedMotion || isMobile
              ? undefined
              : {
                  opacity: "var(--about-in, 0)",
                  transform: "translateY(calc((1 - var(--about-in, 0)) * 28px))",
                }
          }
        >
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="flex flex-col gap-0 lg:col-span-7">
              <p {...reveal(0)} className={`${reveal(0).className} font-mono text-[10px] uppercase tracking-[0.32em] text-az-indigo/90 sm:text-[11px]`}>
                02 / 04
              </p>
              <h2
                id="about-heading"
                {...reveal(1)}
                className={`${reveal(1).className} mt-5 font-display text-[clamp(2.5rem,7.5vw,4.75rem)] font-bold uppercase leading-[0.92] tracking-[0.02em] text-white`}
              >
                About
              </h2>
              <p {...reveal(2)} className={`${reveal(2).className} mt-8 max-w-xl font-mono text-sm uppercase leading-relaxed tracking-[0.14em] text-white/85 sm:text-[15px]`}>
                I&apos;m an undergraduate at{" "}
                <span className="text-white">Carnegie Mellon</span> studying Statistics &amp; Machine
                Learning. So far that&apos;s meant usage-analytics research at NIST, an iOS
                computer-vision app, forensic image research at CSAFE, analysis of VR evacuation
                studies at Iowa State, and a co-authored publication on diagnostic testing.
              </p>

              <div {...reveal(3)} className={`${reveal(3).className} mt-10`}>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">Skills</p>
                <div className="mt-4 flex flex-col gap-3">
                  {SKILL_GROUPS.map((g) => (
                    <div
                      key={g.label}
                      className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4"
                    >
                      <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.24em] text-white/45 sm:w-20 sm:pt-1">
                        {g.label}
                      </span>
                      <ul className="flex flex-wrap gap-2 p-0">
                        {g.items.map((it) => (
                          <li
                            key={it}
                            className="list-none border border-white/18 bg-black/30 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/80 sm:text-[10px]"
                          >
                            {it}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="flex flex-col gap-4 lg:col-span-5 lg:justify-center">
              <div {...reveal(4)} className={`${reveal(4).className} bg-az-card border border-white/18 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]`}>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/55">Now</p>
                <p className="mt-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.2em] text-white/90 sm:text-[12px]">
                  NIST · SURF research intern · Research Data &amp; Computing Office
                </p>
              </div>
              <div {...reveal(5)} className={`${reveal(5).className} bg-az-card-muted border border-white/14 p-5 sm:p-6`}>
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/55">Based</p>
                <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/80 sm:text-[11px]">
                  Gaithersburg, MD this summer. Carnegie Mellon, Pittsburgh, during the year.
                </p>
              </div>
            </aside>
          </div>
        </div>
        <div aria-hidden className={`${sectionIndexCornerAbsoluteWrap} bottom-8 -z-0 opacity-70 sm:bottom-10`}>
          <SectionIndexCorner label="About" />
        </div>
        </div>
      </section>

      {/* ════════════════ 03 · Work — pinned horizontal rail (desktop) / card stack (mobile, reduced motion) ════════════════ */}
      {reducedMotion || isMobile ? (
        <section
          id="work"
          ref={workSectionRef}
          className={`${SECTION_SHELL} is-in`}
          aria-labelledby="work-heading"
        >
          <div className="relative z-10 mx-auto w-full max-w-[1600px]">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-az-indigo/90 sm:text-[11px]">03 / 04</p>
            <h2 id="work-heading" className="mt-5 font-display text-[clamp(2.5rem,7.5vw,4.75rem)] font-bold uppercase leading-[0.92] tracking-[0.02em] text-white">
              Work
            </h2>
            <ul className="mt-10 grid max-w-4xl list-none gap-6 p-0">
              {WORK_PROJECTS.map((proj) => (
                <li key={proj.id} className="bg-az-card border border-white/16 p-6 sm:p-8">
                  <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/50">{proj.eyebrow}</p>
                  <h3 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">{proj.title}</h3>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/65">{proj.subtitle}</p>
                  <p className="mt-4 font-mono text-[12px] uppercase leading-relaxed tracking-[0.12em] text-white/82 sm:text-[13px]">{proj.body}</p>
                  <ProjectLinks links={proj.links} className="mt-5" />
                  <ul className="mt-4 flex flex-wrap gap-2 p-0">
                    {proj.tags.map((t) => (
                      <li key={t} className="list-none border border-white/20 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/70">{t}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <section
          id="work"
          ref={workSectionRef}
          className="relative"
          aria-labelledby="work-heading"
        >
          {/* Pinned stage */}
          <div className="sticky top-0 z-10 h-dvh w-full overflow-hidden">
            {/* Horizontal track */}
            <div
              ref={trackRef}
              className="flex h-full will-change-transform"
              style={{ width: `${WORK_PANEL_COUNT * viewportW}px` }}
            >
              {/* Panel 0 — intro: heading + directions on the left, project map filling the right */}
              <div
                className="flex h-full shrink-0 items-center px-5 sm:px-10 lg:pl-28"
                style={{ width: `${viewportW}px` }}
                {...inertWhen(activePanel !== 0)}
              >
                <div className="mx-auto w-full max-w-[1600px]">
                  <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10 xl:gap-16">
                    <div className="lg:col-span-5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-az-indigo/90 sm:text-[11px]">03 / 04</p>
                      <h2
                        id="work-heading"
                        className="mt-5 font-display text-[clamp(2.5rem,7.5vw,4.75rem)] font-bold uppercase leading-[0.92] tracking-[0.02em] text-white"
                      >
                        Work
                      </h2>
                      <p className="mt-8 max-w-xl font-mono text-sm uppercase leading-relaxed tracking-[0.14em] text-white/85 sm:text-[15px]">
                        Three research roles, an iOS computer-vision app, teaching, team
                        leadership, and a publication.
                      </p>
                      <div className="mt-10 flex flex-col gap-3">
                        <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">
                          <span className="tabular-nums text-white/35">01</span>
                          Click a point on the map to preview it
                        </p>
                        <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">
                          <span className="tabular-nums text-white/35">02</span>
                          Scroll to see each project in full
                          <IconArrowRight className="h-3.5 w-3.5" />
                        </p>
                      </div>
                    </div>
                    <div className="lg:col-span-7">
                      <WorkGraph labels={PROJECT_NAV_LABELS} onOpenProject={(i) => goToPanel(i + 1)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Project panels */}
              {WORK_PROJECTS.map((proj, i) => {
                const panelIndex = i + 1;
                const isActive = activePanel === panelIndex;
                return (
                  <div
                    key={proj.id}
                    className="flex h-full shrink-0 items-center px-5 sm:px-10 lg:pl-28"
                    style={{
                      width: `${viewportW}px`,
                      opacity: isActive ? 1 : 0.25,
                      transition: "opacity 0.5s ease",
                    }}
                    {...inertWhen(!isActive)}
                  >
                    <div className="mx-auto w-full max-w-[1600px]">
                      <div className="max-w-3xl">
                        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
                          {proj.eyebrow} · {String(panelIndex).padStart(2, "0")} / {String(WORK_PROJECTS.length).padStart(2, "0")}
                        </p>
                        <h3 className="mt-4 font-display text-[clamp(2.25rem,6vw,4rem)] font-bold uppercase leading-[0.95] tracking-[0.02em] text-white">
                          {proj.title}
                        </h3>
                        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60 sm:text-[12px]">
                          {proj.subtitle}
                        </p>
                        <p className="mt-6 max-w-2xl font-mono text-[12px] uppercase leading-relaxed tracking-[0.11em] text-white/82 sm:text-[13px]">
                          {proj.body}
                        </p>
                        <ProjectLinks links={proj.links} className="mt-6" />
                        <ul className="mt-8 flex flex-wrap gap-2 p-0">
                          {proj.tags.map((t) => (
                            <li
                              key={t}
                              className="list-none border border-white/20 bg-black/35 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white/72"
                            >
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Persistent rail header + progress (pinned over the stage) */}
            <div aria-hidden className={`${sectionIndexCornerAbsoluteWrap} bottom-8 -z-0 opacity-70 sm:bottom-10`}>
              <SectionIndexCorner label="Work" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex justify-center sm:bottom-9">
              <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/15 bg-black/55 px-4 py-2 backdrop-blur-sm">
                {Array.from({ length: WORK_PANEL_COUNT }).map((_, k) => (
                  <button
                    key={k}
                    type="button"
                    aria-label={k === 0 ? "Work intro" : `Project ${k}`}
                    aria-current={activePanel === k ? "true" : undefined}
                    onClick={() => goToPanel(k)}
                    className="group flex h-4 items-center"
                  >
                    <span
                      className={`block rounded-full transition-all duration-300 ${
                        activePanel === k
                          ? "h-2 w-6 bg-az-indigo"
                          : "h-2 w-2 bg-white/35 group-hover:bg-white/70"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/*
            Snap markers: one block per panel (WORK_PANEL_SCROLL_DVH tall, so the rail advances
            slower than 1 panel per viewport). They create the section's scroll length and a snap
            stop per project. The last marker stays 100dvh so scroll progress hits exactly 1.0 at
            the final panel. The negative top margin overlaps them with the pinned stage above.
          */}
          <div aria-hidden className="pointer-events-none -mt-[100dvh]">
            {Array.from({ length: WORK_PANEL_COUNT }).map((_, k) => (
              <div
                key={k}
                className="w-full snap-start"
                style={{
                  height:
                    k === WORK_PANEL_COUNT - 1 ? "100dvh" : `${WORK_PANEL_SCROLL_DVH}dvh`,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* ════════════════ 04 · Connect ════════════════ */}
      <section
        id="connect"
        className={`${SECTION_SHELL} ${revealed.has("connect") ? "is-in" : ""}`}
        aria-labelledby="connect-heading"
      >
        <div className="relative z-10 mx-auto w-full max-w-[1600px]">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="flex flex-col gap-0 lg:col-span-7">
              <p {...reveal(0)} className={`${reveal(0).className} font-mono text-[10px] uppercase tracking-[0.32em] text-az-indigo/90 sm:text-[11px]`}>
                04 / 04
              </p>
              <h2
                id="connect-heading"
                {...reveal(1)}
                className={`${reveal(1).className} mt-5 font-display text-[clamp(2.5rem,7.5vw,4.75rem)] font-bold uppercase leading-[0.92] tracking-[0.02em] text-white`}
              >
                Contact
              </h2>
              <p {...reveal(2)} className={`${reveal(2).className} mt-8 max-w-xl font-mono text-sm uppercase leading-relaxed tracking-[0.14em] text-white/85 sm:text-[15px]`}>
                Email is the fastest way to reach me. GitHub and LinkedIn work too.
              </p>
              <div {...reveal(3)} className={`${reveal(3).className} mt-10 flex flex-wrap gap-4`}>
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
              <div {...reveal(4)} className={`${reveal(4).className} bg-az-card border border-white/18 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]`}>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/55">Open to</p>
                <p className="mt-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-white/90 sm:text-[12px]">
                  Research collaborations, internships, and questions about any of the work above.
                </p>
              </div>
              <div {...reveal(5)} className={`${reveal(5).className} bg-az-card-muted border border-white/14 p-5 sm:p-6`}>
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/55">Resume</p>
                <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/80 sm:text-[11px]">
                  <a
                    href={RESUME_URL}
                    download
                    className="underline decoration-white/40 underline-offset-4 transition-colors hover:text-white hover:decoration-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Download the PDF
                  </a>
                </p>
              </div>
            </aside>
          </div>
        </div>
        <div aria-hidden className={`${sectionIndexCornerAbsoluteWrap} bottom-8 -z-0 opacity-70 sm:bottom-10`}>
          <SectionIndexCorner label="Contact" />
        </div>
      </section>

      <style>{`
        html {
          scroll-behavior: smooth;
          scroll-snap-type: none;
        }
        /* Proximity (not mandatory) so momentum isn't yanked to a stop at every boundary. */
        @media (min-width: 1024px) {
          html { scroll-snap-type: y proximity; }
        }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; scroll-snap-type: none; }
        }

        /* On-enter reveal for non-hero sections */
        .reveal-item {
          opacity: 0;
          transform: translateY(22px);
          transition:
            opacity 0.6s ease,
            transform 0.6s cubic-bezier(0.26, 0.9, 0.2, 1);
          transition-delay: calc(var(--ri, 0) * 0.07s);
        }
        .is-in .reveal-item {
          opacity: 1;
          transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal-item { opacity: 1; transform: none; transition: none; }
        }

        /* ── Hero intro animations (time-based, play once) ── */
        .landing-motion .intro-line-inner-h { transform: scaleX(0); }
        .landing-motion .intro-line-inner-v { transform: scaleY(0); }
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
        .landing-no-motion .intro-line-inner-h { transform: scaleX(1); }
        .landing-no-motion .intro-line-inner-v { transform: scaleY(1); }

        @keyframes landing-line-x { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes landing-line-y { from { transform: scaleY(0); } to { transform: scaleY(1); } }

        .landing-motion .landing-el { opacity: 0; transform: translateY(18px); }
        .landing-name { -webkit-font-smoothing: auto; -moz-osx-font-smoothing: auto; }
        .landing-motion .landing-name { transform: none; }
        .landing-name-fill {
          color: #fff;
          -webkit-text-fill-color: #fff;
          opacity: 0.92;
          text-shadow:
            0 0.02em 0.07em rgba(0, 0, 0, 0.28),
            0 0.01em 0.03em rgba(0, 0, 0, 0.2);
        }
        .landing-motion .landing-name-backing { opacity: 0; transform: scale(0.94); }
        .landing-motion[data-intro-step="2"] .landing-name-backing {
          animation: landing-name-panel-in var(--name-panel-dur) cubic-bezier(0.33, 0, 0.18, 1) forwards;
          animation-delay: var(--text-after-lines);
        }
        .landing-motion .landing-name-letter { opacity: 0; }
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
        .landing-motion[data-intro-step="2"] .landing-meta { animation-delay: calc(var(--rest-intro-delay) + 0s); }
        .landing-motion[data-intro-step="2"] .landing-index { animation-delay: calc(var(--rest-intro-delay) + var(--rest-rail-index)); }
        .landing-motion[data-intro-step="2"] .landing-copy { animation-delay: calc(var(--rest-intro-delay) + var(--rest-rail-copy)); }
        .landing-motion[data-intro-step="2"] .landing-corner-index { animation-delay: calc(var(--rest-intro-delay) + var(--rest-rail-corner)); }
        .landing-motion[data-intro-step="2"] .landing-scroll-cue-under { animation-delay: calc(var(--rest-intro-delay) + var(--rest-rail-scroll)); }

        .scroll-cue-arrow { animation: scroll-cue-bob 1.35s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .scroll-cue-arrow { animation: none; } }
        @keyframes scroll-cue-bob {
          0%, 100% { opacity: 0.45; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(8px); }
        }

        .landing-no-motion .landing-el { opacity: 1 !important; transform: none !important; animation: none !important; }
        .landing-no-motion .landing-name-backing { opacity: 1 !important; transform: none !important; animation: none !important; }
        .landing-no-motion .landing-name-letter { opacity: 1 !important; animation: none !important; transform: none !important; }
        .landing-no-motion .landing-name-fill { opacity: 1 !important; }

        @keyframes landing-name-panel-in {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes landing-letter-in {
          from { opacity: 0; transform: translate3d(0, 0.46em, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes landing-rise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
