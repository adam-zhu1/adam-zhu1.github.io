import { Outlet, useLocation } from "react-router-dom";

/**
 * Wraps route content so each navigation runs a short enter animation.
 */
export function PageTransition() {
  const location = useLocation();
  const ABOUT_INTRO_TRIGGER_KEY = "aboutPageIntroTriggerV1";

  // Skip the generic page-enter animation for the first About intro run
  // so it doesn't fight the custom sequence.
  const shouldSkipPageEnter =
    location.pathname === "/about" &&
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(ABOUT_INTRO_TRIGGER_KEY) === "1";

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      key={location.pathname}
      className={shouldSkipPageEnter && !prefersReducedMotion ? "" : "animate-page-enter"}
    >
      <Outlet />
    </div>
  );
}
