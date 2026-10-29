import { useCallback, useEffect, useRef, useState } from "react";
import { Frame } from "./Frame";
import { out } from "../lib/router";
import { usePlayInView, useReveal } from "../lib/useReveal";
import { createClarity } from "../lib/clarity";
import { CLARITY_SITE, CLARITY_STAGES } from "../data/clarity";

/**
 * Clarity's block on the hub: the same two-column shape as TrueLine's, with the sequence
 * rebuilt from the app's own windows in the middle. Lens teal is its colour.
 *
 * Unlike TrueLine this has no page of its own behind it. Clarity is a team project with its
 * own site, and that site is the one place it is explained; the only way out of this block
 * is to it.
 */
export function Clarity() {
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
  const centreRef = usePlayInView<HTMLDivElement>(useCallback(() => engine.current, []), 500);
  const textRef = useReveal<HTMLDivElement>();

  return (
    <div className="proj clproj">
      <div className="in" ref={textRef}>
        <h3>Clarity<i className="swipe" /></h3>
        <p className="desc">
          A macOS menu-bar app that explains any problem on your screen. Press one hotkey, drag a box
          around the problem, and a written explanation arrives in seconds, then an animation made for
          that exact problem about a minute later.
        </p>
        <p className="meta">Python, Go, LangGraph, Manim · HackCMU 2026, team of four, I built the Mac app</p>
        <div className="ctas">
          <a className="store" {...out} href={CLARITY_SITE}>
            Clarity&rsquo;s site<i aria-hidden="true">&#8599;</i>
          </a>
        </div>
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

      <div ref={centreRef}>
        <Frame className="appwin" seed={2}>
          <div className="app clapp" ref={stage} aria-label="One capture in Clarity, hotkey to video, recreated from the app's windows" />
          <div className="cap"><span ref={capL}>A binary search that returns the wrong index</span><span ref={capR}><b>⌘⇧E</b> works in any app</span></div>
        </Frame>
      </div>

    </div>
  );
}
