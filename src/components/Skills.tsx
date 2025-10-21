import { Card } from "@/components/ui/card";
import { Code, BarChart, Wrench } from "lucide-react";

const skillCategories = [
  {
    category: "Technology",
    icon: Code,
    skills: [
      "Microsoft Office Suite",
      "Google Workspace",
      "Adobe Creative Suite",
      "Python",
      "Java",
      "R",
      "MATLAB"
    ]
  },
  {
    category: "Analysis",
    icon: BarChart,
    skills: [
      "Machine Learning",
      "Experimental Design",
      "Generalized Linear Models",
      "ANOVA",
      "Statistical Inference",
      "Data Visualization"
    ]
  },
  {
    category: "Research Tools",
    icon: Wrench,
    skills: [
      "Camera Fingerprinting",
      "Handwriting Analysis",
      "Forensic Statistics",
      "Data Collection & Cleaning",
      "Statistical Testing"
    ]
  }
];

export const Skills = () => {
  return (
    <section id="skills" className="py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">
            Skills & Technologies
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {skillCategories.map((category, idx) => {
              const Icon = category.icon;
              return (
                <Card 
                  key={idx} 
                  className="p-8 bg-card border-border hover:shadow-[var(--shadow-elegant)] transition-all duration-300 animate-fade-in hover:-translate-y-1"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground">
                      {category.category}
                    </h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {category.skills.map((skill, skillIdx) => (
                      <span
                        key={skillIdx}
                        className="px-3 py-1.5 bg-secondary/50 text-foreground rounded-full text-sm hover:bg-primary/10 transition-all hover:scale-105 cursor-default"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
