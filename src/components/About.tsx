import { Card } from "@/components/ui/card";

export const About = () => {
  return (
    <section id="about" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-6 text-center">
            About Me
          </h2>
          
          <Card className="p-8 bg-card border-border shadow-[var(--shadow-card)] animate-fade-in hover:shadow-[var(--shadow-elegant)] transition-shadow duration-300">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              I'm a Statistics and Machine Learning student at Carnegie Mellon University with a strong 
              foundation in data science, statistical analysis, and forensic evidence research. My academic 
              journey includes dual enrollment at Iowa State University where I achieved a perfect 4.0 GPA, 
              demonstrating my commitment to academic excellence.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              My research experience spans multiple projects in forensic statistics at the Center for Statistics 
              and Applications in Forensic Evidence. I've conducted data analysis on 24,000+ camera images for 
              device identification and developed methods for handwriting similarity analysis. I've contributed 
              to published research manuscripts and co-authored papers currently under review by leading forensic journals.
            </p>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Beyond academics, I served as Co-captain of FIRST Robotics Competition Team Neutrino, overseeing 40+ members 
              and earning one of only six World Championship Engineering Inspiration Awards globally. I'm an Eagle Scout 
              and Congressional Award recipient, seeking internship opportunities to apply my analytical skills and passion 
              for data-driven problem solving to real-world challenges.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};
