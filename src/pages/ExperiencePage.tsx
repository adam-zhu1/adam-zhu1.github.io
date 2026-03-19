import { Experience } from "@/components/Experience";
import { PageShell } from "@/components/PageShell";

export default function ExperiencePage() {
  return (
    <PageShell title="Work" subtitle="A concise timeline. Each entry is scannable first, with details if you want them.">
      <Experience />
    </PageShell>
  );
}

