import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Linkedin, Github, Download } from "lucide-react";

export const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Let's Connect
          </h2>
          
          <p className="text-lg text-muted-foreground mb-12">
            I'm actively looking for internship opportunities. Feel free to reach out if you'd like to discuss potential opportunities or just want to connect!
          </p>

          <Card className="p-8 bg-card border-border shadow-[var(--shadow-card)]">
            <div className="grid md:grid-cols-2 gap-6">
              <Button 
                variant="outline"
                size="lg"
                className="gap-2 h-auto py-4"
                asChild
              >
                <a href="mailto:your.email@example.com">
                  <Mail className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Email</div>
                    <div className="text-sm text-muted-foreground">your.email@example.com</div>
                  </div>
                </a>
              </Button>

              <Button 
                variant="outline"
                size="lg"
                className="gap-2 h-auto py-4"
                asChild
              >
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">LinkedIn</div>
                    <div className="text-sm text-muted-foreground">/in/yourprofile</div>
                  </div>
                </a>
              </Button>

              <Button 
                variant="outline"
                size="lg"
                className="gap-2 h-auto py-4"
                asChild
              >
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">GitHub</div>
                    <div className="text-sm text-muted-foreground">@yourusername</div>
                  </div>
                </a>
              </Button>

              <Button 
                size="lg"
                className="gap-2 h-auto py-4 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Download className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Resume</div>
                  <div className="text-sm opacity-90">Download PDF</div>
                </div>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
