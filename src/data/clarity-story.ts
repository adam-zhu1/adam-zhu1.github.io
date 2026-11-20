import type { Story } from "./trueline-story";
import { CLARITY_SITE } from "./clarity";

/**
 * Clarity's page. Every figure here was checked against the project's repo on 19 Nov 2026:
 * its commit history, its spec documents and the desktop app's source. Timings for the
 * explanation and the animation are the team's targets and estimates, and the page says so;
 * no measured latency exists in the repo. Clarity was group work and the commit history does
 * not show who came up with what, so the page speaks as the team ("we") and does not divide
 * the work between people. Adam's instruction, 19 Nov 2026.
 */
export const CLARITY: Story = {
  strip: [
    ["Team", "Four people, built together"],
    ["Built with", "Python, Go, LangGraph, Manim"],
    ["Built at", "HackCMU, September 2026"],
    ["Time", "About 20 hours, first commit to last"],
  ],

  links: [
    { href: CLARITY_SITE, label: "Clarity’s site" },
    { href: "https://github.com/s0hamjain/Clarity", label: "Code" },
  ],

  shots: [
    { src: "/media/clarity/spotlight-typed.webp", cap: "The box that opens after a capture, with a question typed", w: 1360, h: 192 },
    { src: "/media/clarity/result-video.webp", cap: "The result window: the written explanation, then the animation", w: 880, h: 1360 },
  ],

  whyTitle: "Why we built it",
  whyShort: "When you are stuck on a problem set, the videos that exist explain the topic in general, not the problem in front of you, and a chatbot answers with a wall of text. Clarity explains the exact problem on your screen: press a hotkey, drag a box around it, and get a written explanation, then an animation made for that problem.",

  why: [
    "A good visual explanation takes a person about an hour to animate, so they only exist for common problems. What you want at one in the morning is someone to sit next to you and draw this one. Clarity writes the explanation first, then generates and renders an animation for the problem you selected.",
    "It is a desktop app and not a browser extension because an extension only sees one tab. A Mac app sees everything, including PDFs, editors and slides, and because you drag the box yourself, you choose exactly what leaves your machine.",
    "Four of us built it at HackCMU. It has four parts: the Mac app, which is the part you touch, the AI agents that write the explanation and the animation, the sandbox that renders it, and a Go backend that connects them.",
  ],

  /* one per stage of the demo */
  how: [
    { name: "Capture", short: "A global hotkey dims the screen and gives you a crosshair. Drag a box around the problem in any app.", body: "The hotkey is listened for with pynput and the selection uses macOS’s own screen capture, so it behaves like the screenshot tool people already know. The image is scaled down to at most 1,568 pixels on its longest side before it is sent. The glowing edge around the screen was inspired by Apple Intelligence.", fact: ["⌘⇧E", "works in any app: PDFs, editors, slides"] },
    { name: "Ask", short: "A Spotlight-style box opens on the display your cursor is on. Type what is confusing you, or just press Enter.", body: "The box waits for the backend to accept the job before it closes, so a failed submit never loses what you typed. Tutor mode teaches the method and holds back the answer. It is a toggle in the box, sent as a flag with every job.", fact: ["680 × 96", "points, the whole input window"] },
    { name: "Read", short: "Gemini reads the problem off the image and writes a step-by-step explanation. It is shown before any video work starts.", body: "Gemini 3.8 Flash transcribes the problem, then drafts the explanation, critiques it and revises it at most once. It also writes a storyboard of 2 to 5 scenes for the animation. The result window asks the backend for progress once a second.", fact: ["Under 10 s", "the team’s target for the written explanation"] },
    { name: "Watch", short: "Claude writes Manim code for this exact problem, a sandboxed container renders it, and the video plays in the same window.", body: "Claude Sonnet 5 writes one Manim script for the whole storyboard, with the 6 most similar examples retrieved from hand-written samples and the Manim documentation. The render runs in a Docker container with no network, 1 GB of memory and a 120 second limit, and gets up to 3 attempts.", fact: ["60 to 90 s", "the team’s estimate for the animation"] },
  ],

  hard: [
    { name: "Two libraries that both need the main thread",
      sum: "The menu-bar library and the window library each have to own the macOS main thread, so they cannot share a process. We run every window as its own process and pass messages between them as lines of JSON.",
      body: "rumps runs the menu-bar icon and pywebview runs the windows, and both refuse to run anywhere but the main thread. The app starts a copy of itself for each window it opens and talks to it over standard input and output, one JSON object per line. That had a second consequence: two processes writing the same recents file would lose entries, so only the main app process is allowed to write it.",
      changes: [
        { label: "Processes", from: "1", to: "1 per window" },
        { label: "Cost of loading the window library in each", from: "", to: "about 50 ms" },
      ] },
    { name: "A window that would not close",
      sum: "Windows the app closed by itself never exited. macOS only acts on the stop request when its event loop handles another event, and a close made from code produces none. We wake the loop with an empty event.",
      body: "A window you closed by hand went away, but one the app closed stayed alive as a process. pywebview asks the application to stop, and AppKit only acts on that when the run loop handles its next event. Closing from code produces no event, so nothing happened. The fix posts an event that does nothing, which is enough to wake the loop, and a fallback forces the process to exit if it still has not.",
      changes: [
        { label: "Fallback if the loop still does not stop", from: "", to: "forced exit after 1.5 s" },
      ] },
    { name: "It ran from source and broke as an app",
      sum: "Bundled into a .app, three things failed that never failed from source: imports, blank windows and the disk image. macOS also tied permissions to the code signature, so every rebuild asked for Screen Recording again.",
      body: "The entry file was compiled with no parent package, so its imports failed. The window library’s data files were not collected, so every window opened blank. The disk image tool put the wrong folder at its root. Separately, macOS keys the Screen Recording permission to the app’s code signature, and an unsigned build gets a new identity every time, so we signed the build to keep the permission across rebuilds.",
      changes: [
        { label: "Failures that only appeared in the bundle", from: "", to: "3 fixed" },
        { label: "Size of the app and of its disk image", from: "", to: "about 44 MB and 24 MB" },
      ] },
  ],

  stands: [
    ["About 20 hours", "from the first commit to the last, across two days"],
    ["84", "commits on the main branch"],
    ["4 parts", "the Mac app, the AI agents, the render sandbox and the backend"],
    ["3 attempts", "at most for each render, in a container with no network"],
  ],

  next: [
    ["A hosted backend", "Today the app needs its backend running on your own Mac, with Docker and API keys. A public one would let anyone install it and use it."],
    ["Streaming", "The result window asks for progress once a second. A streaming endpoint is specified but not built."],
    ["Narration", "The animation explains with on-screen text. Audio is the next step."],
  ],
};
