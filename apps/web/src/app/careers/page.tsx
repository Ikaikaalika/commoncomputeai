import type { Metadata } from "next";
import SimplePage from "@/components/SimplePage";

export const metadata: Metadata = { title: "Careers" };

export default function CareersPage() {
  return (
    <SimplePage
      eyebrow="Careers"
      title="We're hiring builders."
      body="Common Compute is a small team building infrastructure for the next decade of AI compute. If you care about distributed systems, deterministic pricing, and idle hardware put to work — get in touch."
      cta={{ label: "Email the team", href: "mailto:hello@commoncompute.ai" }}
    />
  );
}
