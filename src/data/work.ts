import { CLARITY_ACCENT, CLARITY_SITE } from "./clarity";

/**
 * The projects on the wheel, best first: each one a demo, a colour and its words. The rest
 * of the work (research, the paper, the campus team, side projects) is not on the wheel; it
 * keeps its own quieter index under it, in MoreWork.
 */
export type Entry = {
  id: string; name: string; when: string;
  kind: string; accent: string; demo: "trueline" | "clarity" | "nist";
  body: string; meta?: string; result?: string;
  links?: { href: string; label: string; page?: boolean }[];
};

export const WORK: Entry[] = [
  { id: "p-trueline", name: "TrueLine", when: "Aug 2026", kind: "iPhone app, on the App Store", accent: "#40e69e", demo: "trueline",
    body: "A bowling ball tracker for iPhone. Prop the phone behind the approach, bowl, and it measures the throw: where the ball crossed the arrows, where it hooked, how fast it left your hand, and the board and angle it entered on. Everything runs on the phone.",
    meta: "Swift, Vision, Core ML · on the App Store since August 2026",
    result: "Tracked the ball down the full lane on 6 of 6 unseen clips; within 1 board and 1–2% on speed against the Python prototype.",
    links: [
      { href: "https://apps.apple.com/us/app/trueline-bowling-ball-tracker/id6801953797", label: "App Store" },
      { href: "/trueline/", label: "How it works", page: true },
    ] },
  { id: "p-clarity", name: "Clarity", when: "Sep 2026", kind: "Mac app, HackCMU 2026", accent: CLARITY_ACCENT, demo: "clarity",
    body: "A macOS menu-bar app that explains any problem on your screen. Press one hotkey, drag a box around the problem, and a written explanation arrives in seconds, then an animation made for that exact problem about a minute later.",
    meta: "Python, Go, LangGraph, Manim",
    result: "Built in two days at HackCMU, team of four. I built the Mac app.",
    links: [{ href: CLARITY_SITE, label: "Clarity’s site" }] },
  { id: "p-nist", name: "NIST", when: "May to Aug 2026", kind: "Research internship, summer 2026", accent: "#8fa8f0", demo: "nist",
    body: "Research intern at the National Institute of Standards and Technology. A five-stage pandas and scikit-learn pipeline that separates automated from human traffic in the logs of NIST’s public data portal.",
    meta: "Python, pandas, scikit-learn · Gaithersburg, MD · No public code",
    result: "A random forest using only behavioral signals reached F1 = 0.94. An isolation forest surfaced a disguised scraper, and the cleaning rules built from it raised the measured automated share from 21.7% to 41.9%." },
];
