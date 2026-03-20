import { useEffect, useState } from "react";

const sections = [
  {
    id: "about",
    title: "About",
    body: "Statistics and machine learning student focused on practical modeling, interpretable systems, and clean quantitative communication.",
  },
  {
    id: "work",
    title: "Work",
    body: "Research, projects, and applied analysis across data science workflows, experimentation, and production-adjacent problem solving.",
  },
  {
    id: "skills",
    title: "Skills",
    body: "Python, R, SQL, modeling, inference, visualization, and storytelling that keeps technical depth readable.",
  },
  {
    id: "connect",
    title: "Connect",
    body: "Open to research collaborations, project conversations, and opportunities where statistical thinking drives decisions.",
  },
];
const SESSION_ANIM_KEY = "landingFirstVisitV1";

export default function Home() {
  const [targetProgress, setTargetProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("about");
  const [playIntro, setPlayIntro] = useState(false);

  useEffect(() => {
    const seen = window.sessionStorage.getItem(SESSION_ANIM_KEY) === "1";
    if (!seen) {
      setPlayIntro(true);
      window.sessionStorage.setItem(SESSION_ANIM_KEY, "1");
      const timer = window.setTimeout(() => setPlayIntro(false), 1450);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = pageHeight > 0 ? Math.min(Math.max(scrollTop / pageHeight, 0), 1) : 0;
      setTargetProgress(progress);

      let closest = sections[0].id;
      let closestDistance = Number.POSITIVE_INFINITY;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (!el) {
          continue;
        }
        const dist = Math.abs(el.getBoundingClientRect().top - window.innerHeight * 0.35);
        if (dist < closestDistance) {
          closestDistance = dist;
          closest = section.id;
        }
      }
      setActiveSection(closest);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-dvh bg-black text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.05),transparent_42%),radial-gradient(circle_at_78%_68%,rgba(130,183,220,0.06),transparent_38%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.06] [background-image:repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(255,255,255,0.12)_3px,rgba(255,255,255,0.12)_4px)]" />
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute left-[5vw] top-1/2 hidden h-[420px] w-[1px] -translate-y-1/2 bg-white/10 md:block">
          <div
            className="absolute left-0 top-0 w-[1px] bg-white/45"
            style={{ height: `${targetProgress * 420}px` }}
          />
        </div>
      </div>

      <div className="sticky top-0 z-30 bg-black/85 backdrop-blur-sm">
        <div
          className={`mx-auto mt-10 h-px w-[min(92vw,1200px)] bg-white/45 ${
            playIntro ? "animate-[line-draw_0.95s_cubic-bezier(0.22,1,0.36,1)_forwards]" : ""
          }`}
        />
        <header className="mx-auto flex w-[min(92vw,1200px)] items-center justify-between pt-2 pb-5 text-[12px] font-medium tracking-[0.04em] text-white/78">
          <span className={playIntro ? "animate-[content-rise_0.7s_ease-out_0.35s_forwards] opacity-0" : ""}>adam zhu</span>
          <nav className="flex gap-7">
            {sections.map((section, idx) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`transition ${
                  activeSection === section.id ? "text-[#82B7DC]" : "text-white/62 hover:text-white"
                } ${playIntro ? "animate-[content-rise_0.65s_ease-out_forwards] opacity-0" : ""}`}
                style={playIntro ? { animationDelay: `${450 + idx * 95}ms` } : undefined}
              >
                {section.title}
              </a>
            ))}
          </nav>
        </header>
      </div>

      <main className="relative z-10 mx-auto w-[min(92vw,1200px)]">
        <section className="flex min-h-dvh items-center py-20">
          <div className="max-w-3xl">
            <p className={`text-xs font-medium tracking-[0.14em] text-white/45 ${playIntro ? "animate-[content-rise_0.75s_ease-out_0.45s_forwards] opacity-0" : ""}`}>
              Statistics & Machine Learning
            </p>
            <h1
              className={`mt-5 font-sans text-5xl font-black uppercase leading-[0.88] tracking-[0.05em] text-white sm:text-7xl md:text-8xl ${
                playIntro
                  ? "animate-[name-focus_1.05s_cubic-bezier(0.22,1,0.36,1)_0.6s_forwards] opacity-0"
                  : "opacity-100"
              }`}
            >
              Adam Zhu
            </h1>
            <p className={`mt-8 max-w-xl text-sm leading-relaxed text-white/66 sm:text-base ${playIntro ? "animate-[content-rise_0.8s_ease-out_0.9s_forwards] opacity-0" : ""}`}>
              I care about translating complex quantitative work into decisions
              people can trust, test, and explain.
            </p>
            <div className="mt-10 flex flex-wrap gap-3 text-[11px] font-medium tracking-[0.12em] text-white/45">
              <span>currently in progress:</span>
              <span className="text-white/72">causal inference notes</span>
              <span className="text-white/55">/</span>
              <span className="text-white/72">portfolio rebuild</span>
            </div>
          </div>
        </section>

        {sections.map((section, idx) => (
          <section
            id={section.id}
            key={section.id}
            className="relative min-h-[145dvh] border-t border-white/10"
          >
            <div className="sticky top-24 py-16">
              <div
                className={`grid gap-10 rounded-sm border px-5 py-8 transition-all duration-500 md:grid-cols-[120px_1fr] md:items-start md:px-8 ${
                  activeSection === section.id
                    ? "border-[#82B7DC]/35 bg-[#82B7DC]/[0.04]"
                    : "border-white/10 bg-transparent"
                }`}
              >
                <p className="text-[11px] font-medium tracking-[0.16em] text-[#82B7DC]">
                  {String(idx + 1).padStart(2, "0")}
                </p>
                <div>
                  <h2 className="text-3xl font-black tracking-[0.02em] text-white sm:text-5xl">
                    {section.title}
                  </h2>
                  <p className="mt-6 max-w-2xl text-xl leading-relaxed text-white/82 sm:text-2xl">
                    {section.body}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ))}
      </main>

      <footer className="mx-auto flex w-[min(92vw,1200px)] flex-wrap gap-4 pb-10 pt-4 text-[11px] font-medium tracking-[0.12em] text-white/62">
        {["GitHub", "LinkedIn", "Email", "Phone"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </footer>

      <style>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes line-draw {
          from {
            transform: scaleX(0.06);
            transform-origin: left;
            opacity: 0;
          }
          to {
            transform: scaleX(1);
            transform-origin: left;
            opacity: 1;
          }
        }

        @keyframes content-rise {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes name-focus {
          from {
            opacity: 0;
            filter: blur(12px);
            transform: scale(1.015);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
