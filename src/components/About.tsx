import { Card } from "@/components/ui/card";

export const About = () => {
  return (
    <section id="about" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-6 text-center">
            About Me
          </h2>
          
          <Card className="p-8 bg-card border-border shadow-[var(--shadow-card)]">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              I'm a Statistics and Machine Learning student at Carnegie Mellon University with a strong 
              foundation in data science, statistical analysis, and forensic evidence research. My academic 
              journey includes dual enrollment at Iowa State University where I achieved a perfect 4.0 GPA.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              My research experience spans multiple projects in forensic statistics, including camera fingerprinting 
              for criminal investigations and handwriting analysis. I've contributed to published research manuscripts 
              and presented at state-level science fairs, earning recognition and awards for my work.
            </p>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Beyond academics, I'm an active member of FIRST Robotics Competition Team Neutrino, having qualified 
              for World Championships multiple years and winning the prestigious World Championship Engineering 
              Inspiration Award. I'm seeking internship opportunities to apply my analytical skills and passion 
              for data-driven problem solving to real-world challenges.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};
