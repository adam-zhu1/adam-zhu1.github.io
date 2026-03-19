import { Outlet, useLocation } from "react-router-dom";

/**
 * Wraps route content so each navigation runs a short enter animation.
 */
export function PageTransition() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-page-enter">
      <Outlet />
    </div>
  );
}
