import type { Metadata } from "next";
import SimplePage from "@/components/SimplePage";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <SimplePage
      eyebrow="Support"
      title="Get in touch."
      body="Email hello@commoncompute.ai for anything — billing questions, integration help, capacity requests, provider issues. We answer within one business day."
      cta={{ label: "Email the team", href: "mailto:hello@commoncompute.ai" }}
    />
  );
}
