/* The facts the Clarity block and page share: links, the accent, and the four steps. */
export const CLARITY_ACCENT = "#589da1";   // lens teal, the secondary in Clarity's own identity standard
export const CLARITY_REPO = "https://github.com/s0hamjain/Clarity";
export const CLARITY_DMG = "https://github.com/s0hamjain/Clarity/releases/download/v1.0.0/Clarity.dmg";
export const CLARITY_SITE = "https://clarity-web-black.vercel.app/";

export const CLARITY_STAGES = [
  ["Capture", "⌘⇧E dims the screen. Drag a box around the problem in any app: a PDF, an editor, a slide."],
  ["Ask", "A Spotlight-style box takes the question. Tutor mode teaches the method and holds back the answer."],
  ["Read", "Gemini transcribes the problem and writes a step-by-step explanation. It arrives in seconds."],
  ["Watch", "Claude writes Manim code for this exact problem, a Docker sandbox renders it, and the video plays in the same window."],
] as const;
