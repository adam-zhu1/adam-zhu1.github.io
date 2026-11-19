import { CLARITY_ACCENT, CLARITY_SITE, CLARITY_STAGES } from "./clarity";

/**
 * The three projects, best first: each one a demo, a colour and its words, laid out as a page
 * of a lab notebook. `facts` are the measured results, `steps` how it works, `fig` the caption
 * under its demo, `line` the one result the index at the top shows. The rest of the work
 * (research, the paper, the campus team, side projects) keeps its own quieter index under it,
 * in MoreWork.
 */
export type Entry = {
  id: string; name: string; when: string;
  kind: string; accent: string; demo: "trueline" | "clarity" | "nist";
  body: string; meta?: string; result?: string;
  line: string; what: string; big: [string, string]; fig: string; facts: [string, string][]; steps: [string, string][];
  links?: { href: string; label: string; page?: boolean }[];
};

export const WORK: Entry[] = [
  { id: "p-trueline", name: "TrueLine", when: "Aug 2026", kind: "iPhone app, on the App Store", accent: "#40e69e", demo: "trueline",
    body: "A bowling ball tracker for iPhone. Prop the phone behind the approach, bowl, and it measures the throw: where the ball crossed the arrows, where it hooked, how fast it left your hand, and the board and angle it entered on. Everything runs on the phone.",
    meta: "Swift, Vision, Core ML · on the App Store since August 2026",
    result: "Tracked the ball down the full lane on 6 of 6 unseen clips, across two bowling centers and three camera positions.",
    links: [
      { href: "https://apps.apple.com/us/app/trueline-bowling-ball-tracker/id6801953797", label: "App Store" },
      { href: "https://truelinebowling.com/", label: "truelinebowling.com", page: true },
    ],
    line: "6 of 6 unseen clips tracked down the full lane",
    big: ["6 of 6", "unseen clips tracked down the full lane"],
    what: "An iPhone app that tracks a bowling ball down the lane from one video.",
    fig: "One throw, tracked frame by frame and played through the stages of the pipeline.",
    facts: [
      ["Unseen clips tracked the full lane", "6 of 6"],
      ["Board, against the Python prototype", "within 1"],
      ["Entry board error against labeled video", "0.43"],
      ["Labeled frames the detector learned from", "215"],
    ],
    steps: [
      ["Capture", "One throw, filmed at 30 fps from behind the approach."],
      ["Detect", "A detector fine-tuned on 215 labeled frames finds the ball, run through Core ML and Vision."],
      ["Track", "A Kalman filter joins the detections into one ball across the lane."],
      ["Map", "Calibration turns every pixel into a board and a distance down the lane."],
      ["Read", "Smoothing and fitted slopes give speed, angles and the entry board."],
    ] },
  { id: "p-clarity", name: "Clarity", when: "Sep 2026", kind: "Mac app, HackCMU 2026", accent: CLARITY_ACCENT, demo: "clarity",
    body: "A macOS menu-bar app that explains any problem on your screen. Press one hotkey, drag a box around the problem, and a written explanation arrives in seconds, then an animation made for that exact problem about a minute later.",
    meta: "Python, Go, LangGraph, Manim",
    result: "Built in two days at HackCMU, team of four. I built the Mac app.",
    links: [{ href: CLARITY_SITE, label: "Clarity’s site" }],
    line: "Built in two days at HackCMU, team of four",
    big: ["2 days", "to build it at HackCMU, team of four"],
    what: "A Mac app that explains any problem on your screen.",
    fig: "One capture, from the hotkey to the video, rebuilt from the app’s own windows.",
    facts: [
      ["Built in", "2 days"],
      ["Team", "4"],
      ["My part", "the Mac app"],
      ["Written explanation", "seconds"],
      ["Animation for the problem", "about a minute"],
    ],
    steps: CLARITY_STAGES.map(([a, b]) => [a, b]) },
  { id: "p-nist", name: "NIST", when: "May to Aug 2026", kind: "Research internship, summer 2026", accent: "#8fa8f0", demo: "nist",
    body: "Research intern at the National Institute of Standards and Technology. A five-stage pandas and scikit-learn pipeline that separates automated from human traffic in the logs of NIST’s public data portal.",
    meta: "Python, pandas, scikit-learn · Gaithersburg, MD · No public code",
    result: "A random forest using only behavioral signals reached F1 = 0.94. An isolation forest surfaced a disguised scraper, and the cleaning rules built from it raised the measured automated share from 21.7% to 41.9%.",
    line: "Random forest F1 = 0.94 on behavioral signals only",
    big: ["0.94", "random forest F1 on behavioral signals only"],
    what: "Telling automated traffic from people in the logs of NIST’s public data portal.",
    fig: "Share of portal requests classified as automated, at each stage of the cleaning.",
    facts: [
      ["Random forest F1, no user-agent", "0.94"],
      ["Automated share, before and after", "21.7% → 41.9%"],
      ["Requests analyzed", "1.04M"],
      ["Days of logs", "271"],
    ],
    steps: [
      ["User-agent", "Flag requests that say what they are: 21.7% automated."],
      ["Behavior", "Add rules on how each visitor moves through the portal: 30.6%."],
      ["Audit", "An isolation forest surfaced a disguised scraper; the rules rebuilt from it reach 41.9%, a lower bound."],
      ["Model", "A random forest that never sees the user-agent separates the two at F1 = 0.94."],
    ] },
];
