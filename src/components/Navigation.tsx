import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("hero");

  const navItems = useMemo(
    () => [
      { label: "Home", href: "#hero", id: "hero" },
      { label: "About", href: "#about", id: "about" },
      { label: "Education", href: "#education", id: "education" },
      { label: "Skills", href: "#skills", id: "skills" },
      { label: "Projects", href: "#projects", id: "projects" },
      { label: "Work", href: "#experience", id: "experience" },
      { label: "Research", href: "#research", id: "research" },
      { label: "Personal", href: "#personal", id: "personal" },
      { label: "Contact", href: "#contact", id: "contact" },
    ],
    [],
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const ids = navItems.map((x) => x.id);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((x): x is HTMLElement => Boolean(x));
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const topMost = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        const id = topMost?.target?.id;
        if (id) setActiveId(id);
      },
      { root: null, rootMargin: "-20% 0px -70% 0px", threshold: [0.01, 0.1, 0.25] },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [navItems]);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-[var(--shadow-card)]"
      >
        Skip to content
      </a>

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-md border-b border-border"
            : "bg-background/40 backdrop-blur-md"
        }`}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => scrollToSection("#hero")}
              className="text-base font-semibold tracking-tight text-foreground hover:text-primary transition-colors"
            >
              Adam Zhu
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  onClick={() => scrollToSection(item.href)}
                  className={
                    activeId === item.id
                      ? "text-foreground bg-accent/60 hover:bg-accent/70 hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  {item.label}
                </Button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/90 backdrop-blur-md md:hidden">
          <div className="container mx-auto px-6 pt-20 pb-8">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  onClick={() => scrollToSection(item.href)}
                  className={
                    activeId === item.id
                      ? "text-foreground bg-accent/60 hover:bg-accent/70 justify-start"
                      : "text-muted-foreground hover:text-foreground justify-start"
                  }
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
