/**
 * Prototype: one luminous object that lives on the page from first frame to last and
 * transforms as you scroll. Throwaway code to judge the feel; not the production build.
 */
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "./proto.css";
import { buildShapes, NODES } from "./shapes";
import { fragmentShader, vertexShader } from "./shaders";

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmall = window.innerWidth < 720;
const COUNT = isSmall ? 28000 : 70000;
const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
const canvas = document.getElementById("field") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(DPR);
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.setClearColor(0x07080a, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 60);
camera.position.set(0, 0, 6.5);
camera.lookAt(0, 0, 0);

const shapes = buildShapes(COUNT);
const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(shapes.blob, 3)); // required by three; unused in shader
geometry.setAttribute("aScatter", new THREE.BufferAttribute(shapes.scatter, 3));
geometry.setAttribute("aBlob", new THREE.BufferAttribute(shapes.blob, 3));
geometry.setAttribute("aRibbon", new THREE.BufferAttribute(shapes.ribbon, 3));
geometry.setAttribute("aStars", new THREE.BufferAttribute(shapes.stars, 3));
geometry.setAttribute("aTerrain", new THREE.BufferAttribute(shapes.terrain, 3));
geometry.setAttribute("aRand", new THREE.BufferAttribute(shapes.rand, 1));
geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20); // skip culling math

const uniforms = {
  uIntro: { value: reduceMotion ? 1 : 0 },
  uP: { value: 0 },
  uTime: { value: 0 },
  uPixelRatio: { value: DPR },
  uSize: { value: isSmall ? 3.2 : 4.0 },
  uAspect: { value: window.innerWidth / window.innerHeight },
  uMouse: { value: new THREE.Vector2(10, 10) },
  uHover: { value: new THREE.Vector3(0, 0, 0) },
  uHoverStrength: { value: 0 },
  uPulse: { value: 0 },
  uColorA: { value: new THREE.Color(0.70, 0.77, 0.94) },
  uColorB: { value: new THREE.Color(0.96, 0.89, 0.78) },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader,
  fragmentShader,
  transparent: true,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending,
});
scene.add(new THREE.Points(geometry, material));

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
  gsap.to(uniforms.uIntro, { value: 1, duration: 3.4, ease: "power2.inOut", delay: 0.4 });
  gsap.delayedCall(1.6, () => document.body.classList.add("ready"));
}

// ---------------------------------------------------------------------------
// Hub nodes: DOM anchors projected from the 3D node positions each frame.
// ---------------------------------------------------------------------------
const hub = document.getElementById("hub") as HTMLElement;
const nodeEls = Array.from(hub.querySelectorAll<HTMLAnchorElement>(".node"));
const nodeVecs = NODES.map(([x, y, z]) => new THREE.Vector3(x, y, z));
const projected = new THREE.Vector3();

for (const el of nodeEls) {
  const k = Number(el.dataset.node);
  const show = () => {
    uniforms.uHover.value.copy(nodeVecs[k]);
    gsap.to(uniforms.uHoverStrength, { value: 1, duration: 0.7, ease: "power3.out", overwrite: true });
  };
  const hide = () => gsap.to(uniforms.uHoverStrength, { value: 0, duration: 0.9, ease: "power2.out", overwrite: true });
  el.addEventListener("pointerenter", show);
  el.addEventListener("focus", show);
  el.addEventListener("pointerleave", hide);
  el.addEventListener("blur", hide);
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function updateHub() {
  const p = uniforms.uP.value;
  const starsW = smooth(0.34, 0.54, p) * (1 - smooth(0.64, 0.82, p));
  hub.classList.toggle("live", starsW > 0.7);
  if (starsW < 0.2) return;
  const w = window.innerWidth, h = window.innerHeight;
  for (let k = 0; k < nodeEls.length; k++) {
    projected.copy(nodeVecs[k]).project(camera);
    const x = (projected.x * 0.5 + 0.5) * w;
    const y = (-projected.y * 0.5 + 0.5) * h;
    nodeEls[k].style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  }
}

// ---------------------------------------------------------------------------
// Pointer: light follows the cursor; camera drifts a little.
// ---------------------------------------------------------------------------
const mouseTarget = new THREE.Vector2(10, 10);
window.addEventListener("pointermove", (e) => {
  mouseTarget.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
});
window.addEventListener("pointerleave", () => mouseTarget.set(10, 10));

// ---------------------------------------------------------------------------
// Text reveals
// ---------------------------------------------------------------------------
async function setupReveals() {
  await document.fonts.ready;
  const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
  for (const el of targets) {
    const textEls = el.matches("section") ? Array.from(el.querySelectorAll<HTMLElement>("p")) : [el];
    if (reduceMotion) continue;
    const split = SplitText.create(textEls, { type: "lines", mask: "lines", linesClass: "line" });
    gsap.from(split.lines, {
      yPercent: 115,
      duration: 1.1,
      ease: "power3.out",
      stagger: 0.09,
      scrollTrigger: { trigger: el, start: "top 72%", once: true },
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
  try {
    await navigator.clipboard.writeText("adamzhu@andrew.cmu.edu");
    copyStatus.textContent = "Copied";
  } catch {
    copyStatus.textContent = "Select and copy";
  }
  gsap.fromTo(copyStatus, { opacity: 0 }, { opacity: 1, duration: 0.4 });
  gsap.to(copyStatus, { opacity: 0, delay: 1.8, duration: 0.6, onComplete: () => (copyStatus.textContent = "") });
});

// ---------------------------------------------------------------------------
// Resize and render loop
// ---------------------------------------------------------------------------
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  uniforms.uAspect.value = w / h;
}
window.addEventListener("resize", resize);

// Debug/QA hooks: freeze time and jump progress from a script.
(window as unknown as { __proto: unknown }).__proto = {
  freeze: (t: number) => { frozen = true; uniforms.uTime.value = t; },
  setProgress: (p: number) => { uniforms.uP.value = p; },
  finishIntro: () => { uniforms.uIntro.value = 1; document.body.classList.add("ready"); },
};
let frozen = false;

gsap.ticker.add((time) => {
  if (document.hidden) return;
  if (!reduceMotion && !frozen) uniforms.uTime.value = time;
  uniforms.uMouse.value.lerp(mouseTarget, 0.08);
  const mx = Math.abs(mouseTarget.x) > 2 ? 0 : mouseTarget.x;
  const my = Math.abs(mouseTarget.y) > 2 ? 0 : mouseTarget.y;
  camera.position.x += (mx * 0.28 - camera.position.x) * 0.04;
  camera.position.y += (my * 0.16 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);
  updateHub();
  renderer.render(scene, camera);
});
