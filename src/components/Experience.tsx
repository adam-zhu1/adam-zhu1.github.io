import { Card } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

const experiences = [
  {
    title: "Research Internship",
    organization: "Center for Statistics and Applications in Forensic Evidence",
    location: "Iowa State University",
    period: "June 2023 - August 2024",
    responsibilities: [
      "Conducted forensic data analysis on 24,000+ camera images to study the effectiveness of camera fingerprinting for device identification",
      "Developed methods to degrade and compare handwriting samples, creating a realistic dataset for handwriting similarity analysis",
      "Co-author of a manuscript under review by Forensic Sciences detailing results from camera and handwriting analysis projects"
    ]
  },
  {
    title: "Research Collaborator",
    organization: "Virtual Reality Applications Center",
    location: "Iowa State University",
    period: "January 2024 - June 2024",
    responsibilities: [
      "Conducted statistical analysis on experimental data evaluating the effectiveness of automated communication strategies in simulated school shooting evacuations",
      "Co-author of a manuscript under preparation on project findings"
    ]
  },
  {
    title: "Camp Co-designer",
    organization: "COR Robotics Summer Camps",
    location: "Central Iowa",
    period: "Summers in 2024 & 2025",
    responsibilities: [
      "Designed and led hands-on robotics and engineering activities, co-developing curriculum on drone racing, battle drones, and Eureka engineering",
      "Taught 100+ students in grades 3–8 foundational STEM concepts through hands-on, project-based learning"
    ]
  },
  {
    title: "Co-captain (2023-2024) | Graphic Manager (2022-2023)",
    organization: "Team Neutrino, FIRST Robotics Team #3928",
    location: "Story County, IA",
    period: "June 2021 - June 2025",
    responsibilities: [
      "Oversaw seven sub-teams and 40+ members, coordinating outreach, fundraising, and operations year-round",
      "Organized and led the inaugural FIRST LEGO League Blastoff Camp to provide hands-on STEM experiences",
      "Represented the team to sponsors, judges, and media, contributing to multiple NASA Engineering Inspiration Awards and FIRST World Championship qualifications"
    ]
  },
  {
    title: "Team Member",
    organization: "Arby's",
    location: "Ames, IA",
    period: "June 2020 - June 2025",
    responsibilities: [
      "Operated front register, drive-through, and backline efficiently in a fast-paced environment"
    ]
  },
  {
    title: "Student Advisory Board (Selected Member)",
    organization: "State Science & Technology Fair of Iowa (SSTFI)",
    location: "Ames, IA",
    period: "July 2024 - April 2025",
    responsibilities: [
      "Collaborated with organizers to recruit schools, students, and guest speakers for statewide STEM participation, while planning initiatives to strengthen engagement and improve the fair's outreach"
    ]
  }
];

export const Experience = () => {
  return (
    <section id="experience" className="mt-2">
      <div className="space-y-6">
        {experiences.map((exp, idx) => (
          <Card
            key={idx}
            className="p-7 bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-accent/40 rounded-lg border border-border">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-semibold text-foreground">{exp.title}</h3>
                <div className="flex flex-wrap gap-2 items-center mb-4">
                  <p className="text-sm md:text-base text-foreground font-medium">{exp.organization}</p>
                  <span className="text-muted-foreground">•</span>
                  <p className="text-sm md:text-base text-muted-foreground">{exp.location}</p>
                  <span className="text-muted-foreground">•</span>
                  <p className="text-sm md:text-base text-muted-foreground">{exp.period}</p>
                </div>
                <ul className="space-y-2">
                  {exp.responsibilities.map((resp, respIdx) => (
                    <li
                      key={respIdx}
                      className="text-muted-foreground flex items-start gap-2 text-sm leading-relaxed"
                    >
                      <span className="text-primary mt-1.5">•</span>
                      <span className="flex-1">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
