import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="text-xs text-muted-foreground">404</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            The path <span className="font-mono text-foreground/90">{location.pathname}</span> doesn’t exist.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <Button asChild>
              <NavLink to="/">Go home</NavLink>
            </Button>
            <Button asChild variant="outline">
              <NavLink to="/contact">Contact</NavLink>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
