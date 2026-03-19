import { ReactNode } from "react";
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

