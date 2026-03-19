import { About } from "@/components/About";
import { PageShell } from "@/components/PageShell";
import { useEffect, useState } from "react";

const ABOUT_INTRO_TRIGGER_KEY = "aboutPageIntroTriggerV1";

export default function AboutPage() {
  const [introMode, setIntroMode] = useState(() => {
    if (typeof sessionStorage === "undefined") return false;

    const triggered = sessionStorage.getItem(ABOUT_INTRO_TRIGGER_KEY) === "1";
    if (!triggered) return false;

    // Respect reduced motion preferences.
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return false;

    return true;
  });

  // Clear the one-time click trigger once this page is mounted.
  useEffect(() => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(ABOUT_INTRO_TRIGGER_KEY);
    }
  }, []);

  // Safety: if preferences change after mount, keep UI usable.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!introMode) return;
    const prefersReduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) setIntroMode(false);
  }, [introMode]);

  return (
    <PageShell
      title="About"
      subtitle="I care about shipping work that’s understandable: clear assumptions, tight feedback loops, and results you can reproduce."
      introMode={introMode}
    >
      <About introMode={introMode} />
    </PageShell>
  );
}

