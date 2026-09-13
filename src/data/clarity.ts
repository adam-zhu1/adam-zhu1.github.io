/* The facts the Clarity block and page share: links, the accent, and the four steps. */
export const CLARITY_ACCENT = "#589da1";   // lens teal, the secondary in Clarity's own identity standard
export const CLARITY_REPO = "https://github.com/s0hamjain/Clarity";
/* Clarity's own site is where anyone who wants the app goes. This site does not hand out
   the DMG itself: the published build is ad-hoc signed and needs a coordinator you run
   yourself, so a download button here would send a reader to something that cannot work
   for them. The product site owns that job, and its download button stays current. */
export const CLARITY_SITE = "https://clarity-web-black.vercel.app/";

export const CLARITY_STAGES = [
  ["Capture", "⌘⇧E dims the screen. Drag a box around the problem in any app: a PDF, an editor, a slide."],
  ["Ask", "A Spotlight-style box takes the question. Tutor mode teaches the method and holds back the answer."],
  ["Read", "Gemini transcribes the problem and writes a step-by-step explanation. It arrives in seconds."],
  ["Watch", "Claude writes Manim code for this exact problem, a Docker sandbox renders it, and the video plays in the same window."],
] as const;
