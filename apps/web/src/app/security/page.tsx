import type { Metadata } from "next";
import SimplePage from "@/components/SimplePage";

export const metadata: Metadata = {
  title: "Security",
  description: "How tasks are isolated, signed, and audited across the network.",
};

export default function SecurityPage() {
  return (
    <SimplePage
      eyebrow="Security"
      title="Security and verification, built in."
      body="Every task runs in a signed, ephemeral container on a provider machine. No shared state between tenants, no outbound network access by default, no logs retained unless you opt in. Every result is co-signed by the executing node and our coordinator and exportable as JSONL audit trail. See the docs for the full model."
      cta={{ label: "Read the security docs", href: "/docs/sandbox" }}
    />
  );
}
