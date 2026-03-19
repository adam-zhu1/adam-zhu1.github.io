import { Card } from "@/components/ui/card";
import { FileText, Award } from "lucide-react";

const publications = [
  {
    authors: "Lin, H., Zhu, A. and Wang, C.",
    year: "2024",
    title: "Statistical Tests for Proportion Difference in One-to-Two Matched Binary Diagnostic Data: Application to Environmental Testing of Salmonella in the United States",
    journal: "Mathematics 2024, 12, 741",
    link: "https://doi.org/10.3390/math12050741",
    status: "Published"
  },
  {
    authors: "Zhu, A. and Reinders, S.",
    year: "2024",
    title: "Fingerprint of a Camera: Forensic Identification in Multi-Camera Smartphones",
    journal: "Forensic Sciences",
    status: "Under Review"
  },
  {
    authors: "Zhu, A., Newendorp, A., and Gilbert S.",
    year: "2024",
    title: "Estimating the Effectiveness of Automated Communication Strategies in School Shooting Evacuations",
    status: "Under Preparation"
  }
];

const presentation = {
  title: "Estimating the Effectiveness of Automated Communication Strategies in School Shooting Evacuations",
  event: "67th State Science and Technology Fair of Iowa",
  date: "April 2024",
  note: "Selected by a panel of judges from across the nation"
};

const awards = [
  {
    title: "Congressional Award – Silver Certificate",
    organization: "United States Congress",
    date: "January 2025",
    description: "National recognition for achievement in voluntary public service, personal development, physical fitness, and expedition planning."
  },
  {
    title: "Piano Awards – IMTA, OPUS, and MTNA Competitions",
    organization: "Iowa Music Teachers Association (IMTA), Music Teachers National Association (MTNA), and OPUS",
    date: "November 2024",
    description: "Recognized in multiple state and regional piano competitions, including State 1st Prize in OPUS Piano Audition (2023 & 2024), West Central First Alternate in MTNA Senior Piano Duet Competition (2019), and State and Regional Awards in IMTA Piano Auditions (Levels A–F)."
  },
  {
    title: "$500 Scholarship – Department of Industrial and Manufacturing Systems Engineering",
    organization: "Iowa State University",
    date: "April 2024",
    description: "Scholarship awarded to outstanding high school researchers demonstrating excellence in applied data science and statistical analysis."
  },
  {
    title: "1st Place – Mathematics Category",
    organization: "State Science & Technology Fair of Iowa",
    date: "April 2024",
    description: "Recognized for research excellence in mathematical modeling and data analysis. Presented \"Estimating the Effectiveness of Automated Communication Strategies in School Shooting Evacuations\" at the 67th State Science & Technology Fair of Iowa (SSTFI)."
  },
  {
    title: "RAYGUN Innovative Scientist Award",
    organization: "RAYGUN (Des Moines, IA)",
    date: "April 2024",
    description: "Awarded for originality, creativity, and innovative scientific thinking demonstrated through research in behavioral modeling and forensic analytics."
  },
  {
    title: "Eagle Scout Rank",
    organization: "Boy Scouts of America",
    date: "May 2023",
    description: "Achieved the highest rank in Scouting by demonstrating leadership, service, and outdoor proficiency. Led a team in planning and completing a high-impact community service project and served in multiple troop leadership roles, including Assistant Patrol Leader and Troop Historian."
  },
  {
    title: "World Championship – Engineering Inspiration Award",
    organization: "FIRST Robotics (1 of 6 in the world)",
    date: "April 2022",
    description: "Recognized as one of only six teams worldwide for outstanding impact in STEM outreach and community engagement at the FIRST Robotics Championship."
  }
];

export const Research = () => {
  return (
    <section id="research" className="mt-2">
      {/* Publications */}
      <div className="mb-12">
        <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Research Manuscripts
        </h3>
        <div className="space-y-4">
          {publications.map((pub, idx) => (
            <Card
              key={idx}
              className="p-6 bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">
                    {pub.authors} ({pub.year})
                  </p>
                  <h4 className="text-lg font-medium text-foreground mb-2">{pub.title}</h4>
                  {pub.journal && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <em>{pub.journal}</em>
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm px-3 py-1 rounded-full border ${
                        pub.status === "Published"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-accent/20 text-foreground/90 border-border"
                      }`}
                    >
                      {pub.status}
                    </span>
                    {pub.link && (
                      <a
                        href={pub.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View Publication →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Presentation */}
      <div className="mb-12">
        <h3 className="text-2xl font-semibold text-foreground mb-6">Presentations</h3>
        <Card className="p-6 bg-card border-border shadow-[var(--shadow-card)]">
          <h4 className="text-lg font-medium text-foreground mb-2">{presentation.title}</h4>
          <p className="text-muted-foreground mb-2">
            {presentation.event} • {presentation.date}
          </p>
          <p className="text-sm text-primary">{presentation.note}</p>
        </Card>
      </div>

      {/* Awards */}
      <div>
        <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" />
          Honors & Awards
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {awards.map((award, idx) => (
            <Card
              key={idx}
              className="p-6 bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">{award.title}</h4>
                  <p className="text-sm text-muted-foreground mb-1">{award.organization}</p>
                  <p className="text-sm text-primary mb-2">{award.date}</p>
                  {award.description && (
                    <p className="text-sm text-muted-foreground">{award.description}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
