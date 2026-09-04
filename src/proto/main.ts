/**
 * Prototype, "hub first, then the show": screen one is the hub (statement, links, the object),
 * scrolling is optional depth where the object morphs. Throwaway code to judge the feel.
 */
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "./proto.css";
import { buildShapes } from "./shapes";
import { fragmentShader, vertexShader } from "./shaders";

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmall = window.innerWidth < 720;
const COUNT = isSmall ? 26000 : 65000;
const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

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
  uSize: { value: isSmall ? 3.0 : 3.8 },
  uAspect: { value: window.innerWidth / window.innerHeight },
  uMouse: { value: new THREE.Vector2(10, 10) },
  uHover: { value: new THREE.Vector3(0, 0, 0) },
  uHoverStrength: { value: 0 },
  uPulse: { value: 0 },
  uColorA: { value: new THREE.Color(0.80, 0.82, 0.86) },
  uColorB: { value: new THREE.Color(0.96, 0.95, 0.90) },
};

const material = new THREE.ShaderMaterial({
  uniforms, vertexShader, fragmentShader,
  transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
});
const points = new THREE.Points(geometry, material);
scene.add(points);

/** Where the object sits at rest on screen one (beside the statement), by viewport. */
const REST = { x: isSmall ? 0 : 1.9, y: isSmall ? 1.1 : 0.15, s: isSmall ? 0.72 : 0.9 };

// ---------------------------------------------------------------------------
// Scroll: Lenis smooths, ScrollTrigger scrubs the morph.
// ---------------------------------------------------------------------------
let lenis: Lenis | null = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

gsap.to(uniforms.uP, {
  value: 1,
  ease: "none",
  scrollTrigger: { trigger: "#page", start: "top top", end: "bottom bottom", scrub: reduceMotion ? true : 0.9 },
});

ScrollTrigger.create({
  start: 40,
  onEnter: () => document.body.classList.add("scrolled"),
  onLeaveBack: () => document.body.classList.remove("scrolled"),
});

// ---------------------------------------------------------------------------
// Intro
// ---------------------------------------------------------------------------
if (reduceMotion) {
  document.body.classList.add("ready");
} else {
  gsap.to(uniforms.uIntro, { value: 1, duration: 3.0, ease: "power2.inOut", delay: 0.3 });
  gsap.delayedCall(1.4, () => document.body.classList.add("ready"));
}

// ---------------------------------------------------------------------------
// Idle life: pulse sweeps, wander when idle, rotating phrase, ticking clock.
// ---------------------------------------------------------------------------
const mouseTarget = new THREE.Vector2(10, 10);
let lastInput = performance.now();
window.addEventListener("pointermove", (e) => {
  mouseTarget.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  lastInput = performance.now();
});
window.addEventListener("pointerleave", () => mouseTarget.set(10, 10));
window.addEventListener("scroll", () => { lastInput = performance.now(); }, { passive: true });

function pulse() {
  gsap.fromTo(uniforms.uPulse, { value: 0.001 }, { value: 0.999, duration: 2.6, ease: "sine.inOut", overwrite: true, onComplete: () => (uniforms.uPulse.value = 0) });
}
function schedulePulse() {
  if (reduceMotion) return;
  gsap.delayedCall(7 + Math.random() * 4, () => { pulse(); gsap.delayedCall(2.7, schedulePulse); });
}
schedulePulse();

// Hovering any hub link sends a pulse through the object: the hub and the object are one thing.
for (const a of document.querySelectorAll<HTMLAnchorElement>(".links a, .dock a")) {
  a.addEventListener("pointerenter", pulse);
  a.addEventListener("focus", pulse);
}

const words = Array.from(document.querySelectorAll<HTMLElement>(".rotator .word"));
let wordIndex = 0;
if (!reduceMotion && words.length > 1) {
  gsap.delayedCall(4.5, function rotate() {
    const prev = words[wordIndex];
    wordIndex = (wordIndex + 1) % words.length;
    const next = words[wordIndex];
    prev.classList.remove("is-on"); prev.classList.add("is-off");
    next.classList.remove("is-off"); next.classList.add("is-on");
    gsap.delayedCall(1.0, () => prev.classList.remove("is-off"));
    gsap.delayedCall(5.2, rotate);
  });
}

