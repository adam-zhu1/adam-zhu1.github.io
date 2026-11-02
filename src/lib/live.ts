/**
 * A one-line feed from whatever demo is playing to the bar's chip. The demo says what it is
 * doing in a few words ("Board 18.1 · 4.3 ft"); the chip prints it next to the project's
 * name. One listener at a time, since there is one bar. Text goes straight to the DOM:
 * it changes every frame while the ball rolls, which is no job for React state.
 */
type Listener = (text: string | null) => void;
let listener: Listener | null = null;
let last: string | null = null;

export function say(text: string | null) {
  last = text;
  listener?.(text);
}

export function listen(fn: Listener) {
  listener = fn;
  fn(last);
  return () => { if (listener === fn) listener = null; };
}
