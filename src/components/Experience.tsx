import { Card } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

const experiences = [
  {
    title: "Research Internship",
    organization: "Center for Statistics and Applications in Forensic Evidence",
    location: "Iowa State University",
    period: "June 2024 - August 2024",
    responsibilities: [
      "Helped degrade handwriting samples to create more realistic database for handwriting analysis",
      "Examined the source of threatening letters using statistical methods",
      "Learned to use R packages to create metrics measuring similarity scores between threatening letters and suspect handwriting"
    ]
  },
  {
    title: "Summer Research Internship",
    organization: "Center for Statistics and Applications in Forensic Evidence",
    location: "Iowa State University",
    period: "June 2023 - May 2024",
    responsibilities: [
      "Gathered dataset of 24,000 images for camera fingerprinting project",
      "Studied utilization of camera fingerprints to trace source of images found on criminal sites",
      "Engaged in data analysis using camera fingerprints, gaining experience in coding"
    ]
  },
  {
    title: "Camp Co-designer",
    organization: "COR Robotics Camp",
    location: "Ames, IA",
    period: "Summer 2024 and 2025",
    responsibilities: [
      "Designed camp courses teaching elementary students Battle drones, Drone racing, Eureka Engineering, RC Wars, Comic Creation, and Game Design",
      "Provided avenue for educating and inspiring next generation of problem-solvers through entertaining STEM activities",
      "Kept kids engaged in STEM during summer"
    ]
  }
];

export const Experience = () => {
  return (
    <section id="experience" className="py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">
            Work Experience
          </h2>
          
          <div className="space-y-6">
            {experiences.map((exp, idx) => (
              <Card 
                key={idx} 
                className="p-8 bg-card border-border hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-foreground mb-2">
                      {exp.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 items-center mb-4">
                      <p className="text-lg text-primary font-medium">
                        {exp.organization}
                      </p>
                      <span className="text-muted-foreground">•</span>
                      <p className="text-muted-foreground">
                        {exp.location}
                      </p>
                      <span className="text-muted-foreground">•</span>
                      <p className="text-muted-foreground">
                        {exp.period}
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {exp.responsibilities.map((resp, respIdx) => (
                        <li key={respIdx} className="text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{resp}</span>
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
