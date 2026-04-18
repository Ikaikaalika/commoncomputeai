import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Support",
  description: "Support options for providers and developers.",
};

export default function SupportPage() {
  return (
    <ContentPage
      eyebrow="Support"
      headline="Help for providers, developers, and evaluators."
      lead="Support should be direct. Keep the contact path visible, keep the onboarding docs current, and keep the answers practical."
      ctaPrimary={{ label: "Read docs", href: "/docs" }}
      ctaSecondary={{ label: "Download", href: "/download" }}
      cards={[
        { title: "Email", body: "support@commoncompute.ai" },
        { title: "Onboarding", body: "Follow the provider setup and developer API docs first." },
        { title: "FAQ", body: "Most launch questions are answered on the download and security pages." },
      ]}
    />
  );
}
