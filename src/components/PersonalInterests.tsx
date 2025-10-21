import { Card } from "@/components/ui/card";
import { Music, Camera, Plane, Heart } from "lucide-react";
import adamBassoon from "@/assets/adam-bassoon.jpg";
import adamTravel from "@/assets/adam-travel.jpg";
import adamPhotography from "@/assets/adam-photography.jpg";

const interests = [
  {
    icon: Music,
    title: "Music & Arts",
    description: "I play piano and bassoon, and I enjoy exploring new pieces whenever I can. Music is a creative outlet that balances my technical work.",
    image: adamBassoon
  },
  {
    icon: Camera,
    title: "Photography",
    description: "I love photography and capturing meaningful moments through the lens, finding beauty in everyday scenes and special occasions alike.",
    image: adamPhotography
  },
  {
    icon: Plane,
    title: "Travel & Culture",
    description: "I enjoy traveling the world, experiencing new cultures, and seeing life from different perspectives. Each journey broadens my worldview.",
    image: adamTravel
  }
];

export const PersonalInterests = () => {
  return (
    <section id="personal" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Beyond Academics
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Outside of academics, I'm passionate about music and the arts. I play piano and bassoon, and I enjoy exploring new pieces whenever I can. 
              I love photography and capturing meaningful moments through the lens. I also enjoy traveling the world, experiencing new cultures, 
              and seeing life from different perspectives. When I'm not creating or exploring, I value spending time with friends and family who inspire and support me.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {interests.map((interest, idx) => {
              const Icon = interest.icon;
              return (
                <Card
                  key={idx}
                  className="overflow-hidden bg-card border-border hover:shadow-[var(--shadow-elegant)] transition-all duration-300 animate-fade-in hover:-translate-y-1"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={interest.image}
                      alt={interest.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {interest.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground">
                      {interest.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Family & Community
                </h3>
                <p className="text-muted-foreground">
                  When I'm not creating or exploring, I value spending time with friends and family who inspire and support me. 
                  These relationships keep me grounded and motivated to pursue my goals.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
