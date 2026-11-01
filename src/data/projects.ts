import { CLARITY_ACCENT } from "./clarity";

/* The projects on the stage, in order, each with its own colour. */
export type Project = { id: string; name: string; accent: string };

export const PROJECTS: Project[] = [
  { id: "p-trueline", name: "TrueLine", accent: "#40e69e" },
  { id: "p-clarity", name: "Clarity", accent: CLARITY_ACCENT },
  { id: "p-nist", name: "NIST", accent: "#8fa8f0" },
];
