import type { Metadata } from "next";
import SimplePage from "@/components/SimplePage";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <SimplePage
      eyebrow="Terms"
      title="Terms of service."
      body="The full terms will be published when the network launches publicly. Until then, contact us for the early-access agreement."
      cta={{ label: "Email the team", href: "mailto:hello@commoncompute.ai" }}
    />
  );
}
