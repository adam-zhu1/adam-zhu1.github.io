import { Link } from "react-router-dom";

const nav = [
  { label: "About", to: "/about", soon: true },
  { label: "Projects", to: "/projects", soon: true },
  { label: "Contact", to: "/contact", soon: true },
];

export default function Home() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line/80 bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Adam Zhu
          </span>
          <nav className="flex gap-6 text-sm font-medium text-muted">
            {nav.map((item) =>
              item.soon ? (
                <span
                  key={item.label}
                  className="cursor-not-allowed opacity-50"
                  title="Coming soon"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  className="text-ink transition hover:text-accent"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16 sm:pt-24">
        <p className="animate-[fade-up_0.7s_ease-out_both] text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Portfolio — restart branch
        </p>

        <h1 className="animate-[fade-up_0.85s_ease-out_0.05s_both] mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl md:text-6xl">
          Statistics &amp; machine learning at CMU.
        </h1>

        <p className="animate-[fade-up_0.95s_ease-out_0.12s_both] mt-8 max-w-measure text-lg leading-relaxed text-muted">
          This site was reset to a clean foundation: no component library, no
          template chrome—just type, color, and room to grow. Next passes can add
          sections, motion, and case studies with a clear visual language.
        </p>

        <div className="animate-[fade-up_1.05s_ease-out_0.2s_both] mt-12 flex flex-wrap gap-4">
          <a
            href="https://github.com/adam-zhu1"
            className="inline-flex items-center rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:border-accent/40 hover:text-accent"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <span className="inline-flex items-center rounded-full border border-dashed border-line px-5 py-2.5 text-sm font-medium text-muted">
            Résumé — wire link when ready
          </span>
        </div>
      </main>

      <footer className="border-t border-line/80">
        <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-muted">
          © {new Date().getFullYear()} Adam Zhu · Built with Vite &amp; React
        </div>
      </footer>

      <style>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
