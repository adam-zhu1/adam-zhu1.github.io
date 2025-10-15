import { Card } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

const educationData = [
  {
    degree: "Bachelor of Science in Statistics and Machine Learning",
    institution: "Carnegie Mellon University",
    location: "Pittsburgh, PA",
    period: "Aug 2025 - May 2029",
    details: [
      "Major in Statistics and Machine Learning",
      "Department of Statistics and Data Science"
    ]
  },
  {
    degree: "Dual Enrollment (PSEO Program)",
    institution: "Iowa State University",
    location: "Ames, IA",
    period: "Aug 2023 - May 2025",
    details: [
      "GPA: 4.00/4.00",
      "Post-Secondary Enrollment Options program"
    ]
  },
  {
    degree: "High School Diploma",
    institution: "Ames High School",
    location: "Ames, IA",
    period: "Aug 2021 - May 2025",
    details: [
      "GPA: 4.02/4.00",
      "The American Legion Certificate of Distinguished Academic Achievement",
      "National Honor Society"
    ]
  }
];

export const Education = () => {
  return (
    <section id="education" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">
            Education
          </h2>
          
          <div className="space-y-6">
            {educationData.map((edu, idx) => (
              <Card 
                key={idx} 
                className="p-8 bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-foreground mb-2">
                      {edu.degree}
                    </h3>
                    <div className="flex flex-wrap gap-2 items-center mb-4">
                      <p className="text-lg text-primary font-medium">
                        {edu.institution}
                      </p>
                      <span className="text-muted-foreground">•</span>
                      <p className="text-muted-foreground">
                        {edu.location}
                      </p>
                      <span className="text-muted-foreground">•</span>
                      <p className="text-muted-foreground">
                        {edu.period}
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {edu.details.map((detail, detailIdx) => (
                        <li key={detailIdx} className="text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
