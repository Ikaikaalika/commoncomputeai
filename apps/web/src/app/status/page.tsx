import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Status",
  description: "Operational status and system notes.",
};

export default function StatusPage() {
  return (
    <ContentPage
      eyebrow="Status"
      headline="Operational status and system notes."
      lead="This page is the source of truth for uptime, incidents, and scheduled maintenance."
      ctaPrimary={{ label: "Read security", href: "/security" }}
      ctaSecondary={{ label: "Contact support", href: "/support" }}
      cards={[
        { title: "Platform", body: "Operational", note: "No current incidents." },
        { title: "Jobs", body: "Verified execution enabled", note: "Retries and completion checks active." },
        { title: "Mac app", body: "Downloadable", note: "Developer ID signing and notarization required." },
      ]}
    />
  );
}
