/** Main sections (side nav + top nav). Work is a single entry even though it holds the project rail. */
export const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "connect", label: "Contact" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

/** Section ids that are valid `#hash` deep-link targets (used by App on initial load). */
export const SECTION_IDS = SECTIONS.map((s) => s.id) as readonly SectionId[];
