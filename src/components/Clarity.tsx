import { useCallback, useEffect, useRef, useState } from "react";
import { Frame } from "./Frame";
import { usePlayInView } from "../lib/useReveal";
import { createClarity } from "../lib/clarity";
import { CLARITY_STAGES } from "../data/clarity";

/**
 * Clarity's demo on the hub: one capture, hotkey to video, rebuilt from the app's own
 * windows. Lens teal is its colour. Like TrueLine's, the words live with the project list,
 * and `held` keeps it paused while another project has the stage.
 */
export function Clarity({ held = false, loop = false, onStage, at }: { held?: boolean; loop?: boolean; onStage?: (i: number) => void; at?: { i: number } | null }) {
  const told = useRef(onStage);
  useEffect(() => { told.current = onStage; }, [onStage]);
  const stage = useRef<HTMLDivElement>(null);
  const steps = useRef<HTMLDivElement>(null);
  const capL = useRef<HTMLSpanElement>(null);
  const capR = useRef<HTMLSpanElement>(null);
  const engine = useRef<ReturnType<typeof createClarity> | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!stage.current || !steps.current || !capL.current || !capR.current) return;
    engine.current = createClarity({ stage: stage.current, steps: steps.current, capL: capL.current, capR: capR.current, onStage: i => told.current?.(i) });
    return () => engine.current?.stop();
  }, []);

  useEffect(() => { engine.current?.setLoop(loop); }, [loop]);
  useEffect(() => { if (at) engine.current?.jump(at.i); }, [at]);

  const play = useCallback(() => { engine.current?.run(); setPaused(false); }, []);
  const centreRef = usePlayInView<HTMLDivElement>(useCallback(() => engine.current, []), 500, held);

  return (
    <div className="demo clproj" ref={centreRef}>
      <Frame className="appwin" seed={2}>
        <div className="app clapp" ref={stage} aria-label="One capture in Clarity, hotkey to video, recreated from the app's windows" />
        <div className="cap"><span ref={capL}>A binary search that returns the wrong index</span><span ref={capR}><b>⌘⇧E</b> works in any app</span></div>
      </Frame>
      <div className="democtl">
        <div className="stages" ref={steps}>
          {CLARITY_STAGES.map(([name, note], i) => (
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
