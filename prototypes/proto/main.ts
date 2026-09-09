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

/** Where the object sits at rest on screen one: centered in the viewfinder frame (desktop) or above the text (phone). */
const REST = { x: isSmall ? 0 : 1.9, y: isSmall ? 1.1 : 0.15, s: isSmall ? 0.72 : 0.78 };
const frameEl = document.getElementById("frame") as HTMLElement;
const HALF_H = Math.tan((42 / 2) * Math.PI / 180) * 7; // world half-height at z = 0 for this camera
function syncFrame(toCenter: number) {
  if (isSmall) return;
  const r = frameEl.getBoundingClientRect();
  const w = window.innerWidth, h = window.innerHeight;
  const cx = (r.left + r.width / 2) / w * 2 - 1;
  const cy = -((r.top + r.height / 2) / h * 2 - 1);
  REST.x = cx * HALF_H * (w / h);
  REST.y = cy * HALF_H;
  // Clip the canvas to the frame, opening to full screen as the object breaks out.
  const k = 1 - toCenter;
  const top = r.top * k, right = (w - r.right) * k, bottom = (h - r.bottom) * k, left = r.left * k;
  canvas.style.clipPath = k < 0.002 ? "none" : `inset(${top.toFixed(1)}px ${right.toFixed(1)}px ${bottom.toFixed(1)}px ${left.toFixed(1)}px round ${(10 * k).toFixed(1)}px)`;
}

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

// The page turns light for Work and Now, and back to dark for Contact.
const LIGHT_BG = new THREE.Color(0xd8dbde), DARK_BG = new THREE.Color(0x060606);
const LIGHT_A = new THREE.Color(0.10, 0.11, 0.13), LIGHT_B = new THREE.Color(0.22, 0.23, 0.26);
const DARK_A = uniforms.uColorA.value.clone(), DARK_B = uniforms.uColorB.value.clone();
const bgNow = DARK_BG.clone();
function setLight(on: boolean) {
  document.body.classList.toggle("light", on);
  const a = on ? LIGHT_A : DARK_A, b = on ? LIGHT_B : DARK_B, bg = on ? LIGHT_BG : DARK_BG;
  gsap.to(uniforms.uColorA.value, { r: a.r, g: a.g, b: a.b, duration: 0.9, ease: "power2.inOut" });
  gsap.to(uniforms.uColorB.value, { r: b.r, g: b.g, b: b.b, duration: 0.9, ease: "power2.inOut" });
  gsap.to(bgNow, { r: bg.r, g: bg.g, b: bg.b, duration: 0.9, ease: "power2.inOut", onUpdate: () => renderer.setClearColor(bgNow, 1) });
  material.blending = on ? THREE.NormalBlending : THREE.AdditiveBlending;
  material.needsUpdate = true;
}
ScrollTrigger.create({ trigger: "#made", start: "top 55%", endTrigger: "#contact", end: "top 55%",
  onEnter: () => setLight(true), onEnterBack: () => setLight(true), onLeave: () => setLight(false), onLeaveBack: () => setLight(false) });

// Progress index follows the section in view.
const indexItems = Array.from(document.querySelectorAll<HTMLLIElement>(".index li"));
for (const li of indexItems) {
  const id = li.dataset.beat!;
  ScrollTrigger.create({ trigger: `#${id}`, start: "top 50%", end: "bottom 50%",
    onToggle: (st) => { if (st.isActive) for (const x of indexItems) x.classList.toggle("is-on", x === li); } });
  li.addEventListener("click", () => { const el = document.getElementById(id)!; if (lenis) lenis.scrollTo(el, { duration: 1.4 }); else el.scrollIntoView(); });
}
for (const a of document.querySelectorAll<HTMLAnchorElement>('.topnav a[href^="#"]')) {
  a.addEventListener("click", (e) => { const el = document.querySelector<HTMLElement>(a.getAttribute("href")!); if (!el) return; e.preventDefault(); if (lenis) lenis.scrollTo(el, { duration: 1.4 }); else el.scrollIntoView(); });
}

// ---------------------------------------------------------------------------
// Boot: one line fills while assets load, then shrinks into the horizon the object arrives on.
// First visit per session only. Scroll, click or a key skips it. Reduced motion skips it entirely.
// ---------------------------------------------------------------------------
const bootEl = document.getElementById("boot") as HTMLElement;
const bootFill = bootEl.querySelector<HTMLElement>(".boot-fill")!;
const bootLine = bootEl.querySelector<HTMLElement>(".boot-line")!;
let bootedThisSession = false;
try { bootedThisSession = sessionStorage.getItem("booted") === "1"; } catch { /* ignore */ }

function arrive(fast: boolean) {
  document.body.classList.add("ready");
  gsap.to(uniforms.uIntro, { value: 1, duration: fast ? 1.4 : 2.6, ease: "power2.inOut" });
}
function endBoot(fast: boolean) {
  if (bootEl.classList.contains("is-done")) return;
  try { sessionStorage.setItem("booted", "1"); } catch { /* ignore */ }
  gsap.killTweensOf(bootFill);
  gsap.to(bootLine, { scaleX: 0, duration: fast ? 0.3 : 0.7, ease: "power3.inOut" });
  bootEl.classList.add("is-done");
  arrive(fast);
}
if (reduceMotion || bootedThisSession) {
  bootEl.classList.add("is-done");
  bootEl.style.transition = "none";
  if (reduceMotion) { document.body.classList.add("ready"); } else { arrive(true); }
} else {
  const t0 = performance.now();
  const MIN_MS = 1700;
  // Fill tracks real readiness: fonts plus the first rendered frame. Eases toward 90 percent, snaps to 100 when ready.
  const fill = gsap.to(bootFill, { width: "90%", duration: 2.4, ease: "power1.out" });
  let firstFrame = false;
  const ready = Promise.all([document.fonts.ready, new Promise<void>((r) => { const check = () => (firstFrame ? r() : requestAnimationFrame(check)); check(); })]);
  ready.then(() => {
    const wait = Math.max(0, MIN_MS - (performance.now() - t0));
    gsap.delayedCall(wait / 1000, () => { fill.kill(); gsap.to(bootFill, { width: "100%", duration: 0.35, ease: "power2.out", onComplete: () => gsap.delayedCall(0.15, () => endBoot(false)) }); });
  });
  const skip = () => endBoot(true);
  window.addEventListener("wheel", skip, { once: true, passive: true });
  window.addEventListener("pointerdown", skip, { once: true });
  window.addEventListener("keydown", skip, { once: true });
  window.addEventListener("touchstart", skip, { once: true, passive: true });
  gsap.ticker.add(function markFirstFrame() { firstFrame = true; gsap.ticker.remove(markFirstFrame); });
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
  syncFrame(toCenter);
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
