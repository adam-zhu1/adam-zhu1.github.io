import { navigate } from "./router";
import { prefersReducedMotion } from "./useReveal";

/**
 * The door from the hub into a project page.
 *
 * A route swap on its own reads as the page reappearing, because nothing on screen
 * survives the swap — so here one thing does. The project's name is lifted off the card
 * into an overlay, the block's frame is drawn round it and opened outwards past the edges
 * of the screen, and the name flies to the exact spot its own page keeps for it. The real
 * heading waits underneath and takes over in a short crossfade at the end, which is also
 * what hides the weight difference between an h3 and an h1.
 *
 * The two halves live in different React trees and never exist at the same time, so they
 * talk through this module: the card calls `morphInto`, the page calls `land` from a
 * layout effect once it has its own heading measured.
 */

const EASE = "cubic-bezier(.22,1,.36,1)";
const OUT = 170;    // how long the hub has to fall away before the route swaps
const FLY = 640;    // the name's flight
const HAND = 150;   // the crossfade onto the real heading, at the end of the flight

type Pending = { layer: HTMLElement; ghost: HTMLElement; box: HTMLElement; from: DOMRect; size: number; timer: number };

let pending: Pending | null = null;

/** Whether a page is being arrived at by morph, so it can hold its content back. */
export const morphPending = () => pending !== null;

function teardown() {
  if (!pending) return;
  clearTimeout(pending.timer);
  pending.layer.remove();
  document.documentElement.classList.remove("morphing");
  pending = null;
}

/** Lifts `title` out of `block` and heads for `href`. */
export function morphInto(href: string, title: HTMLElement, block: HTMLElement | null) {
  if (prefersReducedMotion() || !title.getClientRects().length) { navigate(href); return; }
  teardown();

  const from = title.getBoundingClientRect();
  const cs = getComputedStyle(title);
  const layer = document.createElement("div");
  layer.className = "morph";

  /* the block's frame, drawn round it at the moment you commit rather than before */
  const b = (block ?? title).getBoundingClientRect();
  const box = document.createElement("i");
  box.className = "morphbox";
  Object.assign(box.style, {
    left: `${b.left - 22}px`, top: `${b.top - 22}px`,
    width: `${b.width + 44}px`, height: `${b.height + 44}px`,
  });

  const ghost = document.createElement("span");
  ghost.className = "morphtitle";
  ghost.textContent = title.textContent ?? "";
  Object.assign(ghost.style, {
    left: `${from.left}px`, top: `${from.top}px`,
    fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
    letterSpacing: cs.letterSpacing, lineHeight: cs.lineHeight, color: cs.color,
  });

  layer.append(box, ghost);
  document.body.appendChild(layer);
  document.documentElement.classList.add("morphing");
  box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 170, easing: EASE, fill: "forwards" });

  pending = { layer, ghost, box, from, size: parseFloat(cs.fontSize), timer: 0 };
  /* if the page never lands — a failed route, a torn-down tree — the overlay still goes */
  pending.timer = window.setTimeout(teardown, OUT + FLY + 1600);

  document.querySelector("main.site")?.classList.add("leaving");
  setTimeout(() => navigate(href), OUT);
}

/**
 * Called by the arriving page with its own heading, to say where the name is flying to.
 *
 * The page renders that heading already hidden when it knows a morph is in flight, and
 * un-hides it on `LANDED` — hiding it from here instead would mean transitioning it from
 * opaque to nothing after it had already painted, which put two copies of the name on
 * screen at once for the length of the fade. Returns whether a morph was actually in
 * flight, so a cold load of the URL can fall back to its ordinary entrance.
 */
export function land(title: HTMLElement): boolean {
  const p = pending;
  if (!p) return false;

  const to = title.getBoundingClientRect();
  const scale = parseFloat(getComputedStyle(title).fontSize) / p.size;
  const dx = to.left - p.from.left, dy = to.top - p.from.top;

  const fly = p.ghost.animate(
    [{ transform: "none" }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }],
    { duration: FLY, easing: EASE, fill: "forwards" },
  );
  p.ghost.animate([{ opacity: 1 }, { opacity: 0 }],
    { duration: HAND, delay: FLY - HAND, easing: "linear", fill: "forwards" });

  /* the frame keeps going, out past every edge, and is gone before the name lands */
  p.box.getAnimations().forEach(a => { a.commitStyles(); a.cancel(); });
  p.box.animate(
    [{}, { left: `${-innerWidth * 0.07}px`, top: `${-innerHeight * 0.07}px`,
           width: `${innerWidth * 1.14}px`, height: `${innerHeight * 1.14}px`, opacity: 0 }],
    { duration: FLY + 60, easing: EASE, fill: "forwards" },
  );

  fly.finished.then(teardown, teardown);
  return true;
}

/** How long the arriving page should wait before bringing the rest of itself in. */
export const LANDED = FLY - HAND;
