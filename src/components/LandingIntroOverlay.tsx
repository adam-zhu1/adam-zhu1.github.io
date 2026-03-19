import { useEffect, useState } from "react";

/**
 * Set to `true` when you’re ready to bring the landing intro back.
 * When `false`, the page behaves as if the intro already ran (no overlay, normal staggered animations).
 */
export const LANDING_INTRO_ENABLED = false;

const INTRO_SHOWN_KEY = "landingIntroShown";
const BLANK_MS = 500;
const WAVE_MS = 600;
const TOTAL_MS = BLANK_MS + WAVE_MS;

/** Soft blue-gray to match the design system */
const INTRO_BG = "hsl(222 20% 96%)";

export function useLandingIntro() {
  const [showIntro, setShowIntro] = useState(() => {
    if (!LANDING_INTRO_ENABLED) return false;
    return typeof sessionStorage !== "undefined" ? !sessionStorage.getItem(INTRO_SHOWN_KEY) : false;
  });
  const [introComplete, setIntroComplete] = useState(() => {
    if (!LANDING_INTRO_ENABLED) return true;
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(INTRO_SHOWN_KEY) ? true : false;
  });

  useEffect(() => {
    if (!LANDING_INTRO_ENABLED || !showIntro || introComplete) return;
    const t = setTimeout(() => {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(INTRO_SHOWN_KEY, "1");
      setIntroComplete(true);
    }, TOTAL_MS);
    return () => clearTimeout(t);
  }, [showIntro, introComplete]);

  return { showIntro, introComplete };
}

type WaveOverlayProps = {
  onWaveComplete?: () => void;
};

export function WaveOverlay({ onWaveComplete }: WaveOverlayProps) {
  const [phase, setPhase] = useState<"blank" | "wave">("blank");

  useEffect(() => {
    const startWave = setTimeout(() => setPhase("wave"), BLANK_MS);
    return () => clearTimeout(startWave);
  }, []);

  useEffect(() => {
    if (phase !== "wave") return;
    const done = setTimeout(() => onWaveComplete?.(), WAVE_MS);
    return () => clearTimeout(done);
  }, [phase, onWaveComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none"
      aria-hidden
    >
      {/* Blank fill — hides instantly when wave phase starts so the wave is seamless */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: INTRO_BG,
          opacity: phase === "blank" ? 1 : 0,
          transition: phase === "wave" ? "none" : undefined,
        }}
      />

      {/* Curved wave that rises (bottom → top): full-height block with wavy bottom, slides up */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          opacity: phase === "wave" ? 1 : 0,
          transition: "opacity 0.15s ease-out",
        }}
      >
        <svg className="absolute size-0 overflow-hidden" aria-hidden>
          <defs>
            <clipPath id="landing-wave-clip" clipPathUnits="objectBoundingBox">
              {/* Wavy bottom edge: 0-1 coords, wave in the bottom 15% */}
              <path d="M 0 0 L 1 0 L 1 0.88 Q 0.75 0.95 0.5 0.88 Q 0.25 0.82 0 0.88 L 0 0 Z" />
            </clipPath>
          </defs>
        </svg>
        <div
          className="absolute left-0 right-0 w-full origin-bottom"
          style={{
            height: "100vh",
            bottom: 0,
            backgroundColor: INTRO_BG,
            clipPath: "url(#landing-wave-clip)",
            animation: "landing-wave-rise 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        />
      </div>
    </div>
  );
}
