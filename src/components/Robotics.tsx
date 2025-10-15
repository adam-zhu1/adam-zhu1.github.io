import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

const roboticsYears = [
  {
    year: "2025",
    achievements: [
      "Qualified for FIRST World Championship",
      "Engineering Inspiration Award, Central Missouri Regional",
      "Regional Finalist, Central Missouri Regional",
      "Team Sustainability Award, Iowa Regional"
    ]
  },
  {
    year: "2024",
    achievements: [
      "Qualified for FIRST World Championship",
      "Engineering Inspiration Award, Central Missouri Regional",
      "Gracious Professionalism Award, Iowa Regional"
    ]
  },
  {
    year: "2023",
    achievements: [
      "Qualified for FIRST World Championship",
      "Excellence in Engineering Award, Northern Lights Regional",
      "Engineering Inspiration Award, Iowa Regional"
    ]
  },
  {
    year: "2022",
    achievements: [
      "World Championship Engineering Inspiration Award: 1 of 6 teams in the world",
      "Regional Winner, North Star Minnesota Regional",
      "Chairman's Award, North Star Minnesota Regional",
      "Engineering Inspiration Award, Iowa Regional"
    ],
    highlight: true
  }
];

export const Robotics = () => {
  return (
    <section id="robotics" className="py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              FIRST Robotics Competition
            </h2>
            <p className="text-xl text-primary font-semibold">
              Team Neutrino (FRC #3928)
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {roboticsYears.map((yearData, idx) => (
              <Card 
                key={idx} 
                className={`p-8 bg-card border-border hover:shadow-[var(--shadow-elegant)] transition-all duration-300 ${
                  yearData.highlight ? 'ring-2 ring-primary/50' : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="w-8 h-8 text-primary" />
                  <h3 className="text-3xl font-bold text-foreground">
                    {yearData.year}
                  </h3>
                  {yearData.highlight && (
                    <span className="ml-auto bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      World Champion
                    </span>
                  )}
                </div>
                <ul className="space-y-3">
                  {yearData.achievements.map((achievement, achievementIdx) => (
                    <li 
                      key={achievementIdx} 
                      className="text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-primary mt-1">•</span>
                      <span className={achievementIdx === 0 && yearData.highlight ? 'font-semibold text-foreground' : ''}>
                        {achievement}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
