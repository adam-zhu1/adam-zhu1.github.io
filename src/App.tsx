import { useEffect } from "react";
import { SECTION_IDS } from "./data/sections";
import Home from "./pages/Home";

/**
 * Full reload: start at the top of the landing page (no restored scroll), unless the URL carries
 * a section hash (e.g. /#work) — then land on that section so links stay shareable. The repeated
 * timers re-assert the position while fonts/layout settle, mirroring the old scroll-to-top guard.
 */
function ScrollToHashOnLoad() {
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const hash = window.location.hash.replace(/^#/, "");
    const targetId = (SECTION_IDS as readonly string[]).includes(hash) ? hash : null;
    const go = () => {
      if (targetId && targetId !== "home") {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "auto", block: "start" });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    };
    go();
    const raf = window.requestAnimationFrame(go);
    const t = window.setTimeout(go, 0);
    const t2 = window.setTimeout(go, 120);
    const t3 = window.setTimeout(go, 280);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToHashOnLoad />
      <Home />
    </>
  );
}
