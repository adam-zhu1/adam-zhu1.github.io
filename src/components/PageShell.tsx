import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";

export function PageShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <>
      <Navigation />
      <main id="content" className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
                <NavLink to="/">
                  <ArrowLeft className="h-4 w-4" />
                  Back to home
                </NavLink>
              </Button>
            </div>
            {(title || subtitle) && (
              <header className="mb-10">
                {title && (
                  <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
                )}
                {subtitle && <p className="mt-2 text-muted-foreground max-w-2xl">{subtitle}</p>}
              </header>
            )}
            {children}
          </div>
        </div>
      </main>
    </>
  );
}

