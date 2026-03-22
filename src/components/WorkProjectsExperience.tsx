import { useMemo, type CSSProperties } from "react";
import {
  WORK_PROJECTS,
  mapHorizontalScrollToSlideIndex,
  remapHorizontalScrollU,
  workProjectsSegmentWeights,
  type WorkProjectMotion,
} from "../data/workProjects";

function clamp01(n: number): number {
  return Math.min(Math.max(n, 0), 1);
}

function easeOutQuart(t: number): number {
  return 1 - (1 - t) * (1 - t) * (1 - t) * (1 - t);
}

/** Intro stagger (matches Home section feel). */
function introStaggerStyle(
  index: number,
  introProgress: number,
  reducedMotion: boolean,
  slidePx = 22,
): CSSProperties | undefined {
  if (reducedMotion) {
    return undefined;
  }
  const start = 0.055;
  const span = 0.26;
  const tLinear = clamp01((introProgress - index * start) / span);
  const tMove = easeOutQuart(tLinear);
  const tFade = Math.pow(tMove, 1.48);
  return {
    opacity: tFade,
    transform: `translateY(${(1 - tMove) * slidePx}px)`,
  };
}

const WORK_INTRO_END = 0.1;
/**
 * p where horizontal scrub u reaches 1 (publication slide in). After this, u stays at 1 — user keeps scrolling
 * normally; no animated handoff, Connect comes in via the page scroll.
 */
const WORK_HORIZ_U_COMPLETE = 0.86;
/** Team Neutrino (slide index 3): extra scroll at full frame before publication. */
const NEUTRINO_DWELL_U = 0.068;

function motionStyle(
  motion: WorkProjectMotion,
  enter: number,
  reducedMotion: boolean,
): CSSProperties {
  if (reducedMotion) {
    return { opacity: 1, transform: "none", filter: "none" };
  }
  const e = easeOutQuart(enter);
  switch (motion) {
    case "wipe":
      return {
        opacity: e,
        transform: `translateX(${(1 - e) * -28}px)`,
        /** Clip from the left so the right edge + border stay visible while the card moves. */
        clipPath: `inset(0 0 0 ${(1 - e) * 100}%)`,
      };
    case "depth":
      return {
        opacity: e,
        transform: `scale(${0.9 + e * 0.1}) translateY(${(1 - e) * 28}px)`,
        filter: `blur(${(1 - e) * 10}px)`,
      };
    case "rise":
      return {
        opacity: e,
        transform: `translateY(${(1 - e) * 48}px) scale(${0.96 + e * 0.04})`,
      };
    case "tilt":
      return {
        opacity: e,
        transform: `translateY(${(1 - e) * 32}px) rotateZ(${(1 - e) * -2.2}deg)`,
      };
    case "scan":
      return {
        opacity: e,
        /** Gentler than before — heavy skew + handoff transform read as “glitchy” on the last slide. */
        transform: `translateY(${(1 - e) * 12}px) skewX(${(1 - e) * -1.25}deg)`,
        boxShadow: `0 0 ${(1 - e) * 32}px rgba(255,255,255,${0.05 * e})`,
      };
    default:
      return { opacity: e };
  }
}

type Props = {
  workRevealProgress: number;
  reducedMotion: boolean;
  viewportW: number;
};

