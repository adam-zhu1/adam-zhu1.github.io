import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Education } from "@/components/Education";
import { Skills } from "@/components/Skills";
import { Experience } from "@/components/Experience";
import { Research } from "@/components/Research";
import { PersonalInterests } from "@/components/PersonalInterests";
import { Contact } from "@/components/Contact";

const Index = () => {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <Hero />
        <About />
        <Education />
        <Skills />
        <Experience />
        <Research />
        <PersonalInterests />
        <Contact />
        
        <footer className="bg-foreground/5 py-8 text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} Adam Zhu. All rights reserved.
          </p>
        </footer>
      </main>
    </>
  );
};

export default Index;
