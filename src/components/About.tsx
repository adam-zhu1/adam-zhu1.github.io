import { Card } from "@/components/ui/card";

export const About = () => {
  return (
    <section id="about" className="py-20 border-y border-border bg-secondary/15">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-3 mb-8">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">About</h2>
            <p className="text-muted-foreground leading-relaxed">
              I care about shipping work that’s understandable: clear assumptions, tight feedback loops, and
              results you can reproduce.
            </p>
          </div>
          
          <Card className="p-8 bg-card border-border shadow-[var(--shadow-card)]">
            <div className="space-y-5 text-sm md:text-base text-muted-foreground leading-relaxed">
              <p>
                I’m a Statistics &amp; Machine Learning student at Carnegie Mellon University with experience
                across forensic statistics, data analysis, and applied research. I like problems where the answer
                needs both rigor and taste: picking the right metric, validating it, and communicating it clearly.
              </p>

              <p>
                Recently, I worked on projects involving large image datasets for device identification and
                methods for handwriting similarity analysis. I also enjoy building small tools and clean UIs that
                make complex work easy to navigate.
              </p>

              <div className="grid gap-3 md:grid-cols-3 pt-2">
                <div className="rounded-lg border border-border bg-accent/30 p-4">
                  <div className="text-xs text-muted-foreground">Research</div>
                  <div className="mt-1 font-medium text-foreground">Forensic statistics</div>
                </div>
                <div className="rounded-lg border border-border bg-accent/30 p-4">
                  <div className="text-xs text-muted-foreground">Toolkit</div>
                  <div className="mt-1 font-medium text-foreground">Python / R / TS</div>
                </div>
                <div className="rounded-lg border border-border bg-accent/30 p-4">
                  <div className="text-xs text-muted-foreground">Principles</div>
                  <div className="mt-1 font-medium text-foreground">Clarity &amp; rigor</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
