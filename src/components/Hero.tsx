import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";
import adamPortrait from "@/assets/adam-portrait-1.jpg";

export const Hero = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background with gradient overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-accent/80 to-primary/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8 animate-fade-in text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground leading-tight">
              Hello, I'm <span className="bg-gradient-to-r from-white to-primary-foreground/80 bg-clip-text text-transparent">Adam Zhu</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-foreground/90 font-light">
              Statistics & Machine Learning Student | Forensic Data Researcher | Robotics Leader
            </p>
            
            <p className="text-lg text-primary-foreground/80">
              Carnegie Mellon University student passionate about data science, machine learning, and forensic statistics. 
              Currently seeking internship opportunities to apply statistical analysis and research skills to real-world challenges.
            </p>

            <div className="flex gap-4 justify-center md:justify-start pt-4">
              <Button 
                size="lg" 
                variant="secondary"
                className="gap-2 shadow-lg hover:shadow-xl transition-all"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Mail className="w-5 h-5" />
                Get In Touch
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2 bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20 backdrop-blur-sm"
                onClick={() => document.getElementById('research')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Research
              </Button>
            </div>

            <div className="flex gap-6 justify-center md:justify-start pt-8">
              <a 
                href="https://www.linkedin.com/in/adam-zhu-cmu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-6 h-6" />
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="GitHub Profile"
              >
                <Github className="w-6 h-6" />
              </a>
              <a 
                href="mailto:adamzhu@andrew.cmu.edu"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="Email Contact"
              >
                <Mail className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Profile Image */}
          <div className="flex justify-center md:justify-end animate-fade-in">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-white/30 to-primary-foreground/30 rounded-full blur"></div>
              <img
                src={adamPortrait}
                alt="Adam Zhu"
                className="relative w-64 h-64 md:w-80 md:h-80 rounded-full object-cover border-4 border-white/20 shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-foreground/30 rounded-full flex justify-center p-2">
          <div className="w-1 h-3 bg-primary-foreground/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};
