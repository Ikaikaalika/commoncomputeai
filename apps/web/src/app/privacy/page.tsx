import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy principles for the Common Compute marketplace.",
};

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Privacy"
      headline="Privacy by default."
      lead="The platform explains what runs, when it runs, and what data is handled so users can make an informed choice."
      ctaPrimary={{ label: "View terms", href: "/terms" }}
      ctaSecondary={{ label: "Download", href: "/download" }}
      cards={[
        { title: "Control", body: "Providers choose when their machine is available for work." },
        { title: "Scope", body: "Only approved workloads run inside the execution environment." },
        { title: "Transparency", body: "Usage, earnings, and task completion are visible." },
      ]}
    />
  );
}
