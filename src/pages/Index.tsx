import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Education } from "@/components/Education";
import { Skills } from "@/components/Skills";
import { Experience } from "@/components/Experience";
import { Research } from "@/components/Research";
import { PersonalInterests } from "@/components/PersonalInterests";
import { Contact } from "@/components/Contact";
import { Projects } from "@/components/Projects";

const Index = () => {
  return (
    <>
      <Navigation />
      <main id="content" className="min-h-screen">
        <Hero />
        <About />
        <Education />
        <Skills />
        <Projects />
        <Experience />
        <Research />
        <PersonalInterests />
        <Contact />
        
        <footer className="border-t border-border py-10">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Adam Zhu
              </p>
              <p className="text-sm text-muted-foreground">
                Minimal, fast, and keyboard-friendly.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
};

export default Index;
