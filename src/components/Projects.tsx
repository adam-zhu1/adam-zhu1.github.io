import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github } from "lucide-react";

type Project = {
  name: string;
  description: string;
  tags: string[];
  href?: string;
  repo?: string;
};

const projects: Project[] = [
  {
    name: "Portfolio Site",
    description:
      "A fast, minimal personal site built with React + Vite, designed for clarity, accessibility, and mobile-first navigation.",
    tags: ["React", "Vite", "TypeScript", "Tailwind"],
    repo: "https://github.com/adam-zhu1/adam-zhu1.github.io",
  },
  {
    name: "Forensic Statistics Research",
    description:
      "Applied statistical analysis and experiment design across real forensic evidence—camera fingerprinting for device identification (24,000+ images) and methods to degrade & compare handwriting samples for similarity analysis; co-author on a manuscript under review.",
    tags: ["Statistics", "Research", "Python/R"],
  },
  {
    name: "Robotics Leadership",
    description:
      "Served as co-captain for FIRST Robotics Team #3928, overseeing 7 sub-teams and 40+ members while coordinating outreach and operations; helped lead the Blastoff Camp and represented the team to sponsors, judges, and media.",
    tags: ["Robotics", "Leadership", "STEM Outreach"],
  },
];

export function Projects() {
  return (
    <section id="projects" className="mt-2">
      <div className="flex items-center justify-end gap-6 mb-6">
        <div className="hidden md:flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <a href="https://github.com/adam-zhu1" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((p) => (
          <Card
            key={p.name}
            className="p-6 bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold truncate">{p.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </div>

              {(p.href || p.repo) && (
                <div className="flex items-center gap-2 shrink-0">
                  {p.repo && (
                    <Button asChild size="icon" variant="ghost" aria-label={`${p.name} repository`}>
                      <a href={p.repo} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {p.href && (
                    <Button asChild size="icon" variant="ghost" aria-label={`${p.name} live link`}>
                      <a href={p.href} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-accent/40 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
