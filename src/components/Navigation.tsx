import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";

export const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { label: "Home", to: "/" },
      { label: "About", to: "/about" },
      { label: "Education", to: "/education" },
      { label: "Skills", to: "/skills" },
      { label: "Projects", to: "/projects" },
      { label: "Work", to: "/experience" },
      { label: "Research", to: "/research" },
      { label: "Personal", to: "/personal" },
      { label: "Contact", to: "/contact" },
    ],
    [],
  );

  // keep the subtle "scrolled" style even on shorter pages
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
            <NavLink
              to="/"
              className="text-base font-semibold tracking-tight text-foreground hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Adam Zhu
            </NavLink>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  variant="ghost"
                  asChild
                >
                  <NavLink
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      isActive
                        ? "text-foreground bg-accent/60 hover:bg-accent/70 hover:text-foreground rounded-md px-3 py-2"
                        : "text-muted-foreground hover:text-foreground rounded-md px-3 py-2"
                    }
                  >
                    {item.label}
                  </NavLink>
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
                  key={item.to}
                  variant="ghost"
                  asChild
                >
                  <NavLink
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      isActive
                        ? "text-foreground bg-accent/60 hover:bg-accent/70 justify-start rounded-md px-3 py-2"
                        : "text-muted-foreground hover:text-foreground justify-start rounded-md px-3 py-2"
                    }
                  >
                    {item.label}
                  </NavLink>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
