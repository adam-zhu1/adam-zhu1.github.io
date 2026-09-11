import { useCallback, useEffect, useRef, useState } from "react";
import { Frame } from "./Frame";
import { useCentered } from "../lib/useReveal";
import { createTrueLine } from "../lib/trueline";

const STAGES = [
  ["Track", "A detector finds the ball in every frame; a Kalman filter joins the detections into one path."],
  ["Calibrate", "Four corners fix the lane in the frame. The lane is drawn back onto the footage to prove the fit."],
  ["Translate", "Lane and path leave the video and settle into the app's plan view."],
  ["Read", "This throw entered at board 16.3, a shade right of the pocket."],
] as const;

/**
 * The same sequence the home page runs, given the room a whole page can spare: the stage
 * legend sits beside the window instead of under it, and the numbers get their own row.
 * One engine, one dataset — only the frame around it changes.
 */
export function TrueLineStage() {
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
  const centreRef = useCentered<HTMLDivElement>(play, 420);

  return (
    <div className="tlstage" ref={centreRef}>
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

      <div className="tlside">
        <div className="stages"><div ref={steps}>
          {STAGES.map(([name, note], i) => (
            <div className="step" key={name}><span className="n">{i + 1}</span><span><b>{name}</b><em>{note}</em></span></div>
          ))}
        </div></div>
        <div className="ctl">
          <button type="button" onClick={play}>Replay</button>
          <button type="button" onClick={() => setPaused(engine.current?.toggle() ?? false)}>{paused ? "Resume" : "Pause"}</button>
        </div>
      </div>

      <div className="nums" ref={nums} />
    </div>
  );
}
