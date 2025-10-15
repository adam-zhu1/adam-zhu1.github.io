import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github } from "lucide-react";

const projects = [
  {
    title: "E-Commerce Platform",
    description: "Built a full-stack e-commerce application with user authentication, product catalog, shopping cart, and payment integration.",
    technologies: ["React", "Node.js", "MongoDB", "Stripe API"],
    github: "https://github.com",
    demo: "https://example.com"
  },
  {
    title: "Task Management App",
    description: "Developed a collaborative task management tool with real-time updates, team workspaces, and deadline tracking.",
    technologies: ["Vue.js", "Firebase", "Tailwind CSS"],
    github: "https://github.com",
    demo: "https://example.com"
  },
  {
    title: "Weather Dashboard",
    description: "Created an interactive weather dashboard with location-based forecasts, historical data visualization, and weather alerts.",
    technologies: ["React", "TypeScript", "Weather API", "Chart.js"],
    github: "https://github.com",
    demo: "https://example.com"
  }
];

export const Projects = () => {
  return (
    <section id="projects" className="py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">
            Featured Projects
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, idx) => (
              <Card 
                key={idx} 
                className="p-6 bg-card border-border hover:shadow-[var(--shadow-elegant)] transition-all duration-300 flex flex-col"
              >
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {project.title}
                </h3>
                
                <p className="text-muted-foreground mb-4 flex-1">
                  {project.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech, techIdx) => (
                    <span 
                      key={techIdx}
                      className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 gap-2"
                    asChild
                  >
                    <a href={project.github} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4" />
                      Code
                    </a>
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 gap-2"
                    asChild
                  >
                    <a href={project.demo} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      Demo
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
