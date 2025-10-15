import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const skillCategories = [
  {
    title: "Languages",
    skills: ["JavaScript", "TypeScript", "Python", "Java", "C++", "HTML/CSS"]
  },
  {
    title: "Frontend",
    skills: ["React", "Vue.js", "Tailwind CSS", "Next.js", "Redux"]
  },
  {
    title: "Backend",
    skills: ["Node.js", "Express", "PostgreSQL", "MongoDB", "REST APIs"]
  },
  {
    title: "Tools & Others",
    skills: ["Git", "Docker", "AWS", "Linux", "Agile/Scrum"]
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
          
          <div className="grid md:grid-cols-2 gap-6">
            {skillCategories.map((category, idx) => (
              <Card 
                key={idx} 
                className="p-6 bg-card border-border hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
              >
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {category.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, skillIdx) => (
                    <Badge 
                      key={skillIdx} 
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground px-3 py-1 text-sm"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
