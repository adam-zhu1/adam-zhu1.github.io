/** A labeled external link (e.g. GitHub repo, paper, project site) shown as a button. */
export type WorkLink = {
  label: string;
  url: string;
};

export type WorkProject = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  tags: string[];
  /** Optional external links (GitHub, paper, site, …) rendered as buttons below `body`. */
  links?: WorkLink[];
};

/** Resume-aligned highlights (AdamZhu_draft1.pdf). Tweak copy or links anytime. */
export const WORK_PROJECTS: WorkProject[] = [
  {
    id: "csafe",
    eyebrow: "Research · Forensics",
    title: "Camera & handwriting",
    subtitle: "CSAFE, Iowa State — research intern",
    body:
      "Forensic analysis on 24,000+ camera images for device fingerprinting; degraded and compared handwriting samples for similarity datasets. Co-author on work under review in forensic sciences.",
    tags: ["R", "Image pipelines", "Manuscript"],
    links: [{ label: "Center site", url: "https://forensicstats.org/" }],
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
  },
];
