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
              I'm a motivated Computer Science student with a strong foundation in software development 
              and a passion for creating impactful technology solutions. My journey in tech has been 
              driven by curiosity and a commitment to continuous learning.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Throughout my academic career, I've developed expertise in full-stack development, 
              working with modern frameworks and technologies. I thrive in collaborative environments 
              and enjoy tackling complex problems with creative solutions.
            </p>

            <p className="text-lg text-muted-foreground leading-relaxed">
              I'm actively seeking an internship opportunity where I can contribute my skills, 
              learn from experienced professionals, and make a meaningful impact on real-world projects.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};
