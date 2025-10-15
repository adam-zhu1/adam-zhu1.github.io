import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Skills } from "@/components/Skills";
import { Education } from "@/components/Education";
import { Experience } from "@/components/Experience";
import { Research } from "@/components/Research";
import { Robotics } from "@/components/Robotics";
import { Contact } from "@/components/Contact";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <About />
      <Skills />
      <Education />
      <Experience />
      <Research />
      <Robotics />
      <Contact />
      
      <footer className="bg-foreground/5 py-8 text-center">
        <p className="text-muted-foreground">
          © {new Date().getFullYear()} Adam Zhu. All rights reserved.
        </p>
      </footer>
    </main>
  );
};

export default Index;
