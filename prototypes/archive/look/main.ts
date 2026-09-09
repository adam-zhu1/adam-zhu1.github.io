/**
 * Look study: screen one of option 2 ("hub first, then the show") in three type directions,
 * with the idle-life behaviors that keep the page alive when nothing is moving.
 */
import * as THREE from "three";
import gsap from "gsap";
import "./look.css";
import { buildShapes } from "../../proto/shapes";
import { fragmentShader, vertexShader } from "../../proto/shaders";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmall = window.innerWidth < 720;
const COUNT = isSmall ? 24000 : 60000;
const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

// Per-variant object color (cool white, warm white, blue white).
const PALETTE: Record<string, [THREE.Color, THREE.Color]> = {
  a: [new THREE.Color(0.80, 0.82, 0.86), new THREE.Color(0.96, 0.95, 0.90)],
  b: [new THREE.Color(0.92, 0.84, 0.70), new THREE.Color(0.98, 0.93, 0.84)],
  c: [new THREE.Color(0.62, 0.72, 0.96), new THREE.Color(0.90, 0.94, 1.00)],
};
const GROUND: Record<string, number> = { a: 0x060606, b: 0x0a0908, c: 0x05070a };

// ---------------------------------------------------------------------------
// Scene: the object at rest, placed to the right of the statement.
// ---------------------------------------------------------------------------
const canvas = document.getElementById("field") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(DPR);
renderer.setSize(window.innerWidth, window.innerHeight, false);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 60);
camera.position.set(0, 0, 7);

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
  uColorA: { value: PALETTE.a[0].clone() },
  uColorB: { value: PALETTE.a[1].clone() },
};

const material = new THREE.ShaderMaterial({
  uniforms, vertexShader, fragmentShader,
  transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
});
const points = new THREE.Points(geometry, material);
scene.add(points);

function placeObject() {
  if (window.innerWidth < 720) {
    points.position.set(0, 1.1, 0);
    points.scale.setScalar(0.72);
  } else {
    points.position.set(1.9, 0.15, 0);
    points.scale.setScalar(0.9);
  }
}
placeObject();

// ---------------------------------------------------------------------------
// Variant switching (study UI only).
// ---------------------------------------------------------------------------
const html = document.documentElement;
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".study-btn"));
function setVariant(v: string) {
  html.dataset.variant = v;
  for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.set === v));
  gsap.to(uniforms.uColorA.value, { r: PALETTE[v][0].r, g: PALETTE[v][0].g, b: PALETTE[v][0].b, duration: 0.8 });
  gsap.to(uniforms.uColorB.value, { r: PALETTE[v][1].r, g: PALETTE[v][1].g, b: PALETTE[v][1].b, duration: 0.8 });
  const target = new THREE.Color(GROUND[v]);
  const cur = new THREE.Color();
  renderer.getClearColor(cur);
  gsap.to(cur, { r: target.r, g: target.g, b: target.b, duration: 0.6, onUpdate: () => renderer.setClearColor(cur, 1) });
  try { localStorage.setItem("look-variant", v); } catch { /* ignore */ }
}
for (const b of buttons) b.addEventListener("click", () => setVariant(b.dataset.set!));
window.addEventListener("keydown", (e) => {
  if (e.key === "1") setVariant("a");
  if (e.key === "2") setVariant("b");
  if (e.key === "3") setVariant("c");
});
let initial = "a";
try { initial = localStorage.getItem("look-variant") || "a"; } catch { /* ignore */ }
renderer.setClearColor(GROUND[initial], 1);
setVariant(initial);

// ---------------------------------------------------------------------------
// Intro
// ---------------------------------------------------------------------------
if (!reduceMotion) gsap.to(uniforms.uIntro, { value: 1, duration: 3.0, ease: "power2.inOut", delay: 0.3 });

// ---------------------------------------------------------------------------
// Idle life
// 1. Breathing and slow turn: in the shader already.
// 2. Cursor light: the mass brightens near the pointer and the camera leans toward it.
// 3. Pulse: every 7 to 11 seconds a band of light sweeps through the mass.
// 4. Drift: after 4 seconds without input, the object wanders on a slow orbit.
// 5. The statement's last words rotate every 5 seconds; the clock ticks.
// ---------------------------------------------------------------------------
const mouseTarget = new THREE.Vector2(10, 10);
let lastInput = performance.now();
window.addEventListener("pointermove", (e) => {
  mouseTarget.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  lastInput = performance.now();
});
window.addEventListener("pointerleave", () => mouseTarget.set(10, 10));

function schedulePulse() {
  if (reduceMotion) return;
  gsap.delayedCall(7 + Math.random() * 4, () => {
    gsap.fromTo(uniforms.uPulse, { value: 0.001 }, { value: 0.999, duration: 2.6, ease: "sine.inOut", onComplete: () => { uniforms.uPulse.value = 0; schedulePulse(); } });
  });
}
schedulePulse();

// Word rotation
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

// Clock (Pittsburgh)
const clock = document.getElementById("clock") as HTMLTimeElement;
const fmt = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "America/New_York" });
function tick() {
  const now = new Date();
  clock.textContent = fmt.format(now);
  clock.dateTime = now.toISOString();
}
tick();
setInterval(tick, 1000);

// ---------------------------------------------------------------------------
// Resize and render
// ---------------------------------------------------------------------------
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  uniforms.uAspect.value = w / h;
  placeObject();
}
window.addEventListener("resize", resize);

(window as unknown as { __look: unknown }).__look = {
  set: setVariant,
  finishIntro: () => { uniforms.uIntro.value = 1; },
  pulse: () => gsap.fromTo(uniforms.uPulse, { value: 0.001 }, { value: 0.999, duration: 2.6, onComplete: () => (uniforms.uPulse.value = 0) }),
};

const drift = new THREE.Vector2();
gsap.ticker.add((time) => {
  if (document.hidden) return;
  if (!reduceMotion) uniforms.uTime.value = time;
  uniforms.uMouse.value.lerp(mouseTarget, 0.08);

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
