import { Projects } from "@/components/Projects";
import { PageShell } from "@/components/PageShell";

export default function ProjectsPage() {
  return (
    <PageShell title="Projects" subtitle="Selected work and links.">
      <Projects />
    </PageShell>
  );
}

