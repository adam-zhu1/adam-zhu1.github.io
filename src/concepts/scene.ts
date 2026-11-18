/* How far the scroll has taken the dots, from the first screen down through the projects.
   a: the object opening out into the flowing sheet (0 to 1) while the first screen leaves.
   The title screen is TITLE viewport-heights tall and holds still for the part beyond one,
   so the sheet gets a moment on its own before the projects arrive.
   `flow` is written by the page as it scrolls: g is how far the projects have come in
   (0 to 1), pr is which project is showing, with its fraction. */
export const TITLE = 1.7;
export const flow = { g: 0, pr: 0 };
const clamp = (v: number) => v < 0 ? 0 : v > 1 ? 1 : v;
export const scene = (y: number, vh: number) => clamp((y / (vh || 1) - .08) / .92);