const clock = document.getElementById("clock") as HTMLTimeElement;
const fmt = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "America/New_York" });
function tick() { const now = new Date(); clock.textContent = fmt.format(now); clock.dateTime = now.toISOString(); }
tick();
setInterval(tick, 1000);

// ---------------------------------------------------------------------------
// Live TrueLine listing (Apple's lookup API allows cross-origin reads).
// ---------------------------------------------------------------------------
(async () => {
  const el = document.getElementById("trueline-meta");
  if (!el) return;
  try {
    const res = await fetch("https://itunes.apple.com/lookup?id=6801953797");
    const data = await res.json();
    const app = data?.results?.[0];
    if (app?.version) {
      const rating = app.averageUserRating ? `, rated ${Number(app.averageUserRating).toFixed(1)}` : "";
      el.textContent = `On the App Store, version ${app.version}${rating}`;
    }
  } catch { /* keep the static text */ }
})();

// ---------------------------------------------------------------------------
// Text reveals
// ---------------------------------------------------------------------------
async function setupReveals() {
  await document.fonts.ready;
  if (reduceMotion) return;
  for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
    const textEls = el.matches("section")
      ? Array.from(el.querySelectorAll<HTMLElement>("p"))
      : el.matches("ul") ? Array.from(el.querySelectorAll<HTMLElement>(".piece-title, .piece-line, .piece-meta")) : [el];
    const split = SplitText.create(textEls, { type: "lines", mask: "lines", linesClass: "sl" });
    gsap.from(split.lines, {
      yPercent: 115, duration: 1.1, ease: "power3.out", stagger: 0.07,
      scrollTrigger: { trigger: el, start: "top 75%", once: true },
    });
  }
}
setupReveals();

// ---------------------------------------------------------------------------
// Copy email
// ---------------------------------------------------------------------------
const copyBtn = document.getElementById("copy-email") as HTMLButtonElement;
const copyStatus = copyBtn.querySelector<HTMLElement>(".email-status")!;
copyBtn.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText("adamzhu@andrew.cmu.edu"); copyStatus.textContent = "Copied"; }
  catch { copyStatus.textContent = "Select and copy"; }
  gsap.fromTo(copyStatus, { opacity: 0 }, { opacity: 1, duration: 0.4 });
  gsap.to(copyStatus, { opacity: 0, delay: 1.8, duration: 0.6, onComplete: () => (copyStatus.textContent = "") });
});

// ---------------------------------------------------------------------------
// Resize, debug hooks, render loop
// ---------------------------------------------------------------------------
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  uniforms.uAspect.value = w / h;
}
window.addEventListener("resize", resize);

let frozen = false;
(window as unknown as { __proto: unknown }).__proto = {
  freeze: (t: number) => { frozen = true; uniforms.uTime.value = t; },
  setProgress: (p: number) => { uniforms.uP.value = p; },
  finishIntro: () => { uniforms.uIntro.value = 1; document.body.classList.add("ready"); },
  pulse,
};

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const drift = new THREE.Vector2();

gsap.ticker.add((time) => {
  if (document.hidden) return;
  if (!reduceMotion && !frozen) uniforms.uTime.value = time;
  uniforms.uMouse.value.lerp(mouseTarget, 0.08);

  // The object rests beside the statement on screen one, then moves to center as the show starts.
  const p = uniforms.uP.value;
  const toCenter = smooth(0.03, 0.2, p);
  points.position.set(REST.x * (1 - toCenter), REST.y * (1 - toCenter), 0);
  points.scale.setScalar(REST.s + (1 - REST.s) * toCenter);

  // Camera leans toward the pointer; when idle, it wanders instead.
  const idle = (performance.now() - lastInput) / 1000;
  const idleW = reduceMotion ? 0 : Math.min(1, Math.max(0, (idle - 4) / 6));
  drift.set(Math.sin(time * 0.11) * 0.35, Math.cos(time * 0.07) * 0.2).multiplyScalar(idleW);
  const mx = Math.abs(mouseTarget.x) > 2 ? 0 : mouseTarget.x;
  const my = Math.abs(mouseTarget.y) > 2 ? 0 : mouseTarget.y;
  camera.position.x += ((mx * 0.3) * (1 - idleW) + drift.x - camera.position.x) * 0.04;
  camera.position.y += ((my * 0.18) * (1 - idleW) + drift.y - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
});