export function WorkProjectsExperience({ workRevealProgress, reducedMotion, viewportW }: Props) {
  const weights = useMemo(() => workProjectsSegmentWeights(), []);
  const n = WORK_PROJECTS.length;

  const { introP, horizU, introOverlayOpacity, railBlend } = useMemo(() => {
    const p = clamp01(workRevealProgress);
    const introP = clamp01(p / Math.max(WORK_INTRO_END, 0.001));
    const horizStart = WORK_INTRO_END;
    const horizSpan = Math.max(WORK_HORIZ_U_COMPLETE - horizStart, 0.001);
    const horizU =
      p >= WORK_HORIZ_U_COMPLETE ? 1 : clamp01((p - horizStart) / horizSpan);

    const fadeStart = WORK_INTRO_END * 0.55;
    let introOverlayOpacity = 1;
    if (p >= fadeStart && p < WORK_INTRO_END) {
      introOverlayOpacity = 1 - (p - fadeStart) / (WORK_INTRO_END - fadeStart);
    } else if (p >= WORK_INTRO_END) {
      introOverlayOpacity = 0;
    }
    const railBlend =
      p < fadeStart ? 0 : p >= WORK_INTRO_END ? 1 : (p - fadeStart) / (WORK_INTRO_END - fadeStart);

    return { introP, horizU, introOverlayOpacity, railBlend };
  }, [workRevealProgress]);

  const horizUForRail = useMemo(
    () =>
      reducedMotion ? 0 : remapHorizontalScrollU(horizU, weights, 3, NEUTRINO_DWELL_U),
    [horizU, weights, reducedMotion],
  );

  const fractionalSlide = useMemo(
    () => (reducedMotion ? 0 : mapHorizontalScrollToSlideIndex(horizUForRail, weights)),
    [horizUForRail, weights, reducedMotion],
  );

  /** First project stays hidden until a bit into the horizontal phase (no card peeking during intro). */
  const firstProjectScrollFade = useMemo(() => {
    if (reducedMotion) {
      return 1;
    }
    const span = 0.11;
    return easeOutQuart(clamp01(horizU / span));
  }, [horizU, reducedMotion]);

  const translatePx = -fractionalSlide * viewportW;

  if (reducedMotion) {
    return (
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-[1600px] flex-col justify-center gap-10 px-5 pb-24 pt-28 sm:px-10 sm:pb-28 sm:pt-32">
        <header className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50 sm:text-[11px]">03 · Work</p>
          <h2
            id="work-heading"
            className="mt-5 font-display text-[clamp(2.5rem,7.5vw,4.75rem)] font-bold uppercase leading-[0.92] tracking-[0.02em] text-white"
          >
            Selected
            <span className="block text-white">work</span>
          </h2>
          <p className="mt-8 max-w-xl font-mono text-sm uppercase leading-relaxed tracking-[0.14em] text-white/85 sm:text-[15px]">
            Projects and research — scroll the main page to move on; each block is a snapshot you can expand later
            with links and figures.
          </p>
        </header>
        <ul className="grid max-w-4xl list-none gap-6 p-0 sm:grid-cols-1">
          {WORK_PROJECTS.map((proj) => (
            <li
              key={proj.id}
              className="bg-az-card border border-white/16 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.035)] sm:p-8"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/50">{proj.eyebrow}</p>
              <h3 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
                {proj.title}
              </h3>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/65">{proj.subtitle}</p>
              <p className="mt-4 font-mono text-[12px] uppercase leading-relaxed tracking-[0.12em] text-white/82 sm:text-[13px]">
                {proj.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2 p-0">
                {proj.tags.map((t) => (
                  <li
                    key={t}
                    className="list-none border border-white/20 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/70"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="max-w-md font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
          Next section: connect — email, GitHub, and LinkedIn.
        </p>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col px-5 pb-24 pt-28 sm:px-10 sm:pb-28 sm:pt-32">
      <div
        className="pointer-events-none absolute bottom-[5.25rem] right-5 z-30 flex flex-col items-end gap-2 text-right font-display font-bold leading-none text-white sm:bottom-[6.5rem] sm:right-10"
        aria-hidden
        style={{ opacity: 0.35 + railBlend * 0.65 }}
      >
        <span className="block text-[clamp(3.5rem,12vw,7.5rem)] tracking-tight">03</span>
        <span className="block font-mono text-[clamp(11px,2.4vw,14px)] uppercase tracking-[0.28em] text-white/50">
          Work
        </span>
      </div>

      {/* Intro overlay */}
      <div
        className="pointer-events-none absolute inset-x-0 top-28 z-20 mx-auto max-w-[1600px] px-5 sm:top-32 sm:px-10"
        style={{ opacity: introOverlayOpacity }}
      >
        <div style={introStaggerStyle(0, introP, false)}>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50 sm:text-[11px]">03 · Work</p>
        </div>
        <div className="mt-5 sm:mt-6" style={introStaggerStyle(1, introP, false)}>
          <h2
            id="work-heading"
            className="font-display text-[clamp(2.5rem,7.5vw,4.75rem)] font-bold uppercase leading-[0.92] tracking-[0.02em] text-white"
          >
            Selected
            <span className="block text-white">work</span>
          </h2>
        </div>
        <div className="mt-8 max-w-xl" style={introStaggerStyle(2, introP, false)}>
          <p className="font-mono text-sm uppercase leading-relaxed tracking-[0.14em] text-white/85 sm:text-[15px]">
            Scroll down: each beat is a project page drifting left → right — pacing is uneven on purpose. On the last
            card, pause if you like, then scroll down for Connect.
          </p>
        </div>
      </div>

      {/* Horizontal rail */}
      <div
        role="region"
        aria-label="Selected projects — scroll vertically to move between slides"
        className="relative mt-4 flex min-h-0 flex-1 flex-col justify-center overflow-x-clip overflow-y-visible sm:mt-8"
        style={{ opacity: railBlend }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/2 z-[1] h-[min(55vh,28rem)] w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-white/25 to-transparent"
          style={{
            opacity: 0.15 + horizU * 0.55,
            transform: `translateY(-50%) translateX(${Math.sin(horizU * Math.PI * 2.1) * 10}px)`,
          }}
        />
        <div className="overflow-x-clip overflow-y-visible px-2 sm:px-3">
          <div
            className="flex will-change-transform"
            style={{
              width: n * viewportW,
              transform: `translate3d(${translatePx}px, 0, 0)`,
            }}
          >
            {WORK_PROJECTS.map((proj, i) => {
              const dist = Math.abs(fractionalSlide - i);
              const neighbor = clamp01(1 - dist * 1.35);
              const enter = clamp01(1 - dist * 1.15);
              const panelMotion = motionStyle(proj.motion, enter, false);
              const slideShellOpacity = clamp01(Math.pow(neighbor, 1.05));
              const firstFade = i === 0 ? firstProjectScrollFade : 1;
              return (
                <div
                  key={proj.id}
                  className="shrink-0 px-1 sm:px-3"
                  style={{
                    width: viewportW,
                    opacity: slideShellOpacity * firstFade,
                    transform: `scale(${0.94 + neighbor * 0.06})`,
                    transition: "none",
                  }}
                >
                  <div
                    className="bg-az-work-slide mx-auto flex h-[min(72vh,40rem)] max-w-3xl flex-col justify-center border border-white/18 px-6 py-8 backdrop-blur-[2px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.045)] sm:px-10 sm:py-10"
                    style={{
                      ...panelMotion,
                      opacity:
                        (typeof panelMotion.opacity === "number" ? panelMotion.opacity : 1) * firstFade,
                    }}
                  >
                    <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/50">{proj.eyebrow}</p>
                    <h3 className="mt-4 font-display text-[clamp(1.75rem,5vw,2.75rem)] font-bold uppercase leading-[0.95] tracking-[0.02em] text-white">
                      {proj.title}
                    </h3>
                    <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60 sm:text-[12px]">
                      {proj.subtitle}
                    </p>
                    <p className="mt-6 font-mono text-[12px] uppercase leading-relaxed tracking-[0.11em] text-white/82 sm:text-[13px]">
                      {proj.body}
                    </p>
                    <ul className="mt-8 flex flex-wrap gap-2 p-0">
                      {proj.tags.map((t) => (
                        <li
                          key={t}
                          className="list-none border border-white/20 bg-black/35 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white/72 shadow-[inset_0_0_0_1px_rgba(81,43,135,0.12)]"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-6 max-w-lg font-mono text-[10px] uppercase tracking-[0.2em] text-white/40" style={{ opacity: railBlend }}>
          Last page: when you&apos;re ready, scroll down — Connect is next.
        </p>
      </div>
    </div>
  );
}

export function workSectionMinHeightVh(projectCount: number): number {
  /** Tall track: intro + horizontal rail + extra scroll after the last slide (natural exit to Connect). */
  return 88 + projectCount * 108 + 200;
}
