import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from "react";

/**
 * The whole router. Two routes and a static host, so this is a path string, a history
 * push, and an event — no dependency, and nothing that has to be taught about the
 * pre-rendered pages the build writes.
 *
 * Every route is a real file in dist (see scripts/prerender.mjs), so a cold load of
 * /trueline/ is served by GitHub Pages directly. This only takes over once the app is
 * already running, which is what makes the card-to-page morph possible.
 */

const ROUTE_EVENT = "routechange";

/** "/trueline/" and "/trueline" are the same route; "/" stays "/". */
export const normalize = (p: string) => p.replace(/\/+$/, "") || "/";

export function useRoute() {
  const [path, setPath] = useState(() =>
    typeof location === "undefined" ? "/" : normalize(location.pathname));
  useEffect(() => {
    const sync = () => setPath(normalize(location.pathname));
    addEventListener("popstate", sync);
    addEventListener(ROUTE_EVENT, sync);
    return () => { removeEventListener("popstate", sync); removeEventListener(ROUTE_EVENT, sync); };
  }, []);
  return path;
}

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (normalize(to) === normalize(location.pathname)) return;
  history[opts.replace ? "replaceState" : "pushState"]({}, "", to);
  dispatchEvent(new Event(ROUTE_EVENT));
}

/**
 * An internal link. Falls through to the browser for modified clicks and anything
 * off-site, so cmd-click still opens a new tab on a real URL.
 */
export function A({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const click = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (!href.startsWith("/") || href.startsWith("//")) return;
    e.preventDefault();
    navigate(href);
  };
  return <a href={href} onClick={click} {...rest} />;
}
