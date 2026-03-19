import { Projects } from "@/components/Projects";
import { PageShell } from "@/components/PageShell";

export default function ProjectsPage() {
  return (
    <PageShell
      title="Projects"
      subtitle="Selected work spanning forensic statistics, applied research, and STEM leadership."
    >
      <Projects />
    </PageShell>
  );
}

