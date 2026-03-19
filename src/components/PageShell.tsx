import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";

export function PageShell({
  children,
  title,
  subtitle,
  introMode = false,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  introMode?: boolean;
}) {
  return (
    <>
      <Navigation />
      <main
        id="content"
        className={`min-h-screen pt-24 pb-16 ${introMode ? "about-shell-intro" : ""}`}
      >
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
                <NavLink to="/">
                  <ArrowLeft className="h-4 w-4" />
                  <span
                    className={
                      introMode ? "about-slide about-slide-up about-slide-d1" : ""
                    }
                  >
                    Back to home
                  </span>
                </NavLink>
              </Button>
            </div>
            {(title || subtitle) && (
              <header className="mb-10">
                {title && (
                  <h1
                    className={`text-3xl md:text-4xl font-semibold tracking-tight ${
                      introMode ? "about-slide about-slide-left about-slide-d2" : ""
                    }`}
                  >
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p
                    className={`mt-2 text-muted-foreground max-w-2xl ${
                      introMode ? "about-slide about-slide-right about-slide-d3" : ""
                    }`}
                  >
                    {subtitle}
                  </p>
                )}
              </header>
            )}
            {children}
          </div>
        </div>
      </main>
    </>
  );
}

