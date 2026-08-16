/** A labeled external link (e.g. GitHub repo, paper, project site) shown as a button. */
export type WorkLink = {
  label: string;
  url: string;
};

/** Y-axis bands for the Work intro project map, top to bottom. */
export const WORK_GRAPH_BANDS = ["Research", "Build", "Teach", "Lead", "Publish"] as const;
export type WorkGraphBand = (typeof WORK_GRAPH_BANDS)[number];

export type WorkProject = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  tags: string[];
  /** Optional external links (GitHub, paper, site, …) rendered as buttons below `body`. */
  links?: WorkLink[];
  /** Position on the Work intro project map. Fractional years land between ticks. */
  graph: { year: number; domain: WorkGraphBand };
};

/** Resume-aligned highlights, reverse-chronological so current work leads. */
export const WORK_PROJECTS: WorkProject[] = [
  {
    id: "nist",
    eyebrow: "Research · NIST",
    title: "Data portal analytics",
    subtitle: "NIST · SURF research intern · Gaithersburg, MD · Summer 2026",
    body:
      "A reproducible five-stage Python pipeline recovering reliable usage metrics for NIST's public data portal: 1.04M requests over 271 days from 117K unique IPs. Per-IP behavioral features feed a behavior-only random forest (F1 = 0.94), and rules built from a disguised scraper it helped catch, one that ran monthly from fresh IPs and spoofed hundreds of browser user-agents, raised the measured automated share of traffic from 21.7% to 41.9%. Also surfaced unmet demand: 21.5% of 109K human searches returned no results, and a query-failure classifier (accuracy 0.88) fed recommendations for NIST's search and dataset-acquisition priorities.",
    tags: ["Python", "pandas", "scikit-learn", "Classification"],
    links: [{ label: "NIST SURF", url: "https://www.nist.gov/surf" }],
    /*
     * Graph years (each point sits mid-tenure):
     * NIST May–Aug 2026 · TrueLine Jan 2026–present · COR summers 2024–25 ·
     * CSAFE Jun 2023–Aug 2024 · paper Mar 2024 · VRAC Jan–Jun 2024 · Neutrino Jun 2021–Jun 2025.
     */
    graph: { year: 2026.3, domain: "Research" },
  },
  {
    id: "trueline",
    eyebrow: "Project · Computer vision",
    title: "TrueLine",
    subtitle: "iOS app · Jan 2026–present · submitted for App Store review, Aug 2026",
    body:
      "Turns one iPhone into a bowling ball tracker: per-throw launch speed, board at the arrows, breakpoint, and entry angle, metrics that otherwise need a $10k+ in-lane installation. A fine-tuned YOLOv8 detector runs on-device via Core ML, with Kalman-filter tracking and Savitzky–Golay smoothing and zero third-party dependencies; a four-corner calibration homography maps any camera angle to true lane coordinates. Verified against the Python/OpenCV prototype clip by clip: board position within ~1 board, launch speed within 1–2%.",
    tags: ["Swift", "SwiftUI", "Core ML", "YOLOv8", "PyTorch", "OpenCV"],
    links: [
      { label: "GitHub", url: "https://github.com/adam-zhu1/trueline" },
      // TODO(adam): add the App Store link when it lands (~Aug 2026):
      // { label: "App Store", url: "https://apps.apple.com/…" },
    ],
    graph: { year: 2026.25, domain: "Build" },
  },
  {
    id: "cor-robotics",
    eyebrow: "Teaching · STEM",
    title: "COR Robotics camps",
    subtitle: "Central Iowa · summers 2024–25",
    body:
      "Co-designed curriculum and led hands-on robotics: drone racing, battle drones, and Eureka engineering. Taught 100+ students grades 3–8 with project-based STEM blocks.",
    tags: ["Curriculum", "Drones", "Instruction"],
    links: [{ label: "Org site", url: "https://corrobotics.com/" }],
    graph: { year: 2024.8, domain: "Teach" },
  },
  {
    id: "csafe",
    eyebrow: "Research · Forensics",
    title: "Camera & handwriting",
    subtitle: "CSAFE, Iowa State · research intern",
    body:
      "Forensic analysis on 24,000+ camera images for device fingerprinting; degraded and compared handwriting samples for similarity datasets. Co-author on a manuscript under review at Forensic Sciences.",
    tags: ["R", "Image pipelines", "Manuscript"],
    links: [{ label: "Center site", url: "https://forensicstats.org/" }],
    graph: { year: 2023.8, domain: "Research" },
  },
  {
    id: "publication",
    eyebrow: "Publication",
    title: "Diagnostic proportion tests",
    subtitle: "Mathematics 2024, 12(5), 741 · second author",
    body:
      "Lin, Zhu & Wang. Statistical tests for proportion difference in one-to-two matched binary diagnostic data, applied to environmental Salmonella testing in the U.S. Joined at the revision stage: manuscript preparation, literature review, consistency checking, and data cleaning.",
    links: [{ label: "DOI", url: "https://doi.org/10.3390/math12050741" }],
    tags: ["Diagnostic testing", "Open access"],
    graph: { year: 2024.2, domain: "Publish" },
  },
  {
    id: "vrac",
    eyebrow: "Research · VR & safety",
    title: "Evacuation simulation",
    subtitle: "VR Applications Center, Iowa State",
    body:
      "Regression models of evacuation time across 454 trials and 227 participants, testing automated communication strategies in simulated school-shooting evacuations. Co-author on a manuscript in preparation.",
    tags: ["Experimental design", "Regression", "VR studies"],
    links: [{ label: "Project page", url: "https://www.vrac.iastate.edu/research/asters/" }],
    graph: { year: 2024.25, domain: "Research" },
  },
  {
    id: "first",
    eyebrow: "Leadership · FIRST",
    title: "Team Neutrino #3928",
    subtitle: "Co-captain · Story County, IA",
    body:
      "Coordinated seven sub-teams and 40+ members across outreach, fundraising, and operations. Ran the inaugural FLL Blastoff Camp; multiple NASA Engineering Inspiration Awards and Worlds qualifications.",
    tags: ["Operations", "Outreach", "Mentorship"],
    links: [{ label: "Team site", url: "https://www.teamneutrino.org/" }],
    graph: { year: 2023.5, domain: "Lead" },
  },
];
