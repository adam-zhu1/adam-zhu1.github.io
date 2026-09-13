import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Bar } from "../components/Bar";
import { Index, useCurrentSection, type Section } from "../components/Index";
import { Ambience } from "../components/Ambience";
import { ClarityStage } from "../components/ClarityStage";
import { ClarityPipeline } from "../components/ClarityPipeline";
import { CLARITY_ACCENT, CLARITY_REPO, CLARITY_SITE } from "../data/clarity";
import { A } from "../lib/router";
import { land, LANDED, morphPending } from "../lib/morph";
import { useEachReveal, useReveal, prefersReducedMotion } from "../lib/useReveal";

const SECTIONS: Section[] = [
  { id: "cl-top", label: "Clarity" },
  { id: "cl-seq", label: "One capture" },
  { id: "cl-pipe", label: "The pipeline" },
  { id: "cl-agents", label: "Three agents" },
  { id: "cl-desk", label: "The Mac app" },
  { id: "cl-team", label: "The team" },
  { id: "cl-get", label: "Get it" },
];

const AGENTS = [
  ["Intake", "/vision", "Gemini 3.8 Flash, temperature 0",
   "One step, no loop. Reads the screenshot and the typed question together and returns the problem text verbatim, a category, and a confidence. Deterministic output is what makes the cache key stable."],
  ["Explainer", "/explain", "Gemini 3.8 Flash",
   "Draft, critique, revise. The draft is a step-by-step explanation and a two-to-five-beat storyboard; a second pass grades it against a rubric and revises at most once. Tutor mode is checked in the critique, not trusted from the draft."],
  ["Manim Generator", "/render", "Claude Sonnet 5 · Voyage · Atlas Vector Search",
   "Retrieve, generate, lint, render, repair. Three verified examples are retrieved before a line is written; a static check runs before Docker; a crash goes back with the traceback and fresh retrieval, at most three attempts. Code that renders is ingested back into the corpus."],
];

/* the Mac app: what it does and the decisions behind it, with the number each rests on */
const DESK = [
  { n: "1 s", u: "poll", t: "Render the explanation the moment it is non-null", d: "The result box polls the job once a second and gives up at 180 s. Whatever the status says, the explanation shows the instant it exists, and a job that finishes without a video keeps the explanation and adds one quiet line." },
  { n: "50", u: "recents", t: "Every capture is written to disk before the request goes out", d: "The last fifty live in Application Support with the question, the explanation and the video URL. If the server is gone tomorrow, hotkey, Esc, down arrow, Enter reopens yesterday's result from local data." },
  { n: "1", u: "process per window", t: "Every window is its own process", d: "The menu-bar library and the web-view library both want the macOS main thread, so the app re-spawns itself per window and talks over one JSON line per message. A crashed window takes nothing else with it." },
  { n: "2", u: "permissions", t: "Screen Recording and Input Monitoring, each followed by a relaunch", d: "macOS keys both to the app's code signature, so an unsigned build would ask again after every rebuild. The build script signs with one stable identity and the designated requirement is byte-identical across builds." },
  { n: "1568 px", u: "max side", t: "The region you chose is all that leaves the machine", d: "The capture is downscaled to 1568 px on its longest side and sent as a PNG under 8 MB. No accounts, no cloud sync, no keys in the app." },
  { n: "5,779", u: "lines", t: "The whole desktop directory", d: "Python for the menu bar, hotkey, capture, recents and the window host; HTML, CSS and JS for the two windows; shell for the app bundle and the DMG." },
];

const SHOTS = [
  ["01", "spotlight-rest", "The spotlight box", "Thumbnail of the capture, one field, Tutor or Answer, two keycaps.", "wide"],
  ["02", "spotlight-typed", "The question", "Typing is optional. Enter sends; Esc cancels; ↓ lists the recents.", "wide"],
  ["03", "result-status", "Working", "One dial and one line of live status. Never a blank window.", "tall"],
  ["04", "result-explanation", "The explanation first", "Rendered from markdown the moment it exists, while the render continues.", "tall"],
  ["05", "result-video", "The video", "Plays in the same window. Pop out, full screen, or drag the file out to save it.", "tall"],
];

const TEAM = [
  { name: "Akshath Sivachidhambaram", role: "AI agents", dir: "agent/", href: "https://github.com/Marvel201213" },
  { name: "Soham Jain", role: "Render sandbox and samples", dir: "docker/ samples/", href: "https://github.com/s0hamjain" },
  { name: "Saye Vikram", role: "Coordinator and release", dir: "server/ release/", href: "https://github.com/SayeVikram" },
  { name: "Adam Zhu", role: "Desktop app and installer", dir: "desktop/", href: "https://github.com/adam-zhu1", me: true },
];

