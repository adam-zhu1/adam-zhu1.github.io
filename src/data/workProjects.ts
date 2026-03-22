export type WorkProjectMotion = "wipe" | "depth" | "rise" | "tilt" | "scan";

export type WorkProject = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  tags: string[];
  motion: WorkProjectMotion;
};

/**
 * Resume-aligned highlights (AdamZhu_draft1.pdf). Tweak copy or links anytime.
 * `segmentWeight` controls how much vertical scroll each “page” consumes (non-linear rail).
 */
export const WORK_PROJECTS: (WorkProject & { segmentWeight: number })[] = [
  {
    id: "csafe",
    eyebrow: "Research · Forensics",
    title: "Camera & handwriting",
    subtitle: "CSAFE, Iowa State — research intern",
    body:
      "Forensic analysis on 24,000+ camera images for device fingerprinting; degraded and compared handwriting samples for similarity datasets. Co-author on work under review in forensic sciences.",
    tags: ["R", "Image pipelines", "Manuscript"],
    motion: "wipe",
    segmentWeight: 0.2,
  },
  {
    id: "vrac",
    eyebrow: "Research · VR & safety",
    title: "Evacuation simulation",
    subtitle: "VR Applications Center, Iowa State",
    body:
      "Statistical analysis on experiments testing automated communication strategies in simulated school-shooting evacuations. Co-author on a manuscript in preparation.",
    tags: ["Experimental design", "Inference", "VR studies"],
    motion: "depth",
    /** Longer segment: extra scroll on page 2 before the rail advances to page 3. */
    segmentWeight: 0.3,
  },
  {
    id: "cor-robotics",
    eyebrow: "Teaching · STEM",
    title: "COR Robotics camps",
    subtitle: "Central Iowa · summers 2024–25",
    body:
      "Co-designed curriculum and led hands-on robotics: drone racing, battle drones, and Eureka engineering. Taught 100+ students grades 3–8 with project-based STEM blocks.",
    tags: ["Curriculum", "Drones", "Instruction"],
    motion: "rise",
    segmentWeight: 0.16,
  },
  {
    id: "first",
    eyebrow: "Leadership · FIRST",
    title: "Team Neutrino #3928",
    subtitle: "Co-captain · Story County, IA",
    body:
      "Coordinated seven sub-teams and 40+ members across outreach, fundraising, and operations. Ran the inaugural FLL Blastoff Camp; multiple NASA Engineering Inspiration Awards and Worlds qualifications.",
    tags: ["Operations", "Outreach", "Mentorship"],
    motion: "tilt",
    segmentWeight: 0.19,
  },
  {
    id: "publication",
    eyebrow: "Publication",
    title: "Diagnostic proportion tests",
    subtitle: "Mathematics 2024, 12, 741",
    body:
      "Statistical tests for proportion difference in one-to-two matched binary diagnostic data, with application to environmental Salmonella testing in the U.S.",
    tags: ["GLMs", "Diagnostics", "DOI 10.3390/math12050741"],
    motion: "scan",
    segmentWeight: 0.15,
  },
];

export function workProjectsSegmentWeights(): number[] {
  return WORK_PROJECTS.map((p) => p.segmentWeight);
}

/**
 * Holds effective u steady after slide `dwellAfterSlideIndex` is fully reached so extra scroll
 * “waits” before advancing (e.g. Team Neutrino → publication → handoff).
 */
export function remapHorizontalScrollU(
  u: number,
  weights: number[],
  dwellAfterSlideIndex: number,
  dwellFraction: number,
): number {
  const n = weights.length;
  if (n === 0 || dwellAfterSlideIndex < 0) {
    return u;
  }
  const sum = weights.reduce((a, b) => a + b, 0);
  const w = weights.map((x) => (sum > 0 ? x / sum : 1 / n));
  let acc = 0;
  const last = Math.min(dwellAfterSlideIndex, n - 1);
  for (let i = 0; i <= last; i++) {
    acc += w[i]!;
  }
  const uBoundary = acc;
  const eps = 2e-4;
  const clamped = Math.min(1, Math.max(0, u));
  if (clamped < uBoundary - eps) {
    return clamped;
  }
  if (clamped < uBoundary + dwellFraction) {
    return uBoundary - eps;
  }
  /** Renormalize tail so [uBoundary, 1] still gets full width — avoids rushing/skipping late slides. */
  const tailStart = uBoundary + dwellFraction;
  const tailSpan = Math.max(1 - tailStart, 1e-6);
  const tailT = (clamped - tailStart) / tailSpan;
  return uBoundary + tailT * (1 - uBoundary);
}

/** Map horizontal phase u∈[0,1] to fractional slide index [0, n-1] with non-uniform segment widths + smooth intra-segment ease. */
export function mapHorizontalScrollToSlideIndex(u: number, weights: number[]): number {
  const n = weights.length;
  if (n === 0) {
    return 0;
  }
  const sum = weights.reduce((a, b) => a + b, 0);
  const w = weights.map((x) => (sum > 0 ? x / sum : 1 / n));
  const clamped = Math.min(1, Math.max(0, u));
  if (clamped >= 1) {
    return n - 1;
  }
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const seg = w[i]!;
    const next = acc + seg;
    if (clamped <= next || i === n - 1) {
      const local = seg > 0 ? (clamped - acc) / seg : 1;
      const t = local * local * (3 - 2 * local);
      /** Smoothstep only — avoids powering through the middle of a slide too fast. */
      const eased = t;
      return Math.min(n - 1, i + eased);
    }
    acc = next;
  }
  return n - 1;
}
