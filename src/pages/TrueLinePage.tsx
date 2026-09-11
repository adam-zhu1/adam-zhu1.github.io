import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Bar } from "../components/Bar";
import { Index, useCurrentSection, type Section } from "../components/Index";
import { Frame } from "../components/Frame";
import { Ambience } from "../components/Ambience";
import { TrueLineStage } from "../components/TrueLineStage";
import { A } from "../lib/router";
import { useReveal, prefersReducedMotion } from "../lib/useReveal";

const SECTIONS: Section[] = [
  { id: "tl-top", label: "TrueLine" },
  { id: "tl-read", label: "The numbers" },
  { id: "tl-hard", label: "Why it's hard" },
  { id: "tl-calib", label: "Calibration" },
  { id: "tl-pipe", label: "The pipeline" },
  { id: "tl-app", label: "The app" },
  { id: "tl-next", label: "What's coming" },
];

const STORE = "https://apps.apple.com/us/app/trueline-bowling-ball-tracker/id6801953797";

/* The nine tiles the shipped app renders. The thirteen-tile list in the handoff brief is
   the unreleased v1.1 set, so Foul Line, Average Speed, Shot Time and Hook Factor are
   deliberately absent. Values are one throw through the analysis pipeline. */
const TILES = [
  { n: "Speed", v: 18.7, u: "mph", d: "Launch speed over the first 6 ft of tracked travel." },
  { n: "Board at Arrows", v: 13.3, u: "board", d: "Where the path first crosses the arrow V, 12 to 16 ft." },
  { n: "Launch Angle", v: 2.8, u: "°", d: "Slope of the first tracked stretch. Positive is toward the gutter." },
  { n: "Entry Board", v: 16.3, u: "board", d: "Tail slope projected to 59.5 ft. Flush pocket is 17.5.", mint: true },
  { n: "Entry Angle", v: 3.9, u: "°", d: "Slope of the smoothed tail at the pins. Steeper carries more.", mint: true },
  { n: "Breakpoint", v: 5.8, u: "board", d: "The furthest right the ball gets before it turns." },
  { n: "Breakpoint Distance", v: 38.6, u: "ft", d: "How far down the lane that happens." },
  { n: "Hook", v: 10.5, u: "boards", d: "Entry board minus breakpoint. The whole back-end move." },
  { n: "vs Target", v: null, u: "", d: "Board at Arrows minus your session target. Only shown once a target is set." },
];

/* Eight frames of the same throw, release to pins. Board and feet are the real values
   the pipeline recorded at each one. */
const STILLS = [
  { f: "f40-t1.30s",  b: 20.1, ft: 2.3 },
  { f: "f50-t1.63s",  b: 15.3, ft: 9.8 },
  { f: "f60-t1.97s",  b: 11.7, ft: 18.0 },
  { f: "f70-t2.30s",  b: 8.0,  ft: 26.8 },
  { f: "f79-t2.60s",  b: 6.5,  ft: 32.0 },
  { f: "f89-t2.93s",  b: 6.2,  ft: 45.2 },
  { f: "f99-t3.27s",  b: 10.7, ft: 52.7 },
  { f: "f109-t3.60s", b: 16.3, ft: 59.6 },
];

const PIPE = [
  ["Capture", "One throw, portrait, 30 fps, from behind the approach. Analysis happens afterwards, not live."],
  ["Detect", "A single-class detector fine-tuned on 215 labeled frames, exported to Core ML at 640 and run through Vision. Candidates outside the lane are thrown away."],
  ["Track", "A constant-velocity Kalman filter joins flickering detections into one ball. The association gate widens during gaps; coasting is capped and blind tails are dropped rather than drawn."],
  ["Map", "The calibration homography turns every sample into a board and a distance, so each metric is a lane measurement and not a pixel measurement."],
  ["Read", "Savitzky-Golay smoothing, interpolated crossings for timing, least-squares slopes for angles, and the tail projected to 59.5 ft for entry board."],
];

const APPFLOW = [
  ["01", "09-onboarding-setup", "Set up", "Where to put the phone."],
  ["02", "10-onboarding-hand", "Pick a hand", "The pocket diagram mirrors as you choose."],
  ["03", "01-home-hero", "Home", "Last session's lines, and one button."],
  ["04", "05-shot-result-lane", "Result", "The path, top down, on the lane."],
  ["05", "06-shot-result-tiles", "Numbers", "The metric tiles for that throw."],
  ["06", "02-history", "History", "Every throw, grouped into sessions."],
  ["07", "03-session-consistency", "Consistency", "How tight the session was."],
  ["08", "07-stats", "Stats", "Aggregates across sessions."],
];

const COMING = [
  ["Guided calibration", "Six tapped landmarks instead of four dragged corners, with a lane diagram showing each target, then the fitted lane drawn back over the footage so you can check it against the real pins before you trust anything."],
  ["A drift check on every throw", "The session's calibration redrawn on each new clip. If the phone got bumped between throws, you see it rather than quietly getting worse numbers."],
  ["More of the throw reported", "Foul line position, average speed over the whole flight, shot time, and how hard the ball turns through the hook."],
  ["Zoom-aware capture", "Lens selection at record time, and a calibration that knows which zoom it was placed at. The pin deck is about 90 px wide at 1x, so this matters more than it sounds."],
];

