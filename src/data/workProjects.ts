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

/** Resume-aligned highlights (AdamZhu_draft1.pdf). Tweak copy or links anytime. */
export const WORK_PROJECTS: WorkProject[] = [
  {
    id: "trueline",
    eyebrow: "Project · Computer vision",
    title: "TrueLine",
    subtitle: "Self-built · bowling analytics from a phone",
    body:
      "Turns a single side-mounted phone video into per-shot metrics — ball speed, board at the arrows, breakpoint, and entry angle — with no lane hardware. A six-click homography maps pixels to true lane coordinates; the ball is found with background subtraction, Hough circles, and an optional YOLOv8 model, then tracked through motion blur with a Kalman filter.",
    tags: ["Python", "OpenCV", "Computer vision", "YOLOv8", "Kalman filter"],
    links: [{ label: "GitHub", url: "https://github.com/adam-zhu1/trueline" }],
    // TODO(adam): verify the years below — they set each point's x-position on the map.
    graph: { year: 2026, domain: "Build" },
  },
  {
    id: "csafe",
    eyebrow: "Research · Forensics",
    title: "Camera & handwriting",
    subtitle: "CSAFE, Iowa State — research intern",
    body:
      "Forensic analysis on 24,000+ camera images for device fingerprinting; degraded and compared handwriting samples for similarity datasets. Co-author on work under review in forensic sciences.",
    tags: ["R", "Image pipelines", "Manuscript"],
    links: [{ label: "Center site", url: "https://forensicstats.org/" }],
    graph: { year: 2024, domain: "Research" },
  },
  {
    id: "vrac",
    eyebrow: "Research · VR & safety",
    title: "Evacuation simulation",
    subtitle: "VR Applications Center, Iowa State",
    body:
      "Statistical analysis on experiments testing automated communication strategies in simulated school-shooting evacuations. Co-author on a manuscript in preparation.",
    tags: ["Experimental design", "Inference", "VR studies"],
    links: [{ label: "Project page", url: "https://www.vrac.iastate.edu/research/asters/" }],
    graph: { year: 2023, domain: "Research" },
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
    graph: { year: 2024.5, domain: "Teach" },
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
    graph: { year: 2023, domain: "Lead" },
  },
  {
    id: "publication",
    eyebrow: "Publication",
    title: "Diagnostic proportion tests",
    subtitle: "Mathematics 2024, 12, 741",
    body:
      "Statistical tests for proportion difference in one-to-two matched binary diagnostic data, with application to environmental Salmonella testing in the U.S.",
    links: [{ label: "Read paper", url: "https://www.mdpi.com/2227-7390/12/5/741" }],
    tags: ["GLMs", "Diagnostics", "Open access"],
    graph: { year: 2024, domain: "Publish" },
  },
];
