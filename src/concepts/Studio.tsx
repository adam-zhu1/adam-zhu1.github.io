import { useEffect, useRef, useState, type CSSProperties } from "react";
import commits from "../data/commits.json";
import { WORK } from "../data/work";
import { MORE } from "../components/MoreWork";
import { out } from "../lib/router";
import { setTheme, useTheme } from "../lib/theme";
import { Dots } from "./Dots";
import { Diagram } from "./Diagrams";
import { LINKS } from "./links";

/**
 * Draft: a bootup of dots that counts to 100 and settles behind the name; a first screen
 * with the name in the middle and small things spaced far apart around it; projects as
 * large cards, each a live diagram; the rest of the work as numbered rows.
 */

const MAIL = LINKS[0].href.replace("mailto:", "");
const d = (i: number) => ({ "--d": `${i * 70}ms` }) as CSSProperties;

export default function Studio() {
  const theme = useTheme();
  const [ready, setReady] = useState(false);
  const [slide, setSlide] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  /* the small card in the corner turns through the projects */
  useEffect(() => {
    const id = setInterval(() => setSlide(s => (s + 1) % WORK.length), 5200);
    return () => clearInterval(id);
  }, []);

  /* things below the first screen rise in as they are reached */
  useEffect(() => {
    const els = root.current?.querySelectorAll<HTMLElement>("[data-rv]") ?? [];
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); } }), { threshold: .15, rootMargin: "0px 0px -6% 0px" });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);

  const cur = WORK[slide];

  return (
    <div className={`st${ready ? " ready" : ""}`} ref={root}>
      <style>{CSS}</style>

      <header className="st-bar">
        <a className="st-mark" href="#top">adamzhu.dev</a>
        <div className="st-theme" role="group" aria-label="Theme">
          <button type="button" className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}>dark</button>
          <button type="button" className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}>light</button>
        </div>
        <nav>
          <a className="st-pill" href="#projects">Projects</a>
          <a className="st-pill" href="/Adam-Zhu-Resume.pdf" {...out}>Resume <i>↗</i></a>
          <a className="st-pill" href="/">Current site</a>
        </nav>
      </header>

      <section className="st-hero" id="top">
        <Dots onDone={() => setReady(true)} />
        <h1 className="st-in" style={d(0)}>Adam Zhu</h1>

        <ul className="st-col a st-in" style={d(2)}><li>statistics</li><li>machine learning</li><li>software</li></ul>
        <ul className="st-col b st-in" style={d(3)}><li>Carnegie Mellon</li><li>Pittsburgh</li></ul>
        <ul className="st-col c st-in" style={d(4)}><li>TrueLine</li><li>Clarity</li><li>NIST</li></ul>

        <div className="st-bl">
          <div className="st-tiles st-in" style={d(5)}>
            <div><b>6/6</b><span>clips tracked</span></div>
            <div><b>0.94</b><span>F1 at NIST</span></div>
            <div><b>2 d</b><span>HackCMU build</span></div>
            <div><b>{(commits as unknown[]).length}</b><span>commits</span></div>
          </div>
          <p className="st-in" style={d(6)}>Statistics and machine learning at Carnegie Mellon. Looking for Summer 2027 internships in software, ML, data science, or quant.</p>
          <div className="st-pills st-in" style={d(7)}>
            {LINKS.slice(1).map(l => <a key={l.label} className="st-pill" href={l.href} {...out}>{l.label} <i>↗</i></a>)}
            <a className="st-pill acc" href={LINKS[0].href}>Email <i>↗</i></a>
          </div>
        </div>

        <a className="st-mini st-in" style={d(6)} href="#projects">
          <div className="top"><span>{slide + 1}/{WORK.length}</span><i className="prog"><b key={slide} /></i><span>to projects ↗</span></div>
          <div className="pane" key={cur.id}><Diagram k={cur.demo} /></div>
          <div className="bot"><span>{cur.name}</span><span>{cur.kind}</span></div>
        </a>
      </section>

      <section className="st-sec" id="projects">
        <div className="st-head">
          <h2 data-rv>Projects <i>↗</i></h2>
          <p data-rv style={d(1)}>Three things I built or researched. Each card is a live diagram of how it works.</p>
        </div>
        <div className="st-grid">
          {WORK.map((w, i) => (
            <article key={w.id} className={`st-card${i === 0 ? " wide" : ""}`} data-rv style={d(i ? i : 0)}>
              <div className="pane"><Diagram k={w.demo} /></div>
              <div className="cap">
                <span className="n"><i />{w.name}</span>
                <span className="k">{w.kind}</span>
              </div>
              <p className="what">{w.what} <b>{w.big[0]}</b> {w.big[1]}.</p>
              {w.links && <p className="lk">{w.links.map(l => <a key={l.label} className="st-pill" href={l.href} {...(l.page ? {} : out)}>{l.label} <i>↗</i></a>)}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="st-sec" id="more">
        <div className="st-head">
          <h2 data-rv>More work</h2>
          <p data-rv style={d(1)}>Research at Iowa State, a paper, a campus AI team, and two side projects.</p>
        </div>
        <ol className="st-rows">
          {MORE.map((m, i) => {
            const row = (
              <>
                <span className="i">{String(i + 1).padStart(2, "0")}</span>
                <span className="n">{m.name}</span>
                <span className="b">{m.body}<em>{m.role}{m.org && <> · {m.org}</>} · {m.when}</em></span>
                <span className="go">{m.href ? "↗" : ""}</span>
              </>
            );
            return <li key={m.name} data-rv>{m.href ? <a href={m.href} {...out}>{row}</a> : <div>{row}</div>}</li>;
          })}
        </ol>
      </section>

      <section className="st-sec st-contact" id="contact">
        <h2 data-rv>Get in touch</h2>
        <div data-rv style={d(1)}>
          <a className="mail" href={LINKS[0].href}>{MAIL}</a>
          <div className="st-pills">{LINKS.slice(1).map(l => <a key={l.label} className="st-pill" href={l.href} {...out}>{l.label} <i>↗</i></a>)}</div>
        </div>
      </section>

      <div className="st-foot">
        <div className="big" aria-hidden="true">Adam Zhu</div>
        <div className="meta"><span>Adam Zhu, Pittsburgh</span><span>2026</span></div>
      </div>
    </div>
  );
}

const CSS = `
.st { --bg: #000; --ink: #fff; --mut: #8b8b91; --ln: #26262a; --card: #0b0b0d; --acc: #2b47ff; --onacc: #fff;
  position: relative; background: var(--bg); color: var(--ink); font-family: "Helvetica Neue", var(--sans); letter-spacing: -.01em; overflow-x: clip; }
:root[data-theme="light"] .st { --bg: #f4f4f2; --ink: #0c0c0e; --mut: #6a6a70; --ln: #d6d6d1; --card: #ebebe8; }
html:has(.st), html:has(.st) body { background: #000 !important; }
html[data-theme="light"]:has(.st), html[data-theme="light"]:has(.st) body { background: #f4f4f2 !important; }
.st a { color: inherit; text-decoration: none; }
.st ul, .st ol { list-style: none; margin: 0; padding: 0; }
.st i { font-style: normal; }

/* pills */
.st-pill { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 15px; border: 1px solid var(--ln); border-radius: 999px; font-size: 13px; white-space: nowrap;
  transition: background .2s, color .2s, border-color .2s, transform .2s cubic-bezier(.2,.7,.2,1); }
.st-pill i { font-size: 11px; transition: transform .2s cubic-bezier(.2,.7,.2,1); }
.st-pill:hover { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.st-pill:hover i { transform: translate(2px, -2px); }
.st-pill:active { transform: scale(.97); }
.st-pill.acc { background: var(--acc); border-color: var(--acc); color: var(--onacc); }
.st-pill.acc:hover { background: var(--ink); border-color: var(--ink); color: var(--bg); }

/* bar */
.st-bar { position: fixed; z-index: 30; top: 0; left: 0; right: 0; height: 64px; padding: 0 22px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  opacity: 0; transform: translateY(-10px); transition: opacity .6s .15s, transform .6s .15s cubic-bezier(.2,.7,.2,1); }
.st.ready .st-bar { opacity: 1; transform: none; }
.st-mark { font-size: 15px; letter-spacing: -.02em; }
.st-bar nav { display: flex; gap: 8px; justify-content: flex-end; }
.st-bar .st-pill { background: color-mix(in srgb, var(--bg) 70%, transparent); backdrop-filter: blur(10px); }
.st-bar .st-pill:hover { background: var(--ink); }
.st-theme { display: flex; padding: 3px; border-radius: 999px; background: color-mix(in srgb, var(--bg) 70%, transparent); backdrop-filter: blur(10px); border: 1px solid var(--ln); }
.st-theme button { all: unset; cursor: pointer; font-size: 12px; padding: 5px 13px; border-radius: 999px; color: var(--mut); transition: background .25s, color .25s; }
.st-theme button.on { background: var(--ink); color: var(--bg); }

/* first screen */
.st-hero { position: relative; height: 100svh; min-height: 620px; overflow: hidden; }
.st-dots { position: absolute; inset: 0; width: 100%; height: 100%; color: var(--ink); }
.st-hud span { position: absolute; font: 400 11px/1 var(--mono); letter-spacing: .04em; text-transform: uppercase; color: var(--mut); transition: opacity .5s; white-space: pre; }
.st-hud b { font-weight: 400; color: var(--ink); }
.st-hud .tl { left: 22px; top: 26px; } .st-hud .tr { right: 22px; top: 62px; } .st-hud .bl { left: 22px; bottom: 26px; }
.st-hud.off span { opacity: 0; }
.st-in { opacity: 0; transform: translateY(18px); filter: blur(6px); transition: opacity .8s var(--d, 0ms), transform .9s var(--d, 0ms) cubic-bezier(.2,.7,.2,1), filter .8s var(--d, 0ms); }
.st.ready .st-in { opacity: 1; transform: none; filter: none; }
.st h1 { position: absolute; left: 0; right: 0; top: 45%; margin: 0; text-align: center; font-weight: 500; font-size: clamp(64px, 12.4vw, 216px); line-height: 1; letter-spacing: -.065em; white-space: nowrap; translate: 0 -54%; pointer-events: none; }
.st-col { position: absolute; top: 61%; font-size: 12px; line-height: 1.35; color: var(--ink); }
.st-col.a { left: 22px; } .st-col.b { left: 15.5%; } .st-col.c { right: 22px; text-align: right; }
.st-bl { position: absolute; left: 22px; bottom: 22px; width: min(430px, calc(100vw - 44px)); }
.st-tiles { display: flex; gap: 6px; margin-bottom: 16px; }
.st-tiles div { flex: 1; min-width: 0; padding: 10px 10px 9px; border-radius: 9px; background: color-mix(in srgb, var(--ink) 9%, transparent); backdrop-filter: blur(8px); display: flex; flex-direction: column; gap: 5px; }
.st-tiles b { font-weight: 400; font-size: 21px; letter-spacing: -.04em; line-height: 1; }
.st-tiles span { font-size: 10.5px; color: var(--mut); white-space: nowrap; }
.st-bl p { margin: 0 0 18px; font-size: 14.5px; line-height: 1.4; text-indent: 1.2em; max-width: 31em; }
.st-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.st-mini { position: absolute; right: 22px; bottom: 22px; width: min(300px, 26vw); padding: 10px; border-radius: 14px; background: color-mix(in srgb, var(--ink) 8%, transparent); backdrop-filter: blur(10px); display: block; }
.st-mini .top, .st-mini .bot { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 10.5px; color: var(--mut); }
.st-mini .bot { color: var(--ink); font-size: 12px; } .st-mini .bot span:last-child { color: var(--mut); font-size: 10.5px; }
.st-mini .prog { flex: 1; height: 1px; background: var(--ln); position: relative; overflow: hidden; }
.st-mini .prog b { position: absolute; inset: 0; background: var(--ink); transform-origin: left; animation: st-fill 5.2s linear both; }
@keyframes st-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.st-mini .pane { margin: 9px 0; border-radius: 8px; background: var(--bg); border: 1px solid var(--ln); animation: st-swap .6s cubic-bezier(.2,.7,.2,1) both; }
@keyframes st-swap { from { opacity: 0; transform: scale(.97); filter: blur(4px); } to { opacity: 1; transform: none; filter: none; } }

/* diagrams */
.dg { display: block; width: 100%; height: auto; color: var(--ink); font-family: var(--mono); }
.dg text { fill: currentColor; font-size: 8.5px; letter-spacing: .05em; text-transform: uppercase; }
.dg .hd, .dg .lb, .dg .sub { fill: var(--mut); } .dg .lb, .dg .sub { font-size: 7.5px; }
.dg .rd text { font-family: "Helvetica Neue", var(--sans); font-size: 19px; letter-spacing: -.04em; text-transform: none; }
.dg .rd .lb { font-family: var(--mono); font-size: 7.5px; letter-spacing: .05em; text-transform: uppercase; }
.dg .ln { fill: none; stroke: currentColor; stroke-width: .8; opacity: .55; }
.dg .faint { stroke: currentColor; stroke-width: .5; opacity: .14; } .dg .dash { stroke-dasharray: 2 3; opacity: .4; }
.dg .fill { fill: currentColor; opacity: .5; }
.dg .ghost { fill: none; stroke: currentColor; stroke-width: .6; stroke-dasharray: 1.5 3; opacity: .35; }
.dg .live { fill: none; stroke: var(--acc); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.dg .run { fill: var(--acc); }
.dg .bx rect { fill: var(--bg); stroke: currentColor; stroke-width: .8; }
.dg .bx.solid rect { fill: currentColor; } .dg .bx.solid text { fill: var(--bg); }

/* sections */
.st-sec { padding: clamp(90px, 14vh, 170px) 22px 0; }
.st-head { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); align-items: end; gap: 32px; margin-bottom: 34px; }
.st h2 { margin: 0; font-weight: 400; font-size: clamp(54px, 8.4vw, 136px); line-height: .95; letter-spacing: -.055em; }
.st h2 i { display: inline-block; font-size: .8em; }
.st-head p { margin: 0 0 12px; font-size: 14.5px; line-height: 1.4; max-width: 30em; }
[data-rv] { opacity: 0; transform: translateY(34px); transition: opacity .8s var(--d, 0ms), transform 1s var(--d, 0ms) cubic-bezier(.2,.7,.2,1); }
[data-rv].on { opacity: 1; transform: none; }

.st-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 34px 14px; }
.st-card.wide { grid-column: 1 / -1; }
.st-card .pane { border-radius: 14px; background: var(--card); border: 1px solid var(--ln); padding: clamp(14px, 3vw, 44px); transition: border-color .3s, transform .5s cubic-bezier(.2,.7,.2,1); }
.st-card.wide .pane { padding: clamp(14px, 2vw, 30px) 16%; }
.st-card:hover .pane { border-color: color-mix(in srgb, var(--ink) 45%, transparent); transform: translateY(-4px); }
.st-card .cap { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin: 14px 2px 8px; }
.st-card .n { display: flex; align-items: center; gap: 10px; font-size: 19px; letter-spacing: -.03em; }
.st-card .n i { width: 9px; height: 9px; border-radius: 50%; border: 1px solid var(--ink); transition: background .2s; }
.st-card:hover .n i { background: var(--acc); border-color: var(--acc); }
.st-card .k { font-size: 12px; color: var(--mut); padding: 4px 10px; border: 1px solid var(--ln); border-radius: 999px; white-space: nowrap; }
.st-card .what { margin: 0 2px 12px; font-size: 14.5px; line-height: 1.45; color: var(--mut); max-width: 44em; }
.st-card .what b { font-weight: 400; color: var(--ink); }
.st-card .lk { margin: 0 2px; display: flex; gap: 6px; }

.st-rows { border-top: 1px solid var(--ln); }
.st-rows li > * { display: grid; grid-template-columns: 54px minmax(0, 1fr) minmax(0, 1.25fr) 40px; gap: 20px; align-items: start; padding: 24px 0; border-bottom: 1px solid var(--ln); transition: padding .35s cubic-bezier(.2,.7,.2,1), background .25s; }
.st-rows li > a:hover { padding-left: 14px; padding-right: 14px; background: color-mix(in srgb, var(--ink) 5%, transparent); }
.st-rows .i { font: 400 11px/2.6 var(--mono); color: var(--mut); }
.st-rows .n { font-size: clamp(22px, 2.4vw, 34px); letter-spacing: -.04em; line-height: 1.1; }
.st-rows .b { font-size: 13.5px; line-height: 1.45; color: var(--mut); }
.st-rows .b em { display: block; font-style: normal; margin-top: 8px; font-size: 11.5px; color: var(--ink); opacity: .75; }
.st-rows .go { justify-self: end; width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--ln); display: grid; place-items: center; font-size: 12px; transition: background .2s, color .2s, border-color .2s; }
.st-rows .go:empty { visibility: hidden; }
.st-rows a:hover .go { background: var(--acc); border-color: var(--acc); color: var(--onacc); }

.st-contact { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 32px; align-items: end; }
.st-contact .mail { display: inline-block; font-size: clamp(20px, 2.5vw, 36px); letter-spacing: -.035em; border-bottom: 1px solid var(--ln); padding-bottom: 6px; margin-bottom: 20px; transition: border-color .2s; }
.st-contact .mail:hover { border-color: var(--ink); }
.st-foot { padding: clamp(70px, 12vh, 150px) 22px 22px; }
.st-foot .big { font-weight: 500; font-size: 23.2vw; line-height: .8; letter-spacing: -.07em; white-space: nowrap; margin-left: -.05em; }
.st-foot .meta { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 14px; border-top: 1px solid var(--ln); font-size: 12px; color: var(--mut); }

@media (max-width: 820px) {
  .st-bar { grid-template-columns: auto 1fr; padding: 0 14px; } .st-bar nav { display: none; } .st-theme { justify-self: end; }
  .st h1 { top: 30%; font-size: 19vw; }
  .st-col { top: 40%; } .st-col.a { left: 14px; } .st-col.b { display: none; } .st-col.c { right: 14px; }
  .st-bl { left: 14px; bottom: 14px; width: calc(100vw - 28px); }
  .st-mini { display: none; }
  .st-hud .tl { left: 14px; } .st-hud .tr { right: 14px; } .st-hud .bl { left: 14px; bottom: 18px; }
  .st-sec { padding-left: 14px; padding-right: 14px; }
  .st-head, .st-contact { grid-template-columns: 1fr; gap: 16px; align-items: start; }
  .st-grid { grid-template-columns: 1fr; }
  .st-card.wide .pane { padding: 14px; }
  .st-rows li > * { grid-template-columns: 30px minmax(0, 1fr) 34px; }
  .st-rows .b { grid-column: 2 / 3; grid-row: 2; }
  .st-foot { padding-left: 14px; padding-right: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .st-in, [data-rv], .st-bar { transition: none; filter: none; transform: none; }
  .st-mini .pane, .st-mini .prog b { animation: none; }
}
`;
