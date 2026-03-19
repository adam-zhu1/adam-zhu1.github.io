import { useEffect, useState } from "react";

/** Short cycle; last item is English "Hello" and stays. */
const GREETINGS = ["Hello", "Hola", "你好", "Ciao", "Hello"] as const;

/** Bump when list/timing changes so returning visitors see the new sequence once. */
const CYCLE_DONE_KEY = "landingGreetingCycleDoneV2";

const SWIPE_MS = 140;
const HOLD_MS = 320;

type Anim = "in" | "settled" | "out";

type LandingHeroGreetingProps = {
  /** When false, show full line static (e.g. during landing wave intro). */
  startWhen?: boolean;
};

export function LandingHeroGreeting({ startWhen = true }: LandingHeroGreetingProps) {
  const [cycleDone, setCycleDone] = useState(() => {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(CYCLE_DONE_KEY) === "1";
  });

  const [index, setIndex] = useState(0);
  const [anim, setAnim] = useState<Anim>("in");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced && !cycleDone) {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(CYCLE_DONE_KEY, "1");
      }
      setCycleDone(true);
    }
  }, [cycleDone]);

  useEffect(() => {
    if (!startWhen || cycleDone) return;

    let id: ReturnType<typeof window.setTimeout>;

    if (anim === "in") {
      id = window.setTimeout(() => setAnim("settled"), SWIPE_MS);
    } else if (anim === "settled") {
      id = window.setTimeout(() => {
        if (index >= GREETINGS.length - 1) {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(CYCLE_DONE_KEY, "1");
          }
          setCycleDone(true);
        } else {
          setAnim("out");
        }
      }, HOLD_MS);
    } else {
      id = window.setTimeout(() => {
        setIndex((i) => i + 1);
        setAnim("in");
      }, SWIPE_MS);
    }

    return () => window.clearTimeout(id);
  }, [startWhen, cycleDone, index, anim]);

  const isStatic = !startWhen || cycleDone;
  const word = isStatic ? "Hello" : GREETINGS[index];

  const wordClass = isStatic
    ? ""
    : anim === "in"
      ? "landing-greet-in"
      : anim === "out"
        ? "landing-greet-out"
        : "landing-greet-settled";

  return (
    <span className="block leading-[1.05]">
      <span className="inline-flex flex-wrap items-baseline gap-x-1 gap-y-1">
        <span className="inline-block overflow-hidden text-left align-baseline min-h-[1em]">
          <span
            key={index}
            className={`inline-block will-change-[transform,opacity] text-primary font-semibold ${wordClass}`}
          >
            {word}
          </span>
        </span>
        <span className="text-foreground">,</span>
        <span className="text-foreground">{"I'm Adam Zhu"}</span>
      </span>
    </span>
  );
}
