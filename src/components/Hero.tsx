import { Button } from "@/components/ui/button";
import { ArrowDown, Github, Linkedin, Mail } from "lucide-react";

export const Hero = () => {
  return (
    <section id="hero" className="pt-28 pb-20">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent/30 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            Available for internships & research collaborations
          </div>

          <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            Adam Zhu
          </h1>

          <p className="mt-4 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
            Statistics & Machine Learning student at CMU. I build clean, data-driven solutions and care about
            clarity, reproducibility, and real-world impact.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Button
              size="lg"
              className="gap-2"
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Mail className="h-4 w-4" />
              Contact
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
            >
              <ArrowDown className="h-4 w-4" />
              View projects
            </Button>

            <div className="flex items-center gap-2 sm:ml-auto">
              <Button asChild variant="ghost" size="icon" aria-label="LinkedIn">
                <a
                  href="https://www.linkedin.com/in/adam-zhu-cmu"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </Button>
              <Button asChild variant="ghost" size="icon" aria-label="GitHub">
                <a href="https://github.com/adam-zhu1" target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="text-sm text-muted-foreground">Focus</div>
              <div className="mt-2 font-medium">ML + statistical modeling</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="text-sm text-muted-foreground">Strength</div>
              <div className="mt-2 font-medium">Research + experimentation</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="text-sm text-muted-foreground">Style</div>
              <div className="mt-2 font-medium">Minimal, accessible UI</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
