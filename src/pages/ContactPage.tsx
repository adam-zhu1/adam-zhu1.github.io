import { Contact } from "@/components/Contact";
import { PageShell } from "@/components/PageShell";

export default function ContactPage() {
  return (
    <PageShell
      title="Contact"
      subtitle="The fastest way to reach me is email. I usually respond within a day."
    >
      <Contact />
    </PageShell>
  );
}

