/* How far the scroll has taken the dots, from the first screen down through the projects.
   a: the object opening out into the flowing sheet (0 to 1) while the first screen leaves.
   The title screen is TITLE viewport-heights tall and holds still for the part beyond one,
   so the sheet gets a moment on its own before the projects arrive.
   `flow` is written by the page as it scrolls: g is how far the projects have come in
   (0 to 1), pr is which project is showing, with its fraction, and aim says which form the
   dots should head for the moment a locked step begins (null: go by the scroll position). */
export const TITLE = 1.7;
export const flow: { g: number; pr: number; aim: 0 | 1 | null } = { g: 0, pr: 0, aim: null };
const clamp = (v: number) => v < 0 ? 0 : v > 1 ? 1 : v;
export const scene = (y: number, vh: number) => clamp((y / (vh || 1) - .08) / .92);
/* The shape of every move on the page: it answers at once, covers most of the distance early,
   then takes a long time to settle. (A symmetric ease starts so slowly it reads as lag.) */
export const glide = (t: number) => 1 - Math.pow(1 - Math.pow(t < 0 ? 0 : t > 1 ? 1 : t, 1.15), 4);
