import { useCallback, useEffect, useRef, useState } from "react";
import { Frame } from "./Frame";
import { usePlayInView } from "../lib/useReveal";
import { createTrueLine } from "../lib/trueline";
import { say } from "../lib/live";

const STAGES = [
  ["Track", "A detector finds the ball in every frame; a Kalman filter joins the detections into one path."],
  ["Calibrate", "The lane is fixed in the frame, then drawn back onto the footage to prove the fit."],
  ["Map", "Lane and path leave the video and settle into the app's plan view."],
  ["Read", "The measurements. This throw entered at board 16.3, just right of the pocket."],
] as const;

/**
 * TrueLine's demo on the hub: one tracked throw, played as the four stages of the pipeline.
 * The words about the app live with the project list; this is only the thing it does.
 * `held` keeps it paused while another project has the stage.
 */
export function TrueLine({ held = false, stage = null, loop = false, onStage, at }: { held?: boolean; stage?: number | null; loop?: boolean; onStage?: (i: number) => void; at?: { i: number } | null }) {
  const told = useRef(onStage);
  useEffect(() => { told.current = onStage; }, [onStage]);
  const vid = useRef<HTMLVideoElement>(null);
  const ov = useRef<SVGSVGElement>(null);
  const steps = useRef<HTMLDivElement>(null);
  const capL = useRef<HTMLSpanElement>(null);
  const capR = useRef<HTMLSpanElement>(null);
  const nums = useRef<HTMLDivElement>(null);
  const engine = useRef<ReturnType<typeof createTrueLine> | null>(null);
  const [paused, setPaused] = useState(false);

  // while another project has the stage, this demo has nothing to say
  const heldRef = useRef(held);
  const saying = useRef<string | null>(null);
  useEffect(() => { heldRef.current = held; say(held ? null : saying.current); }, [held]);

  useEffect(() => {
    if (!vid.current || !ov.current || !steps.current || !capL.current || !capR.current || !nums.current) return;
    engine.current = createTrueLine({
      vid: vid.current, ov: ov.current, steps: steps.current,
      capL: capL.current, capR: capR.current, nums: nums.current,
      onLive: t => { saying.current = t; if (!heldRef.current) say(t); },
      onStage: i => told.current?.(i),
    });
    return () => { engine.current?.stop(); say(null); };
  }, []);

  /* a page can hold the sequence on one stage of the pipeline */
  useEffect(() => { engine.current?.setStage(stage); }, [stage]);
  /* or let it play round and round, and be sent to the start of any stage */
  useEffect(() => { engine.current?.setLoop(loop); }, [loop]);
  useEffect(() => { if (at) engine.current?.jump(at.i); }, [at]);

  const play = useCallback(() => { engine.current?.run(); setPaused(false); }, []);
  /* the sequence starts once the window has settled in front of you, holds while it is off
     screen, and carries on from there — it is fifteen seconds long, and it used to spend
     most of them running to nobody */
  const centreRef = usePlayInView<HTMLDivElement>(useCallback(() => engine.current, []), 500, held);

  return (
    <div className="demo" ref={centreRef}>
      <Frame className="appwin tlwin" seed={1}>
        {/* the readout sits inside the frame: beside the footage on a wide stage, under it otherwise */}
        <div className="tlgrid"><div>
        <div className="app">
          <video ref={vid} muted playsInline preload="metadata" poster="/media/trueline-poster.webp"
                 aria-label="A bowling throw, tracked frame by frame">
            <source src="/media/trueline-throw.webm" type="video/webm" />
            <source src="/media/trueline-throw.mp4" type="video/mp4" />
          </video>
          <svg ref={ov} viewBox="0 0 560 560" preserveAspectRatio="none" aria-hidden="true" />
        </div>
        <div className="cap"><span ref={capL}>Run-up</span><span ref={capR}><b>Frame 1</b> of 131</span></div>
        </div>
        <div className="nums" ref={nums} />
        </div>
      </Frame>
      <div className="democtl">
        <div className="stages" ref={steps}>
          {STAGES.map(([name, note], i) => (
            <div className="step" key={name}><span className="n">{i + 1}</span><span><b>{name}</b><em><span>{note}</span></em></span></div>
          ))}
        </div>
        <div className="ctl">
          <button type="button" onClick={play}>Replay</button>
          <button type="button" onClick={() => setPaused(engine.current?.toggle() ?? false)}>{paused ? "Resume" : "Pause"}</button>
        </div>
      </div>
    </div>
  );
}
