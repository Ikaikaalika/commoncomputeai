import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Careers",
  description: "Open roles at Common Compute.",
};

export default function CareersPage() {
  return (
    <ContentPage
      eyebrow="Careers"
      headline="Hiring later."
      lead="The company is not framing itself as a recruiting site yet. This page exists to keep the sitemap complete and can grow into openings later."
      ctaPrimary={{ label: "Home", href: "/" }}
      cards={[
        { title: "Product", body: "Build a system that is trustworthy enough for both providers and customers." },
        { title: "Infrastructure", body: "Ship practical tooling for Mac owners and batch AI developers." },
        { title: "Later", body: "Open roles can land here when the team is ready." },
      ]}
    />
  );
}
