import { useEffect, useRef, useState, type CSSProperties } from "react";
import commits from "../data/commits.json";
import { WORK } from "../data/work";
import { MORE } from "../components/MoreWork";
import { out } from "../lib/router";
import { setTheme, useTheme } from "../lib/theme";
import { Dots } from "./Dots";
import { TrueLine } from "../components/TrueLine";
import { Clarity } from "../components/Clarity";
import { NistFigure } from "../components/ProjectStage";
import { LINKS } from "./links";

/**
 * Draft: a bootup of dots that counts to 100 and settles behind the name; a first screen
 * with the name in the middle and small things spaced far apart around it; one project per
 * screen, words on the left and the real thing on the right (the throw footage, the app's
 * windows, the chart); the rest of the work as numbered rows.
 */

const MAIL = LINKS[0].href.replace("mailto:", "");
const d = (i: number) => ({ "--d": `${i * 70}ms` }) as CSSProperties;

export default function Studio() {
  const theme = useTheme();
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const root = useRef<HTMLDivElement>(null);

  /* things below the first screen rise in as they are reached */
  useEffect(() => {
    const els = root.current?.querySelectorAll<HTMLElement>("[data-rv]") ?? [];
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("on"); io.unobserve(e.target);
      const id = (e.target as HTMLElement).dataset.seen;
      if (id) setSeen(s => ({ ...s, [id]: true }));
    }), { threshold: .15, rootMargin: "0px 0px -6% 0px" });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);

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

        <a className="st-pill st-next st-in" style={d(6)} href="#projects">Projects <i>↓</i></a>
      </section>

      <section className="st-sec" id="projects">
        <div className="st-head">
          <h2 data-rv>Projects <i>↗</i></h2>
          <p data-rv style={d(1)}>Three things I built or researched, one screen each.</p>
        </div>
      </section>

      {WORK.map((w, i) => (
        <section key={w.id} id={w.id} className="st-proj" style={{ "--accent": w.accent } as CSSProperties}>
          <div className="txt">
            <p className="idx" data-rv><b>{String(i + 1).padStart(2, "0")}</b> / {String(WORK.length).padStart(2, "0")}<em>{w.kind}</em></p>
            <h3 data-rv style={d(1)}>{w.name}</h3>
            <p className="what" data-rv style={d(2)}>{w.what}</p>
            <p className="stat" data-rv style={d(3)}><b>{w.big[0]}</b><span>{w.big[1]}</span></p>
            <p className="body" data-rv style={d(4)}>{w.body}</p>
            {w.links && <div className="st-pills" data-rv style={d(5)}>{w.links.map(l => <a key={l.label} className="st-pill" href={l.href} {...(l.page ? {} : out)}>{l.label} <i>↗</i></a>)}</div>}
          </div>
          <div className="vis" data-rv data-seen={w.id} style={d(2)}>
            {w.demo === "trueline" ? <TrueLine /> : w.demo === "clarity" ? <Clarity /> : <NistFigure on={!!seen[w.id]} />}
          </div>
        </section>
      ))}

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
.st-next { position: absolute; right: 22px; bottom: 22px; }


/* sections */
.st-sec { padding: clamp(90px, 14vh, 170px) 22px 0; }
.st-head { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); align-items: end; gap: 32px; margin-bottom: 34px; }
.st h2 { margin: 0; font-weight: 400; font-size: clamp(54px, 8.4vw, 136px); line-height: .95; letter-spacing: -.055em; }
.st h2 i { display: inline-block; font-size: .8em; }
.st-head p { margin: 0 0 12px; font-size: 14.5px; line-height: 1.4; max-width: 30em; }
[data-rv] { opacity: 0; transform: translateY(34px); transition: opacity .8s var(--d, 0ms), transform 1s var(--d, 0ms) cubic-bezier(.2,.7,.2,1); }
[data-rv].on { opacity: 1; transform: none; }

/* one project per screen */
.st-proj { min-height: 100svh; padding: 96px 22px 40px; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: clamp(28px, 4vw, 72px); align-items: center; border-top: 1px solid var(--ln); margin-top: clamp(40px, 8vh, 90px); scroll-margin-top: 0; }
.st-proj .idx { margin: 0 0 22px; font: 400 11.5px/1 var(--mono); letter-spacing: .04em; text-transform: uppercase; color: var(--mut); display: flex; gap: 6px; }
.st-proj .idx b { font-weight: 400; color: var(--ink); } .st-proj .idx em { font-style: normal; margin-left: auto; }
.st-proj h3 { margin: 0 0 20px; font-weight: 400; font-size: clamp(60px, 9.2vw, 150px); line-height: .9; letter-spacing: -.06em; }
.st-proj .what { margin: 0 0 30px; font-size: clamp(18px, 1.55vw, 23px); line-height: 1.3; letter-spacing: -.02em; max-width: 22em; }
.st-proj .stat { margin: 0 0 22px; padding-top: 20px; border-top: 1px solid var(--ln); display: flex; align-items: baseline; gap: 14px; }
.st-proj .stat b { font-weight: 400; font-size: clamp(38px, 4.2vw, 64px); letter-spacing: -.05em; line-height: 1; white-space: nowrap; }
.st-proj .stat span { font-size: 13.5px; line-height: 1.35; color: var(--mut); }
.st-proj .body { margin: 0 0 22px; font-size: 14px; line-height: 1.5; color: var(--mut); max-width: 36em; }
.st-proj .vis { min-width: 0; }
.st-proj .vis[data-rv] { transform: translateY(40px) scale(.97); filter: blur(8px); transition: opacity .9s var(--d, 0ms), transform 1.1s var(--d, 0ms) cubic-bezier(.2,.7,.2,1), filter .9s var(--d, 0ms); }
.st-proj .vis[data-rv].on { transform: none; filter: none; }

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
  .st-next { display: none; }
  .st-hud .tl { left: 14px; } .st-hud .tr { right: 14px; } .st-hud .bl { left: 14px; bottom: 18px; }
  .st-sec { padding-left: 14px; padding-right: 14px; }
  .st-head, .st-contact { grid-template-columns: 1fr; gap: 16px; align-items: start; }
  .st-proj { grid-template-columns: 1fr; padding: 72px 14px 24px; align-items: start; }
  .st-rows li > * { grid-template-columns: 30px minmax(0, 1fr) 34px; }
  .st-rows .b { grid-column: 2 / 3; grid-row: 2; }
  .st-foot { padding-left: 14px; padding-right: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .st-in, [data-rv], .st-bar { transition: none; filter: none; transform: none; }
}
`;
