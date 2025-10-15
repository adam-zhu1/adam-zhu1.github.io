import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Skills } from "@/components/Skills";
import { Education } from "@/components/Education";
import { Projects } from "@/components/Projects";
import { Contact } from "@/components/Contact";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <About />
      <Skills />
      <Education />
      <Projects />
      <Contact />
      
      <footer className="bg-foreground/5 py-8 text-center">
        <p className="text-muted-foreground">
          © {new Date().getFullYear()} Your Name. All rights reserved.
        </p>
      </footer>
    </main>
  );
};

export default Index;
