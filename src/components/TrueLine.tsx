import { useCallback, useEffect, useRef, useState } from "react";
import { Frame } from "./Frame";
import { useCentered, useReveal } from "../lib/useReveal";
import { createTrueLine } from "../lib/trueline";

const STAGES = [
  ["Track", "A detector finds the ball in every frame; a Kalman filter joins the detections into one path."],
  ["Calibrate", "Six landmarks fix the lane in the frame. The lane is drawn back onto the footage to prove the fit."],
  ["Translate", "Lane and path leave the video and settle into the app's plan view."],
  ["Read", "Thirteen metrics. This throw entered at board 16.3, just right of the pocket."],
] as const;

export function TrueLine() {
  const vid = useRef<HTMLVideoElement>(null);
  const ov = useRef<SVGSVGElement>(null);
  const steps = useRef<HTMLDivElement>(null);
  const capL = useRef<HTMLSpanElement>(null);
  const capR = useRef<HTMLSpanElement>(null);
  const nums = useRef<HTMLDivElement>(null);
  const engine = useRef<ReturnType<typeof createTrueLine> | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!vid.current || !ov.current || !steps.current || !capL.current || !capR.current || !nums.current) return;
    engine.current = createTrueLine({
      vid: vid.current, ov: ov.current, steps: steps.current,
      capL: capL.current, capR: capR.current, nums: nums.current,
    });
    return () => engine.current?.stop();
  }, []);

  const play = useCallback(() => { engine.current?.run(); setPaused(false); }, []);
  /* the sequence starts only once the window is centred, never at the edge of the screen */
  const centreRef = useCentered<HTMLDivElement>(play, 500);
  const textRef = useReveal<HTMLDivElement>();
  const stagesRef = useReveal<HTMLDivElement>();

  return (
    <div className="proj" id="trueline">
      <div className="in" ref={textRef}>
        <h3>TrueLine<i className="swipe" /></h3>
        <p className="desc">
          A bowling ball tracker for iPhone. Prop the phone behind the approach, bowl, and it measures
          the throw: where the ball crossed the arrows, where it hooked, how fast it left your hand, and
          the board and angle it entered on. Everything runs on the phone.
        </p>
        <dl className="facts">
          <div><dt>For</dt><dd>League bowlers and coaches</dd></div>
          <div><dt>Built with</dt><dd>Swift, Vision, Core ML, a fine-tuned detector</dd></div>
          <div><dt>Since</dt><dd><a href="https://apps.apple.com/us/app/trueline-bowling-ball-tracker/id6801953797">App Store</a>, 24 August 2026</dd></div>
        </dl>
        <a className="store" href="https://apps.apple.com/us/app/trueline-bowling-ball-tracker/id6801953797">
          Download on the App Store<i aria-hidden="true">&#8599;</i>
        </a>
        <div className="ctl">
          <button type="button" onClick={play}>Replay</button>
          <button type="button" onClick={() => setPaused(engine.current?.toggle() ?? false)}>{paused ? "Resume" : "Pause"}</button>
        </div>
      </div>

      <div ref={centreRef}>
        <Frame className="appwin" seed={1} tag="01 TrueLine" label={<><b>70</b> tracked frames · 2.3 to 59.6 ft</>}>
          <div className="app">
            <video ref={vid} muted playsInline preload="metadata" poster="/media/trueline-poster.jpg"
                   aria-label="A bowling throw, tracked frame by frame">
              <source src="/media/trueline-throw.webm" type="video/webm" />
              <source src="/media/trueline-throw.mp4" type="video/mp4" />
            </video>
            <svg ref={ov} viewBox="0 0 560 560" preserveAspectRatio="none" aria-hidden="true" />
          </div>
          <div className="cap"><span ref={capL}>Run-up</span><span ref={capR}><b>Frame 1</b> of 131</span></div>
        </Frame>
        <div className="nums" ref={nums} />
      </div>

      <div className="stages in" ref={stagesRef}>
        <div ref={steps}>
          {STAGES.map(([name, note], i) => (
            <div className="step" key={name}><span className="n">{i + 1}</span><span><b>{name}</b><em>{note}</em></span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
