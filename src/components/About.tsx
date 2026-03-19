import { Card } from "@/components/ui/card";

type AboutProps = {
  introMode?: boolean;
};

export const About = ({ introMode = false }: AboutProps) => {
  return (
    <section
      id="about"
      className={`mt-2 relative ${introMode ? "about-intro-mode" : ""}`}
    >
      <div className="max-w-4xl mx-auto relative z-[2]">
        <Card className="about-intro-card p-8 bg-card border-border shadow-[var(--shadow-card)]">
          <div className="space-y-5 text-sm md:text-base text-muted-foreground leading-relaxed">
            <p
              className={`about-intro-text ${
                introMode ? "about-slide about-slide-left about-slide-d4" : ""
              }`}
            >
              I’m a Statistics &amp; Machine Learning student at Carnegie Mellon University with experience
              across forensic statistics, data analysis, and applied research. I like problems where the answer
              needs both rigor and taste: picking the right metric, validating it, and communicating it clearly.
            </p>

            <p
              className={`about-intro-text ${
                introMode ? "about-slide about-slide-right about-slide-d5" : ""
              }`}
            >
              Recently, I worked on projects involving large image datasets for device identification and methods
              for handwriting similarity analysis. I also enjoy building small tools and clean UIs that make
              complex work easy to navigate.
            </p>

            <div className="grid gap-3 md:grid-cols-3 pt-2">
              <div className="about-intro-tile about-intro-tile-1 rounded-lg border border-border bg-accent/30 p-4">
                <div className="text-xs text-muted-foreground">Research</div>
                <div className="mt-1 font-medium text-foreground">Forensic statistics</div>
              </div>
              <div className="about-intro-tile about-intro-tile-2 rounded-lg border border-border bg-accent/30 p-4">
                <div className="text-xs text-muted-foreground">Toolkit</div>
                <div className="mt-1 font-medium text-foreground">Python / R / TS</div>
              </div>
              <div className="about-intro-tile about-intro-tile-3 rounded-lg border border-border bg-accent/30 p-4">
                <div className="text-xs text-muted-foreground">Principles</div>
                <div className="mt-1 font-medium text-foreground">Clarity &amp; rigor</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
