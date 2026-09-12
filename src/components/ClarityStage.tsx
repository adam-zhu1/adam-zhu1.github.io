import { useCallback, useEffect, useRef, useState } from "react";
import { Frame } from "./Frame";
import { usePlayInView } from "../lib/useReveal";
import { createClarity } from "../lib/clarity";
import { CLARITY_STAGES } from "../data/clarity";

/**
 * The same sequence the hub runs, at the size a page can give it, with the step legend
 * beside the window. One engine, one scene; only the frame around it changes.
 */
export function ClarityStage() {
  const stage = useRef<HTMLDivElement>(null);
  const steps = useRef<HTMLDivElement>(null);
  const capL = useRef<HTMLSpanElement>(null);
  const capR = useRef<HTMLSpanElement>(null);
  const engine = useRef<ReturnType<typeof createClarity> | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!stage.current || !steps.current || !capL.current || !capR.current) return;
    engine.current = createClarity({ stage: stage.current, steps: steps.current, capL: capL.current, capR: capR.current });
    return () => engine.current?.stop();
  }, []);

  const play = useCallback(() => { engine.current?.run(); setPaused(false); }, []);
  const stageRef = usePlayInView<HTMLDivElement>(useCallback(() => engine.current, []), 420);

  return (
    <div className="tlstage" ref={stageRef}>
      <Frame className="appwin" seed={2} tag="02 Clarity" label={<><b>680 × 96</b> spotlight · <b>440 × 680</b> result</>}>
        <div className="app clapp" ref={stage} aria-label="One capture in Clarity, hotkey to video, recreated from the app's windows" />
        <div className="cap"><span ref={capL}>A binary search that returns the wrong index</span><span ref={capR}><b>⌘⇧E</b> works in any app</span></div>
      </Frame>

      <div className="tlside">
        <div className="stages"><div ref={steps}>
          {CLARITY_STAGES.map(([name, note], i) => (
            <div className="step" key={name}><span className="n">{i + 1}</span><span><b>{name}</b><em>{note}</em></span></div>
          ))}
        </div></div>
        <div className="ctl">
          <button type="button" onClick={play}>Replay</button>
          <button type="button" onClick={() => setPaused(engine.current?.toggle() ?? false)}>{paused ? "Resume" : "Pause"}</button>
        </div>
      </div>
    </div>
  );
}
