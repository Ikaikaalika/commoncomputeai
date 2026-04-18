import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "Marketplace terms and service rules.",
};

export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Terms"
      headline="Simple service rules for a practical marketplace."
      lead="Provider responsibilities, customer obligations, and service limits in plain English."
      ctaPrimary={{ label: "Read privacy", href: "/privacy" }}
      ctaSecondary={{ label: "Get support", href: "/support" }}
      cards={[
        { title: "Providers", body: "Set limits, keep the app current, and run approved workloads only." },
        { title: "Customers", body: "Submit valid jobs, respect verification outcomes, and pay for completed work." },
        { title: "Platform", body: "Operate the marketplace honestly and keep the rules visible." },
      ]}
    />
  );
}
