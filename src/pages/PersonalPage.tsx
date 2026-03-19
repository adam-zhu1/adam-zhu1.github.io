import { PersonalInterests } from "@/components/PersonalInterests";
import { PageShell } from "@/components/PageShell";

export default function PersonalPage() {
  return (
    <PageShell
      title="Personal"
      subtitle="A few things I enjoy outside academics: music, photography, and travel."
    >
      <PersonalInterests />
    </PageShell>
  );
}

