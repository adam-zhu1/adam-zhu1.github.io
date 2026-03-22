import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { SmoothScroll } from "./components/SmoothScroll";
import { scrollWindowToY } from "./lenisBridge";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

/** Full reload: always start at the top of the landing page (no restored scroll / hash jump). */
function ScrollToTopOnLoad() {
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const go = () => scrollWindowToY(0, { immediate: true });
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
    <HashRouter>
      <SmoothScroll />
      <ScrollToTopOnLoad />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
