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
    <section id="skills" className="mt-2">
      <div className="grid md:grid-cols-3 gap-8">
        {skillCategories.map((category, idx) => {
          const Icon = category.icon;
          return (
            <Card
              key={idx}
              className="p-7 bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-accent/40 rounded-lg border border-border">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{category.category}</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill, skillIdx) => (
                  <span
                    key={skillIdx}
                    className="px-3 py-1.5 bg-accent/30 text-foreground rounded-full text-sm border border-border cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
