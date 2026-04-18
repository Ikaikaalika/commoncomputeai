import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "About",
  description: "Common Compute is building a trusted distributed compute network powered by idle Macs.",
};

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="About"
      headline="Common Compute is building a trusted distributed compute network powered by idle Macs."
      lead="The product is designed for affordable batch AI workloads, fair provider payouts, and clear execution controls."
      ctaPrimary={{ label: "Download", href: "/download" }}
      ctaSecondary={{ label: "For developers", href: "/developers" }}
      cards={[
        { title: "Trust", body: "Transparent usage, verified work, and no hidden background activity." },
        { title: "Efficiency", body: "Lower-cost AI execution that uses existing hardware better." },
        { title: "Fairness", body: "A marketplace that works for both compute providers and buyers." },
      ]}
    />
  );
}
