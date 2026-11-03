import { CLARITY_ACCENT, CLARITY_SITE } from "./clarity";

/**
 * Everything on the wheel, newest first. The three with a demo are the projects; the rest
 * are the research, the paper, the campus team and the side projects, each shown by its
 * own figure instead. Every figure is the resume's, and the paper is scoped to what Adam did
 * on it (second author, joined at the revision stage).
 */
export type Entry = {
  id: string; name: string; short?: string; when: string; year: number;
  kind: string; accent: string; demo?: "trueline" | "clarity" | "nist";
  body: string; meta?: string; result?: string;
  big?: [string, string][];
  links?: { href: string; label: string; page?: boolean }[];
};

const GREY = "#a9a9b2";

export const WORK: Entry[] = [
  { id: "p-clarity", name: "Clarity", when: "Sep 2026", year: 2026, kind: "Mac app, HackCMU 2026", accent: CLARITY_ACCENT, demo: "clarity",
    body: "A macOS menu-bar app that explains any problem on your screen. Press one hotkey, drag a box around the problem, and a written explanation arrives in seconds, then an animation made for that exact problem about a minute later.",
    meta: "Python, Go, LangGraph, Manim",
    result: "Built in two days at HackCMU, team of four. I built the Mac app.",
    links: [{ href: CLARITY_SITE, label: "Clarity’s site" }] },
  { id: "w-scottylabs", name: "ScottyLabs AI", short: "ScottyLabs", when: "Sep 2026 to now", year: 2026, kind: "Software engineer, Carnegie Mellon", accent: GREY,
    body: "Set up the dev stack for Bark: a Python LLM backend, MCP tools and Postgres. Traced a login bug where expired sessions still looked signed in but every request failed.",
    meta: "Python, MCP, Postgres",
    big: [["Bark", "CMU’s campus AI assistant"]],
    links: [{ href: "https://scottylabs.org/", label: "ScottyLabs" }] },
  { id: "w-fantasy", name: "Fantasy draft assistant", short: "Fantasy draft", when: "Sep 2026", year: 2026, kind: "Side project", accent: GREY,
    body: "Ranks players by floor-adjusted value over replacement, built from three seasons of weekly scoring variance, with a live draft board that tracks picks as they are made.",
    meta: "Python",
    big: [["3", "seasons of weekly variance"]],
    links: [{ href: "https://github.com/adam-zhu1/fantasy-football-draft", label: "GitHub" }] },
  { id: "p-trueline", name: "TrueLine", when: "Aug 2026", year: 2026, kind: "iPhone app, on the App Store", accent: "#40e69e", demo: "trueline",
    body: "A bowling ball tracker for iPhone. Prop the phone behind the approach, bowl, and it measures the throw: where the ball crossed the arrows, where it hooked, how fast it left your hand, and the board and angle it entered on. Everything runs on the phone.",
    meta: "Swift, Vision, Core ML · on the App Store since August 2026",
    result: "Tracked the ball down the full lane on 6 of 6 unseen clips; within 1 board and 1–2% on speed against the Python prototype.",
    links: [
      { href: "https://apps.apple.com/us/app/trueline-bowling-ball-tracker/id6801953797", label: "App Store" },
      { href: "/trueline/", label: "How it works", page: true },
    ] },
  { id: "p-nist", name: "NIST", when: "May to Aug 2026", year: 2026, kind: "Research internship, summer 2026", accent: "#8fa8f0", demo: "nist",
    body: "Research intern at the National Institute of Standards and Technology. A five-stage pandas and scikit-learn pipeline that separates automated from human traffic in the logs of NIST’s public data portal.",
    meta: "Python, pandas, scikit-learn · Gaithersburg, MD · No public code",
    result: "A random forest using only behavioral signals reached F1 = 0.94. An isolation forest surfaced a disguised scraper, and the cleaning rules built from it raised the measured automated share from 21.7% to 41.9%." },
  { id: "w-march", name: "March Madness predictor", short: "March Madness", when: "Mar 2026", year: 2026, kind: "Side project", accent: GREY,
    body: "A year-aware logistic regression on historical tournament matchups, served through a Streamlit app.",
    meta: "Python, Streamlit",
    big: [["2026", "bracket, from historical matchups"]],
    links: [{ href: "https://github.com/adam-zhu1/march-madness-2026", label: "GitHub" }] },
  { id: "w-paper", name: "Matched binary diagnostic tests", short: "Paper", when: "2024", year: 2024, kind: "Paper, Mathematics 12(5), 741", accent: GREY,
    body: "Statistical tests for proportion difference in one-to-two matched binary diagnostic data, applied to environmental testing for Salmonella in the United States. I joined at the revision stage: manuscript preparation, literature review, and data cleaning.",
    meta: "Lin, Zhu, Wang",
    big: [["12(5)", "Mathematics, article 741"]],
    links: [{ href: "https://doi.org/10.3390/math12050741", label: "Paper" }] },
  { id: "w-vrac", name: "VR evacuation study", short: "VRAC", when: "Jan to Jun 2024", year: 2024, kind: "Research intern, VRAC, Iowa State", accent: GREY,
    body: "Fit regression models of time to escape in simulated VR evacuations. Smart audio guidance beat static and adaptive signage by a statistically significant margin. Manuscript in preparation.",
    meta: "Regression, experimental design",
    big: [["454", "simulated evacuation trials"], ["227", "participants"]] },
  { id: "w-csafe", name: "Forensic image research", short: "CSAFE", when: "Jun 2023 to Aug 2024", year: 2023, kind: "Research intern, CSAFE, Iowa State", accent: GREY,
    body: "Co-authored a manuscript, under review at Forensic Sciences, that evaluates camera fingerprinting for device identification. Built document-degradation methods to test handwriting-similarity analysis under realistic conditions.",
    meta: "Forensic statistics",
    big: [["24,000+", "camera images"], ["100+", "degraded writing samples"]] },
];
