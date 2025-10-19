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
    title: "Congressional Award (Silver Certificate)",
    organization: "The Congressional Award Foundation, U.S. Congress",
    date: "January 2025"
  },
  {
    title: "1st Place – Mathematics Category",
    organization: "State Science & Technology Fair of Iowa",
    date: "April 2024"
  },
  {
    title: "RAYGUN Innovative Scientist Award",
    organization: "State Science & Technology Fair of Iowa",
    date: "April 2024"
  },
  {
    title: "Eagle Scout Rank",
    organization: "Boy Scouts of America",
    date: "May 2023"
  },
  {
    title: "World Championship Engineering Inspiration Award",
    organization: "FIRST Robotics (1 of 6 in the world)",
    date: "April 2022"
  }
];

export const Research = () => {
  return (
    <section id="research" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">
            Research & Publications
          </h2>
          
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
                  className="p-6 bg-card border-border hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        {pub.authors} ({pub.year})
                      </p>
                      <h4 className="text-lg font-medium text-foreground mb-2">
                        {pub.title}
                      </h4>
                      {pub.journal && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <em>{pub.journal}</em>
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          pub.status === 'Published' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-accent/10 text-accent'
                        }`}>
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
            <h3 className="text-2xl font-semibold text-foreground mb-6">
              Presentations
            </h3>
            <Card className="p-6 bg-card border-border">
              <h4 className="text-lg font-medium text-foreground mb-2">
                "{presentation.title}"
              </h4>
              <p className="text-muted-foreground mb-2">
                {presentation.event} • {presentation.date}
              </p>
              <p className="text-sm text-primary">
                {presentation.note}
              </p>
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
                  className="p-6 bg-card border-border hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        {award.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        {award.organization}
                      </p>
                      <p className="text-sm text-primary">
                        {award.date}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
