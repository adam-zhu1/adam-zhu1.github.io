import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Linkedin, Github, Download } from "lucide-react";

export const Contact = () => {
  return (
    <section id="contact" className="mt-2">
      <Card className="p-8 bg-card border-border shadow-[var(--shadow-card)]">
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="lg"
            className="gap-3 h-auto py-4 justify-start"
            asChild
          >
            <a href="mailto:adamzhu@andrew.cmu.edu">
              <Mail className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Email</div>
                <div className="text-sm text-muted-foreground">adamzhu@andrew.cmu.edu</div>
              </div>
            </a>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="gap-3 h-auto py-4 justify-start"
            asChild
          >
            <a
              href="https://www.linkedin.com/in/adam-zhu-cmu"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">LinkedIn</div>
                <div className="text-sm text-muted-foreground">/in/adam-zhu-cmu</div>
              </div>
            </a>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="gap-3 h-auto py-4 justify-start"
            asChild
          >
            <a href="https://github.com/adam-zhu1" target="_blank" rel="noopener noreferrer">
              <Github className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">GitHub</div>
                <div className="text-sm text-muted-foreground">@adam-zhu1</div>
              </div>
            </a>
          </Button>

          <Button size="lg" className="gap-3 h-auto py-4 justify-start">
            <Download className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold">Resume</div>
            </div>
          </Button>
        </div>
      </Card>
    </section>
  );
};
