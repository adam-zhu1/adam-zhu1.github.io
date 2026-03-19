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
import portrait from "@/assets/adam-portrait-1.jpg";

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
  return (
    <>
      <Navigation />
      <main id="content" className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent/30 px-3 py-1 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                  Welcome
                </div>

                <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
                  Adam Zhu
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

              <div className="lg:pt-2">
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
              {tiles.map((t) => {
                const Icon = t.icon;
                return (
                  <Card
                    key={t.to}
                    className="p-5 bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow"
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
                    <div className="mt-4">
                      <Button asChild variant="outline" className="w-full">
                        <NavLink to={t.to}>Open</NavLink>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