export default function TrueLinePage() {
  const cur = useCurrentSection(SECTIONS, "tl-top");
  const [revealed, setRevealed] = useState(prefersReducedMotion());

  const readRef = useReveal<HTMLDivElement>({ threshold: 0.3 });
  const hardRef = useReveal<HTMLDivElement>({ threshold: 0.3 });
  const calibRef = useReveal<HTMLDivElement>({ threshold: 0.3 });
  const pipeRef = useReveal<HTMLDivElement>({ threshold: 0.25 });
  const appRef = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const nextRef = useReveal<HTMLDivElement>({ threshold: 0.25 });
  const endRef = useReveal<HTMLDivElement>({ threshold: 0.3 });

  /* the page owns mint outright — it is TrueLine's colour, and this is TrueLine's page */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", "#40e69e");
    scrollTo(0, 0);
    const t = setTimeout(() => setRevealed(true), 600);
    return () => { clearTimeout(t); root.style.setProperty("--accent", "#f4f4f2"); };
  }, []);

  /* the wipe: drag across the frame to sweep the solved lane over the raw footage */
  const wipe = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = wipe.current;
    if (!el) return;
    const set = (clientX: number) => {
      const r = el.getBoundingClientRect();
      const pct = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
      el.style.setProperty("--w", pct.toFixed(1) + "%");
    };
    let down = false;
    const start = (e: PointerEvent) => { down = true; set(e.clientX); };
    const move = (e: PointerEvent) => { if (down || e.pointerType === "mouse") set(e.clientX); };
    const end = () => { down = false; };
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointermove", move);
    // once a drag starts it follows the pointer off the figure, the way a slider does
    const drag = (e: PointerEvent) => { if (down) set(e.clientX); };
    addEventListener("pointermove", drag);
    addEventListener("pointerup", end);
    addEventListener("pointercancel", end);
    return () => {
      el.removeEventListener("pointerdown", start);
      el.removeEventListener("pointermove", move);
      removeEventListener("pointermove", drag);
      removeEventListener("pointerup", end);
      removeEventListener("pointercancel", end);
    };
  }, []);

  return (
    <>
      <Ambience active={revealed} />
      <Index sections={SECTIONS} cur={cur} />
      <Bar home={false} />

      <main className="site tlpage">
        <div className="wrap">

          {/* ---------- the sequence ---------- */}
          <section className="sec tlhero" id="tl-top">
            <div className="tlmast">
              <A className="up" href="/#projects"><i aria-hidden="true">&#8592;</i> The work</A>
              <h1>TrueLine</h1>
              <p className="desc">
                A bowling ball tracker for iPhone. Prop the phone behind the approach, bowl, and it
                measures the throw: where the ball crossed the arrows, where it hooked, how fast it
                left your hand, and the board and angle it entered on. Everything runs on the phone.
              </p>
              <div className="tlmeta">
                <div><dt>Platform</dt><dd>iOS, iPhone, portrait</dd></div>
                <div><dt>Built with</dt><dd>Swift, Vision, Core ML, a fine-tuned detector</dd></div>
                <div><dt>Released</dt><dd>App Store, 24 August 2026</dd></div>
              </div>
              <a className="store" href={STORE}>Download on the App Store<i aria-hidden="true">&#8599;</i></a>
            </div>
            <TrueLineStage />
          </section>

          {/* ---------- the numbers ---------- */}
          <section className="sec" id="tl-read">
            <div className="tlhead in" ref={readRef}>
              <h2>What it gives you back</h2>
              <p>Nine measurements from one throw. Every one is a lane measurement — a board and a
                distance — not a number about pixels.</p>
            </div>
            <div className="tiles">
              {TILES.map(t => (
                <div className={`tile${t.mint ? " lit" : ""}${t.v === null ? " off" : ""}`} key={t.n}>
                  <small>{t.n}</small>
                  <b>{t.v === null ? "—" : t.v.toFixed(1)}<em>{t.u}</em></b>
                  <p>{t.d}</p>
                </div>
              ))}
            </div>
            <p className="tlnote">
              One throw, run end to end through the analysis pipeline. Entry board 16.3 against a flush
              pocket of 17.5, so this one came in about a board light. 70 tracked frames, 2.3 to 59.6 ft.
            </p>
          </section>

          {/* ---------- why it's hard ---------- */}
          <section className="sec" id="tl-hard">
            <div className="tlhead in" ref={hardRef}>
              <h2>Why this is hard</h2>
              <p>A lane is 60 feet long and 41.5 inches wide, and the camera sits at one end of it.
                By the time the ball reaches the pins it is a handful of pixels crossing polished wood
                that reflects everything in the building.</p>
            </div>
            <Frame className="strip" seed={2} tag="one throw · eight frames"
                   label={<><b>2.3</b> to <b>59.6</b> ft · release to pins</>}>
              <div className="stills">
                {STILLS.map((s, i) => (
                  <figure key={s.f} style={{ "--i": i } as CSSProperties}>
                    <img src={`/media/trueline/throw/${s.f}.jpg`} width={420} height={780} loading="lazy"
                         alt={`The ball at board ${s.b}, ${s.ft} feet down the lane`} />
                    <figcaption><b>{s.ft}</b> ft<span>board {s.b}</span></figcaption>
                  </figure>
                ))}
              </div>
            </Frame>
            <div className="facts3">
              <div><b>~90 px</b><span>the whole pin deck, in 1080p footage at 1x</span></div>
              <div><b>~2.3 px</b><span>one board at the far end. A board is 1.06 inches.</span></div>
              <div><b>20–50 px</b><span>the ball, depending how far down the lane it is</span></div>
            </div>
          </section>

          {/* ---------- calibration ---------- */}
          <section className="sec" id="tl-calib">
            <div className="tlhead in" ref={calibRef}>
              <h2>Calibration</h2>
              <p>The phone can sit anywhere. Nothing in the footage tells the app how the lane is
                positioned, so every throw starts by pinning the picture to the real world.</p>
            </div>
            <div className="calib">
              <div className="calibtext">
                <p>On a frozen frame from the clip you just shot, you drag four handles onto the lane's
                  four corners: the foul line at each gutter, and the pin deck at each gutter. A loupe
                  magnifies under your finger while you drag, because at the far end you are placing a
                  handle inside a couple of pixels.</p>
                <p>Those four points are enough to solve the homography — the transform that turns any
                  pixel in the frame into a board number and a distance down the lane. Everything the
                  app reports afterwards is measured in that space, which is why the numbers survive the
                  phone being in a slightly different spot every time.</p>
                <p className="tlnote">
                  A new calibration flow is being built. It's described at the bottom of this page.
                </p>
              </div>
              <Frame className="calibfig" seed={1} tag="the lane, solved"
                     label={<><b>39</b> boards · <b>60</b> ft foul line to pins</>}>
                <figure className="wipe" ref={wipe}>
                  <img src="/media/trueline/lane/calib-clean.jpg" width={938} height={2050} loading="lazy"
                       alt="A frame from the throw, before the lane geometry is drawn on it" />
                  <img className="over" src="/media/trueline/lane/calib-overlay.jpg" width={938} height={2050} loading="lazy"
                       alt="The same frame with the solved lane drawn back over it: gutters, board seams, the arrows, and a ring on every pin spot" />
                  <figcaption>Drag to check the fit</figcaption>
                </figure>
              </Frame>
            </div>
          </section>

          {/* ---------- the pipeline ---------- */}
          <section className="sec" id="tl-pipe">
            <div className="tlhead in" ref={pipeRef}>
              <h2>What happens to a throw</h2>
              <p>Five stages, all of them on the phone. Nothing is uploaded anywhere.</p>
            </div>
            <ol className="pipe">
              {PIPE.map(([name, note], i) => (
                <li key={name}><span className="k">{String(i + 1).padStart(2, "0")}</span>
                  <span><b>{name}</b><em>{note}</em></span></li>
              ))}
            </ol>
          </section>

          {/* ---------- the app ---------- */}
          <section className="sec" id="tl-app">
            <div className="tlhead in" ref={appRef}>
              <h2>The app</h2>
              <p>Record a throw, place the lane, read the result, keep the session. In that order,
                every time.</p>
            </div>
            <div className="flow">
              {APPFLOW.map(([n, file, title, note]) => (
                <figure key={n}>
                  <span className="k">{n}</span>
                  <div className="ph">
                    <img src={`/media/trueline/app/${file}.jpg`} width={660} height={1434} loading="lazy" alt={`${title}: ${note}`} />
                  </div>
                  <figcaption><b>{title}</b><span>{note}</span></figcaption>
                </figure>
              ))}
            </div>
          </section>

          {/* ---------- what's coming ---------- */}
          <section className="sec" id="tl-next">
            <div className="tlhead in" ref={nextRef}>
              <h2>What I'm working on</h2>
              <p>The next version is in progress. No date — it ships when the accuracy work behind it
                is finished and checked against real throws.</p>
            </div>
            <div className="coming">
              {COMING.map(([title, note]) => (
                <div key={title}><b>{title}</b><p>{note}</p></div>
              ))}
            </div>
          </section>

          {/* ---------- out ---------- */}
          <section className="sec tlend" ref={endRef}>
            <div className="in">
              <h2>Free to try, ten throws in.</h2>
              <p>Download it, shoot a throw, see what your ball actually does. A one-time unlock removes
                the limit.</p>
              <a className="store big" href={STORE}>Download on the App Store<i aria-hidden="true">&#8599;</i></a>
            </div>
            <footer className="in">
              <A href="/#projects">&#8592; Back to the work</A>
              <span>Adam Zhu, Pittsburgh</span>
            </footer>
          </section>

        </div>
      </main>
    </>
  );
}
