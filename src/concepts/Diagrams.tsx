import track from "../data/trueline-track.json";

/**
 * A live diagram per project: hairline boxes, small labels, and dots that travel the lines.
 * TrueLine's is the tracked throw itself, replayed down a lane seen from above.
 */

export type DiagramKey = "trueline" | "clarity" | "nist";

const metric = (n: string) => (track.metrics as { n: string; v: number }[]).find(m => m.n === n)?.v ?? 0;
const X = (f: number) => 34 + f * 6.6, Y = (b: number) => 78 + (b - .5) / 39 * 96;
const PTS = track.pts as { f: number; b: number; m: number }[];
const PATH = PTS.map((p, i) => `${i ? "L" : "M"}${X(p.f).toFixed(1)} ${Y(p.b).toFixed(1)}`).join("");

function Box({ x, y, w = 84, h = 34, label, sub, solid }: { x: number; y: number; w?: number; h?: number; label: string; sub?: string; solid?: boolean }) {
  return (
    <g className={solid ? "bx solid" : "bx"}>
      <rect x={x} y={y} width={w} height={h} rx="2" />
      <text x={x + w / 2} y={y + h / 2 + (sub ? -1 : 3)} textAnchor="middle">{label}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" className="sub">{sub}</text>}
    </g>
  );
}

/* a dot that travels a line, over and over */
function Run({ d, dur, begin = 0, r = 2.6 }: { d: string; dur: number; begin?: number; r?: number }) {
  return (
    <circle r={r} className="run">
      <animateMotion path={d} dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
    </circle>
  );
}

function TrueLine() {
  return (
    <svg viewBox="0 0 480 260" className="dg">
      <text x="34" y="34" className="hd">01 / ball track, one throw</text>
      <text x="446" y="34" className="hd" textAnchor="end">seen from above</text>
      <rect x={X(0)} y={Y(.5)} width={X(60) - X(0) + 26} height={Y(39.5) - Y(.5)} className="ln" />
      {[5, 10, 15, 20, 25, 30, 35].map(b => <line key={b} x1={X(0)} x2={X(60)} y1={Y(b)} y2={Y(b)} className="faint" />)}
      {[5, 10, 15, 20, 25, 30, 35].map(b => { const x = X(16 - Math.abs(b - 20) / 5), y = Y(b); return <path key={b} d={`M${x - 7} ${y - 1.6}L${x - 7} ${y + 1.6}L${x} ${y}Z`} className="fill" />; })}
      {[0, 1, 2, 3].flatMap(r => Array.from({ length: r + 1 }, (_, i) => <circle key={`${r}-${i}`} cx={X(60) + r * 6.2} cy={Y(20) + (i - r / 2) * 27} r="2.6" className="ln" />))}
      <line x1={X(metric("Breakpoint Distance"))} x2={X(metric("Breakpoint Distance"))} y1={Y(.5)} y2={Y(39.5) + 8} className="faint dash" />
      {PTS.filter(p => p.m === 1).map((p, i) => <circle key={i} cx={X(p.f)} cy={Y(p.b)} r="1.5" className="ln" />)}
      <path d={PATH} className="ghost" />
      <path d={PATH} className="live" pathLength="1" strokeDasharray="1" strokeDashoffset="1">
        <animate attributeName="stroke-dashoffset" values="1;0;0" keyTimes="0;.62;1" dur="3.7s" repeatCount="indefinite" />
      </path>
      <circle r="4.4" className="run">
        <animateMotion path={PATH} dur="3.7s" keyPoints="0;1;1" keyTimes="0;.62;1" calcMode="linear" repeatCount="indefinite" />
      </circle>
      <text x={X(0)} y={Y(39.5) + 20} className="lb">foul line</text>
      <text x={X(13)} y={Y(39.5) + 20} className="lb">arrows</text>
      <text x={X(metric("Breakpoint Distance"))} y={Y(39.5) + 20} className="lb" textAnchor="middle">breakpoint {metric("Breakpoint Distance")} ft</text>
      <text x={X(60) + 26} y={Y(39.5) + 20} className="lb" textAnchor="end">pins</text>
      <g className="rd">
        <text x="34" y="232">{metric("Speed")}<tspan className="lb" dx="5">mph at release</tspan></text>
        <text x="190" y="232">{metric("Hook")}<tspan className="lb" dx="5">boards of hook</tspan></text>
        <text x="346" y="232">{metric("Entry Angle")}°<tspan className="lb" dx="5">entry angle</tspan></text>
      </g>
    </svg>
  );
}

