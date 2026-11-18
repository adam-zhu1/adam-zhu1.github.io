/* How far the scroll has taken the dots, from the first screen down to the projects.
   a: the object re-forming into the word "Projects" (0 to 1), which then holds for a moment.
   s: the word scattering into the loose field that sits behind the rest of the page (0 to 1).
   The title screen is TITLE viewport-heights tall, so the projects arrive as the word lets go. */
export const TITLE = 1.1;
const clamp = (v: number) => v < 0 ? 0 : v > 1 ? 1 : v;
export const scene = (y: number, vh: number) => {
  const t = y / (vh || 1);
  return { a: clamp((t - .1) / .6), s: clamp((t - 1) / .5), end: 1.5 * vh };
};
