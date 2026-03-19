import { PersonalInterests } from "@/components/PersonalInterests";
import { PageShell } from "@/components/PageShell";

export default function PersonalPage() {
  return (
    <PageShell title="Personal" subtitle="Interests beyond academics.">
      <PersonalInterests />
    </PageShell>
  );
}