function Clarity() {
  const a = "M104 130H140", b = "M224 130H260", up = "M344 130H362V78H384", dn = "M344 130H362V182H384";
  return (
    <svg viewBox="0 0 480 260" className="dg">
      <text x="34" y="34" className="hd">02 / one capture, start to finish</text>
      <path d={`${a}${b}${up}${dn}`} className="ln" />
      <Box x={20} y={113} label="capture" sub="drag a box" w={84} />
      <Box x={140} y={113} label="ask" sub="your question" />
      <Box x={260} y={113} label="model" solid />
      <Box x={384} y={61} label="read" sub="in seconds" w={76} />
      <Box x={384} y={165} label="watch" sub="about a minute" w={76} />
      <Run d={a} dur={1.1} /><Run d={b} dur={1.1} begin={.5} />
      <Run d={up} dur={1.3} /><Run d={up} dur={1.3} begin={.65} />
      <Run d={dn} dur={5.2} />
      <text x="460" y="52" className="lb" textAnchor="end">a written explanation</text>
      <text x="460" y="214" className="lb" textAnchor="end">an animation made for</text>
      <text x="460" y="225" className="lb" textAnchor="end">this exact problem</text>
      <g className="rd"><text x="34" y="232">2<tspan className="lb" dx="5">days to build, team of four</tspan></text></g>
    </svg>
  );
}

function Nist() {
  const main = "M96 130H124M196 130H224M296 130H324";
  const up = "M396 130H410V82H424", dn = "M396 130H410V178H424";
  return (
    <svg viewBox="0 0 480 260" className="dg">
      <text x="34" y="34" className="hd">03 / portal requests, sorted</text>
      <path d={`${main}${up}${dn}`} className="ln" />
      <Box x={24} y={113} w={72} label="requests" sub="1.04M" />
      <Box x={124} y={113} w={72} label="stated" sub="21.7%" />
      <Box x={224} y={113} w={72} label="behavior" sub="30.6%" />
      <Box x={324} y={113} w={72} label="audit" sub="41.9%" solid />
      <Box x={424} y={65} w={44} label="people" />
      <Box x={424} y={161} w={44} label="auto" />
      {[0, .45, .9].map(t => <Run key={t} d="M96 130H124" dur={1.35} begin={t} />)}
      {[0.2, .8].map(t => <Run key={t} d="M196 130H224" dur={1.35} begin={t} />)}
      {[0.1, .7].map(t => <Run key={t} d="M296 130H324" dur={1.35} begin={t} />)}
      <Run d={up} dur={1.5} /><Run d={up} dur={1.5} begin={.9} />
      <Run d={dn} dur={1.5} begin={.3} /><Run d={dn} dur={1.5} begin={1.1} />
      <text x="124" y="166" className="lb">share flagged as automated after each stage</text>
      <g className="rd">
        <text x="34" y="232">0.94<tspan className="lb" dx="5">random forest F1</tspan></text>
        <text x="190" y="232">271<tspan className="lb" dx="5">days of logs</tspan></text>
      </g>
    </svg>
  );
}

export function Diagram({ k }: { k: DiagramKey }) {
  return k === "trueline" ? <TrueLine /> : k === "clarity" ? <Clarity /> : <Nist />;
}
