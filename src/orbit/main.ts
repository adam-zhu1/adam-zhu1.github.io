/**
 * Prototype: the orbit hub. Nothing stacks. The object sits at the center; links, work, now and
 * contact orbit it in rings. Scrolling zooms deeper through the rings instead of moving down a page.
 */
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "./orbit.css";
import { buildShapes } from "../proto/shapes";
import { fragmentShader, vertexShader } from "../proto/shaders";

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmall = window.innerWidth < 720;
const COUNT = isSmall ? 26000 : 65000;
const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
const LEVELS = 4;

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
const canvas = document.getElementById("field") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(DPR);
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.setClearColor(0x060606, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 60);
camera.position.set(0, 0, 7);
camera.lookAt(0, 0, 0);

const shapes = buildShapes(COUNT, 11);
const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(shapes.blob, 3));
geometry.setAttribute("aScatter", new THREE.BufferAttribute(shapes.scatter, 3));
geometry.setAttribute("aBlob", new THREE.BufferAttribute(shapes.blob, 3));
geometry.setAttribute("aRibbon", new THREE.BufferAttribute(shapes.ribbon, 3));
geometry.setAttribute("aStars", new THREE.BufferAttribute(shapes.stars, 3));
geometry.setAttribute("aTerrain", new THREE.BufferAttribute(shapes.terrain, 3));
geometry.setAttribute("aRand", new THREE.BufferAttribute(shapes.rand, 1));
geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);

const uniforms = {
  uIntro: { value: reduceMotion ? 1 : 0 },
  uP: { value: 0 },
  uTime: { value: 0 },
  uPixelRatio: { value: DPR },
  uSize: { value: isSmall ? 2.8 : 3.4 },
  uAspect: { value: window.innerWidth / window.innerHeight },
  uMouse: { value: new THREE.Vector2(10, 10) },
  uHover: { value: new THREE.Vector3(0, 0, 0) },
  uHoverStrength: { value: 0 },
  uPulse: { value: 0 },
  uColorA: { value: new THREE.Color(0.80, 0.82, 0.86) },
  uColorB: { value: new THREE.Color(0.96, 0.95, 0.90) },
};
const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
const points = new THREE.Points(geometry, material);
points.scale.setScalar(isSmall ? 0.62 : 0.78);
scene.add(points);

// ---------------------------------------------------------------------------
// Depth: scroll drives 0..3. Lenis smooths; ScrollTrigger scrubs.
// ---------------------------------------------------------------------------
const depth = { value: 0 };
let lenis: Lenis | null = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.8 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
gsap.to(depth, {
  value: LEVELS - 1,
  ease: "none",
  scrollTrigger: { trigger: "#runway", start: "top top", end: "bottom bottom", scrub: reduceMotion ? true : 1.0 },
});
ScrollTrigger.create({ start: 40, onEnter: () => document.body.classList.add("scrolled"), onLeaveBack: () => document.body.classList.remove("scrolled") });

/** The object's state per level: blob, constellation, floor, blob. */
const LEVEL_P = [0, 0.54, 0.82, 1.0];
function objectProgress(d: number) {
  const i = Math.min(LEVELS - 2, Math.floor(d));
  const t = d - i;
  return LEVEL_P[i] + (LEVEL_P[i + 1] - LEVEL_P[i]) * t;
}

// ---------------------------------------------------------------------------
// Rings
// ---------------------------------------------------------------------------
const nodeEls = Array.from(document.querySelectorAll<HTMLElement>("#rings .node"));
type Node = { el: HTMLElement; level: number; index: number; count: number; pos: THREE.Vector3 };
const byLevel = new Map<number, HTMLElement[]>();
for (const el of nodeEls) {
  const L = Number(el.dataset.level);
  if (!byLevel.has(L)) byLevel.set(L, []);
  byLevel.get(L)!.push(el);
}
const nodes: Node[] = [];
for (const [L, els] of byLevel) els.forEach((el, i) => nodes.push({ el, level: L, index: i, count: els.length, pos: new THREE.Vector3() }));

const RING_R = isSmall ? 1.7 : 2.7;                 // radius of the ring that is currently in focus
const SPEEDS = [0.05, -0.035, 0.045, 0];            // slow orbit per level; alternate direction
const PHASE = [0.4, 1.9, 0.9, 0];
const projected = new THREE.Vector3();

function ringRadius(d: number) {
  // d = level - depth. Ahead (d > 0): rings nest inside, smaller. Passed (d < 0): rings expand past the viewer.
  return d >= 0 ? RING_R * Math.pow(0.42, d) : RING_R * Math.pow(2.6, -d);
}
function ringOpacity(d: number) {
  if (d >= 0) return Math.max(0, 1 - d * 0.85);   // the next ring shows faintly inside, as a map of what is deeper
  return Math.max(0, 1 + d * 1.6);
}

function layoutRings(time: number) {
  const dep = depth.value;
  const w = window.innerWidth, h = window.innerHeight;
  for (const n of nodes) {
    const d = n.level - dep;
    const r = ringRadius(d);
    const alpha = n.level === LEVELS - 1 && d > 0.6 ? 0 : ringOpacity(d);  // the core only appears near the end
    const live = Math.abs(d) < 0.5;
    n.el.classList.toggle("is-live", live);
    if (alpha <= 0.01) { n.el.style.opacity = "0"; continue; }

    if (n.level === LEVELS - 1) {
      // The core: sits just below the object, does not orbit.
      n.pos.set(0, -1.55, 0.2);
    } else {
      const spin = reduceMotion ? 0 : time * SPEEDS[n.level];
      const a = PHASE[n.level] + spin + (n.index / n.count) * Math.PI * 2;
      n.pos.set(Math.cos(a) * r, Math.sin(a) * r * 0.62, Math.sin(a) * r * 0.35);
    }
    projected.copy(n.pos).project(camera);
    const x = (projected.x * 0.5 + 0.5) * w;
    const y = (-projected.y * 0.5 + 0.5) * h;
    const s = Math.min(1.15, Math.max(0.55, 0.55 + 0.45 * Math.min(1, r / RING_R)));
    n.el.style.setProperty("--s", s.toFixed(3));
    n.el.style.opacity = alpha.toFixed(3);
    n.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
  }
}

