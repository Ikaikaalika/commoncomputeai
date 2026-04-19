import type { Metadata } from "next";
import SimplePage from "@/components/SimplePage";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <SimplePage
      eyebrow="Privacy"
      title="Privacy policy."
      body="The full privacy policy will be published when the network launches publicly. In short: we don't retain task inputs or outputs by default, we don't sell data, and provider machines never see your account-level information."
    />
  );
}
