/**
 * Target positions for every particle in each state of the object.
 * The vertex shader blends between these as the page scrolls; nothing here runs per frame.
 */
import { createNoise3D } from "simplex-noise";

/** Deterministic PRNG so the object looks the same on every load. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hub node positions (world units). Order matches the anchors in proto.html. */
export const NODES: [number, number, number][] = [
  [-2.7, 0.85, 0.0],
  [-1.05, 1.75, -0.35],
  [1.15, 1.45, 0.25],
  [2.75, 0.3, -0.2],
  [1.45, -1.15, 0.3],
  [-1.35, -1.35, -0.3],
];

export type Shapes = {
  scatter: Float32Array;
  blob: Float32Array;
  ribbon: Float32Array;
  stars: Float32Array;
  terrain: Float32Array;
  rand: Float32Array;
};

export function buildShapes(count: number, seed = 7): Shapes {
  const rnd = mulberry32(seed);
  const noise = createNoise3D(rnd);
  const gauss = () => {
    // Box-Muller
    const u = Math.max(rnd(), 1e-9);
    const v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const scatter = new Float32Array(count * 3);
  const blob = new Float32Array(count * 3);
  const ribbon = new Float32Array(count * 3);
  const stars = new Float32Array(count * 3);
  const terrain = new Float32Array(count * 3);
  const rand = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r = rnd();
    rand[i] = r;

    // Scatter: a wide, sparse cloud the object assembles from on load.
    {
      const dx = gauss(), dy = gauss(), dz = gauss();
      const len = Math.hypot(dx, dy, dz) || 1;
      const rad = 7 + rnd() * 7;
      scatter[i3] = (dx / len) * rad;
      scatter[i3 + 1] = (dy / len) * rad * 0.7;
      scatter[i3 + 2] = (dz / len) * rad - 2;
    }

    // Blob: a noisy sphere, mostly shell with some interior so it reads as a mass, not a skin.
    {
      const dx = gauss(), dy = gauss(), dz = gauss();
      const len = Math.hypot(dx, dy, dz) || 1;
      const nx = dx / len, ny = dy / len, nz = dz / len;
      const n1 = noise(nx * 1.2, ny * 1.2, nz * 1.2);
      const n2 = noise(nx * 2.7 + 5.0, ny * 2.7, nz * 2.7);
      const shell = 1.45 * (0.86 + 0.12 * n1 + 0.06 * n2);
      // Dense core, soft edge: most points inside, a sparse halo drifting well outside.
      const halo = rnd() < 0.06;
      const depth = halo ? 1.15 + rnd() * 0.8 : Math.pow(rnd(), 0.55);
      blob[i3] = nx * shell * depth;
      blob[i3 + 1] = ny * shell * depth;
      blob[i3 + 2] = nz * shell * depth;
    }

    // Ribbon: a long twisted band, stretched across the viewport.
    {
      const t = rnd();
      const x = (t - 0.42) * 7.6;
      const y = 0.85 + 0.5 * Math.sin(t * 7.2) + 0.15 * noise(t * 5, 1.3, 0.2);
      const z = 0.35 * Math.cos(t * 5.1);
      const thick = 0.2;
      ribbon[i3] = x + gauss() * 0.05;
      ribbon[i3 + 1] = y + gauss() * thick;
      ribbon[i3 + 2] = z + gauss() * thick;
    }

    // Stars: clusters around the hub nodes, with a little dust along the ring between them.
    {
      if (rnd() < 0.86) {
        const k = Math.floor(rnd() * NODES.length);
        const [cx, cy, cz] = NODES[k];
        const spread = rnd() < 0.12 ? 0.75 : 0.26;
        stars[i3] = cx + gauss() * spread;
        stars[i3 + 1] = cy + gauss() * spread;
        stars[i3 + 2] = cz + gauss() * spread;
      } else {
        const k = Math.floor(rnd() * NODES.length);
        const a = NODES[k];
        const b = NODES[(k + 1) % NODES.length];
        const t = rnd();
        stars[i3] = a[0] + (b[0] - a[0]) * t + gauss() * 0.04;
        stars[i3 + 1] = a[1] + (b[1] - a[1]) * t + gauss() * 0.04;
        stars[i3 + 2] = a[2] + (b[2] - a[2]) * t + gauss() * 0.04;
      }
    }

    // Terrain: a floor of points below eye level with two octaves of relief.
    {
      const u = rnd() * 2 - 1;
      const v = rnd() * 2 - 1;
      const x = u * 4.4;
      const z = v * 2.4;
      const h = 0.5 * noise(x * 0.55, z * 0.55, 3.1) + 0.18 * noise(x * 1.7, z * 1.7, 8.4);
      terrain[i3] = x;
      terrain[i3 + 1] = -0.95 + h;
      terrain[i3 + 2] = z;
    }
  }

  return { scatter, blob, ribbon, stars, terrain, rand };
}