// Hovering a live node pulls the light toward it.
for (const n of nodes) {
  const show = () => { uniforms.uHover.value.copy(n.pos); gsap.to(uniforms.uHoverStrength, { value: 0.8, duration: 0.7, ease: "power3.out", overwrite: true }); };
  const hide = () => gsap.to(uniforms.uHoverStrength, { value: 0, duration: 0.9, ease: "power2.out", overwrite: true });
  n.el.addEventListener("pointerenter", show);
  n.el.addEventListener("focus", show);
  n.el.addEventListener("pointerleave", hide);
  n.el.addEventListener("blur", hide);
}

// ---------------------------------------------------------------------------
// Depth index
// ---------------------------------------------------------------------------
const levelBtns = Array.from(document.querySelectorAll<HTMLButtonElement>(".level"));
function scrollToLevel(L: number) {
  const runway = document.getElementById("runway")!;
  const max = runway.offsetHeight - window.innerHeight;
  const y = (L / (LEVELS - 1)) * max;
  if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else window.scrollTo({ top: y, behavior: "auto" });
}
for (const b of levelBtns) b.addEventListener("click", () => scrollToLevel(Number(b.dataset.level)));
function updateIndex() {
  const active = Math.round(depth.value);
  for (const b of levelBtns) b.classList.toggle("is-on", Number(b.dataset.level) === active);
}

// ---------------------------------------------------------------------------
// Intro, idle life, clock, copy
// ---------------------------------------------------------------------------
if (reduceMotion) document.body.classList.add("ready");
else {
  gsap.to(uniforms.uIntro, { value: 1, duration: 3.0, ease: "power2.inOut", delay: 0.3 });
  gsap.delayedCall(1.4, () => document.body.classList.add("ready"));
}

const mouseTarget = new THREE.Vector2(10, 10);
let lastInput = performance.now();
window.addEventListener("pointermove", (e) => { mouseTarget.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1)); lastInput = performance.now(); });
window.addEventListener("pointerleave", () => mouseTarget.set(10, 10));
window.addEventListener("scroll", () => { lastInput = performance.now(); }, { passive: true });

function pulse() { gsap.fromTo(uniforms.uPulse, { value: 0.001 }, { value: 0.999, duration: 2.6, ease: "sine.inOut", overwrite: true, onComplete: () => (uniforms.uPulse.value = 0) }); }
function schedulePulse() { if (reduceMotion) return; gsap.delayedCall(7 + Math.random() * 4, () => { pulse(); gsap.delayedCall(2.7, schedulePulse); }); }
schedulePulse();

const clock = document.getElementById("clock") as HTMLTimeElement;
const fmt = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "America/New_York" });
function tick() { const now = new Date(); clock.textContent = fmt.format(now); clock.dateTime = now.toISOString(); }
tick(); setInterval(tick, 1000);

const copyBtn = document.getElementById("copy-email") as HTMLButtonElement;
const copyStatus = document.getElementById("copy-status") as HTMLElement;
copyBtn.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText("adamzhu@andrew.cmu.edu"); copyStatus.textContent = "Copied"; } catch { copyStatus.textContent = "Select and copy"; }
  gsap.delayedCall(2, () => (copyStatus.textContent = "Click to copy"));
});

// ---------------------------------------------------------------------------
// Resize, debug, render
// ---------------------------------------------------------------------------
function resize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); uniforms.uAspect.value = w / h; }
window.addEventListener("resize", resize);

let frozen = false;
(window as unknown as { __orbit: unknown }).__orbit = {
  freeze: (t: number) => { frozen = true; uniforms.uTime.value = t; },
  setDepth: (d: number) => { depth.value = d; },
  finishIntro: () => { uniforms.uIntro.value = 1; document.body.classList.add("ready"); },
  pulse,
};

const drift = new THREE.Vector2();
gsap.ticker.add((time) => {
  if (document.hidden) return;
  if (!reduceMotion && !frozen) uniforms.uTime.value = time;
  uniforms.uMouse.value.lerp(mouseTarget, 0.08);
  uniforms.uP.value = objectProgress(depth.value);

  const idle = (performance.now() - lastInput) / 1000;
  const idleW = reduceMotion ? 0 : Math.min(1, Math.max(0, (idle - 4) / 6));
  drift.set(Math.sin(time * 0.11) * 0.3, Math.cos(time * 0.07) * 0.18).multiplyScalar(idleW);
  const mx = Math.abs(mouseTarget.x) > 2 ? 0 : mouseTarget.x;
  const my = Math.abs(mouseTarget.y) > 2 ? 0 : mouseTarget.y;
  camera.position.x += ((mx * 0.25) * (1 - idleW) + drift.x - camera.position.x) * 0.04;
  camera.position.y += ((my * 0.15) * (1 - idleW) + drift.y - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  layoutRings(frozen ? uniforms.uTime.value : time);
  updateIndex();
  renderer.render(scene, camera);
});
