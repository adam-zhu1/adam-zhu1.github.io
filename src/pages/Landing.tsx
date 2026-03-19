import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import {
  BookOpen,
  Briefcase,
  FileText,
  FolderGit2,
  GraduationCap,
  Mail,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import portrait from "@/assets/adam-portrait-1.jpg";
import { LandingHeroGreeting } from "@/components/LandingHeroGreeting";
import { useLandingIntro, WaveOverlay } from "@/components/LandingIntroOverlay";
import { useState } from "react";
import type { MouseEvent } from "react";

const tiles = [
  { title: "About", to: "/about", icon: User, desc: "What I care about and how I work." },
  { title: "Education", to: "/education", icon: GraduationCap, desc: "Degrees, programs, and highlights." },
  { title: "Skills", to: "/skills", icon: Wrench, desc: "Tools, methods, and research techniques." },
  { title: "Projects", to: "/projects", icon: FolderGit2, desc: "Selected work with links." },
  { title: "Work", to: "/experience", icon: Briefcase, desc: "A scannable timeline of experience." },
  { title: "Research", to: "/research", icon: FileText, desc: "Publications, manuscripts, and awards." },
  { title: "Personal", to: "/personal", icon: Sparkles, desc: "Interests beyond academics." },
  { title: "Contact", to: "/contact", icon: Mail, desc: "Fastest ways to reach me." },
] as const;

export default function Landing() {
  const { showIntro, introComplete } = useLandingIntro();
  const introActive = showIntro && !introComplete;
  const navigate = useNavigate();
  const [aboutExiting, setAboutExiting] = useState(false);

  const ABOUT_INTRO_TRIGGER_KEY = "aboutPageIntroTriggerV1";

  const LANDING_EXIT_MS = 760;

  function handleAboutClick(e: MouseEvent) {
    // Prevent double navigation if the user clicks multiple times quickly.
    if (aboutExiting) {
      e.preventDefault();
      return;
    }

    // Respect reduced-motion.
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      return;
    }

    e.preventDefault();

    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(ABOUT_INTRO_TRIGGER_KEY, "1");
    }

    setAboutExiting(true);
    setTimeout(() => {
      navigate("/about");
    }, LANDING_EXIT_MS);
  }

  return (
    <>
      {introActive && <WaveOverlay />}
      <div
        className={
          introActive
            ? "landing-intro-rise landing-intro-mode"
            : aboutExiting
              ? "landing-exit-mode"
              : ""
        }
      >
        <Navigation />
        <main id="content" className="min-h-screen pt-28 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div
                className={
                  aboutExiting ? "landing-exit-hero-left" : "animate-landing-fade-up opacity-0"
                }
                style={{ animationDelay: aboutExiting ? "90ms" : "0ms" }}
              >
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent/30 px-3 py-1 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                    Welcome
                  </div>

                  <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
                    <LandingHeroGreeting startWhen={introComplete} />
                </h1>
                <p className="mt-4 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
                  Statistics &amp; Machine Learning student at CMU. Choose a section below to explore.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Button asChild size="lg" className="gap-2">
                    <NavLink to="/projects">
                      <BookOpen className="h-4 w-4" />
                      Start with projects
                    </NavLink>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="gap-2">
                    <NavLink to="/contact">
                      <Mail className="h-4 w-4" />
                      Contact
                    </NavLink>
                  </Button>
                </div>
              </div>

              <div
                className={
                  aboutExiting ? "landing-exit-hero-image" : "lg:pt-2 animate-landing-scale-in opacity-0"
                }
                style={{ animationDelay: aboutExiting ? "150ms" : "80ms" }}
              >
                <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
                  <img
                    src={portrait}
                    alt="Adam Zhu portrait"
                    className="w-full h-full object-cover aspect-square"
                    loading="eager"
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tiles.map((t, i) => {
                const Icon = t.icon;
                const isAbout = t.to === "/about";
                const baseCardClass =
                  "p-5 bg-card border-border shadow-[var(--shadow-card)] cursor-pointer";
                return (
                  <NavLink
                    key={t.to}
                    to={t.to}
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
                    onClick={isAbout ? handleAboutClick : undefined}
                  >
                    <Card
                      className={
                        aboutExiting
                          ? isAbout
                            ? `${baseCardClass} landing-exit-tile-pop`
                            : `${baseCardClass} landing-exit-tile`
                          : "p-5 bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300 hover:border-primary/30 cursor-pointer animate-landing-fade-up opacity-0"
                      }
                      style={{
                        animationDelay: aboutExiting
                          ? isAbout
                            ? "0ms"
                            : `${120 + i * 40}ms`
                          : `${120 + i * 60}ms`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-accent/40 rounded-lg border border-border">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="font-semibold">{t.title}</div>
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-primary font-medium">View →</p>
                    </Card>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      </div>
    </>
  );
}