const STACK = [
  ["Desktop", "Python 3.13, rumps, pywebview, pynput, Pillow, PyInstaller"],
  ["Coordinator", "Go, net/http, mongo-driver, AWS SDK"],
  ["Agents", "Python, FastAPI, LangGraph, LangChain, Pydantic"],
  ["Models", "Gemini 3.8 Flash, Claude Sonnet 5, Voyage voyage-code-3"],
  ["Data", "MongoDB Atlas with Vector Search, S3 or MinIO"],
  ["Render", "Docker, Manim Community, LaTeX, ffmpeg"],
];

export default function ClarityPage() {
  const cur = useCurrentSection(SECTIONS, "cl-top");
  const [revealed, setRevealed] = useState(prefersReducedMotion());
  const [morphing] = useState(morphPending);
  const [ready, setReady] = useState(prefersReducedMotion());
  const title = useRef<HTMLHeadingElement>(null);

  const seqRef = useReveal<HTMLDivElement>({ threshold: 0.4 });
  const pipeRef = useReveal<HTMLDivElement>({ threshold: 0.4 });
  const agentsRef = useReveal<HTMLDivElement>({ threshold: 0.4 });
  const deskRef = useReveal<HTMLDivElement>({ threshold: 0.4 });
  const teamRef = useReveal<HTMLDivElement>({ threshold: 0.4 });
  const endRef = useReveal<HTMLDivElement>({ threshold: 0.35 });

  const agentListRef = useEachReveal<HTMLDivElement>({ threshold: 0.3, stagger: 90 });
  const deskListRef = useEachReveal<HTMLDivElement>({ threshold: 0.3, stagger: 80 });
  const shotsRef = useEachReveal<HTMLDivElement>({ threshold: 0.25 });
  const teamListRef = useEachReveal<HTMLDivElement>({ threshold: 0.3, stagger: 90 });
  const stackRef = useEachReveal<HTMLDListElement>({ threshold: 0.3, stagger: 60 });

  /* the landing half of the morph: the flying name is handed to the real heading here */
  useLayoutEffect(() => {
    scrollTo(0, 0);
    const flying = title.current ? land(title.current) : false;
    const t = setTimeout(() => setReady(true), flying ? LANDED : 90);
    return () => clearTimeout(t);
  }, []);

  /* the page owns lens teal outright, the way TrueLine's page owns mint */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", CLARITY_ACCENT);
    const t = setTimeout(() => setRevealed(true), 600);
    return () => { clearTimeout(t); root.style.setProperty("--accent", "#f4f4f2"); };
  }, []);

  return (
    <>
      <Ambience active={revealed} />
      <Index sections={SECTIONS} cur={cur} />
      <Bar home={false} />

      <main className="site tlpage clpage">
        <div className="wrap">

          {/* ---------- the title screen ---------- */}
          <section className={`sec tlhero${ready ? " on" : ""}`} id="cl-top">
            <div className="tlmast">
              <A className="up in" href="/#clarity"><i aria-hidden="true">&#8592;</i> The work</A>
              <h1 ref={title} className={ready ? "" : morphing ? "handoff" : "pre"}>Clarity</h1>
              <i className="tlrule in" aria-hidden="true" />
              <p className="desc in">A macOS menu-bar app that explains any problem on your screen.</p>
              <div className="tlmeta in">
                <div><dt>Platform</dt><dd>macOS 14 or later, menu bar only</dd></div>
                <div><dt>Built with</dt><dd>Python, pywebview, Go, LangGraph, Manim, Docker</dd></div>
                <div><dt>Built</dt><dd>HackCMU, 11 to 12 September 2026. Four people, 84 commits</dd></div>
                <div><dt>My part</dt><dd>The desktop app: menu bar, hotkey, capture, the two windows, recents, the installer</dd></div>
              </div>
              <div className="clhero-links in">
                <a className="store" href={CLARITY_SITE}>Clarity&rsquo;s site<i aria-hidden="true">&#8599;</i></a>
                <a className="store" href={CLARITY_REPO}>GitHub<i aria-hidden="true">&#8599;</i></a>
              </div>
            </div>
            <a className="cue in" href="#cl-seq">
              <span>One capture, hotkey to video</span>
              <i aria-hidden="true" />
            </a>
          </section>

          {/* ---------- the sequence ---------- */}
          <section className="sec" id="cl-seq">
            <div className="tlhead in" ref={seqRef}>
              <h2>One capture, hotkey to video</h2>
              <p>Press ⌘⇧E on anything on the screen, drag a box around the problem, type what is
                confusing you or don't, and press Enter. The written explanation arrives in seconds. An
                animation made for that exact problem plays in the same window about a minute later.</p>
            </div>
            <ClarityStage />
            <p className="tlnote">
              Rebuilt from the app's own window code at the app's own sizes and timings, not footage. The
              explanation and the animation are illustrative, and the clock is compressed: the real
              explanation takes seconds and the real render sixty to ninety seconds.
            </p>
          </section>

          {/* ---------- the pipeline ---------- */}
          <section className="sec" id="cl-pipe">
            <div className="tlhead in" ref={pipeRef}>
              <h2>What happens to a capture</h2>
              <p>Four services meeting at HTTP boundaries, each with one job. The desktop app captures and
                displays. The coordinator owns the job and never calls a model. The agent service does all
                the thinking. The sandbox turns Manim source into an MP4.</p>
            </div>
            <ClarityPipeline />
          </section>

          {/* ---------- the agents ---------- */}
          <section className="sec" id="cl-agents">
            <div className="tlhead in" ref={agentsRef}>
              <h2>Three agents, three bounded loops</h2>
              <p>Every model call happens in one of three LangGraph graphs. Every loop has a counter and a
                hard cap, so a graph can never spin.</p>
            </div>
            <div className="clagents" ref={agentListRef}>
              {AGENTS.map(([name, route, model, note]) => (
                <div key={name}>
                  <span className="k">{route}</span>
                  <b>{name}</b>
                  <small>{model}</small>
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ---------- the desktop app ---------- */}
          <section className="sec" id="cl-desk">
            <div className="tlhead in" ref={deskRef}>
              <h2>The Mac app</h2>
              <p>My part. Everything the user sees and installs: the menu-bar icon, the global hotkey, the
                region capture, the spotlight box, the result box, the recents list, and the signed app in
                a DMG.</p>
            </div>
            <div className="flow clshots" ref={shotsRef}>
              {SHOTS.map(([n, file, t, note, shape]) => (
                <figure key={n} className={shape}>
                  <span className="k">{n}</span>
                  <div className="ph">
                    <img src={`/media/clarity/app/${file}.png`} loading="lazy" alt={`${t}: ${note}`}
                         width={shape === "wide" ? 1360 : 880} height={shape === "wide" ? 192 : 1360} />
                  </div>
                  <figcaption><b>{t}</b><span>{note}</span></figcaption>
                </figure>
              ))}
            </div>
            <div className="cldesk" ref={deskListRef}>
              {DESK.map(d => (
                <div key={d.t}>
                  <b>{d.n}<em>{d.u}</em></b>
                  <strong>{d.t}</strong>
                  <p>{d.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ---------- the team ---------- */}
          <section className="sec" id="cl-team">
            <div className="tlhead in" ref={teamRef}>
              <h2>Four people, one directory each</h2>
              <p>The HTTP contracts were written first, every role faked its dependencies from the first hour,
                and the four directories merged in a fixed order at each sprint's end. Nobody waited on
                anybody.</p>
            </div>
            <div className="clteam" ref={teamListRef}>
              {TEAM.map(m => (
                <a key={m.name} className={m.me ? "me" : ""} href={m.href}>
                  <b>{m.name}{m.me && <i>me</i>}</b>
                  <span>{m.role}</span>
                  <small>{m.dir}</small>
                </a>
              ))}
            </div>
            <dl className="clstack" ref={stackRef}>
              {STACK.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </section>

          {/* ---------- out ---------- */}
          <section className="sec tlend" id="cl-get" ref={endRef}>
            <div className="in">
              <h2>Go and get it.</h2>
              <p>Clarity has its own site, with the download and the install steps. The source for
                all four parts is one repository.</p>
              <p className="tlnote">The app is the front of a stack you run yourself: a coordinator, an
                agent service, a render sandbox, MongoDB Atlas and Docker. The repository&rsquo;s setup
                guide covers all of it.</p>
              <div className="clhero-links">
                <a className="store big" href={CLARITY_SITE}>Clarity&rsquo;s site<i aria-hidden="true">&#8599;</i></a>
                <a className="store big" href={CLARITY_REPO}>Source on GitHub<i aria-hidden="true">&#8599;</i></a>
              </div>
            </div>
            <footer className="in">
              <A href="/#clarity">&#8592; Back to the work</A>
              <span>Adam Zhu, Pittsburgh</span>
            </footer>
          </section>

        </div>
      </main>
    </>
  );
}
