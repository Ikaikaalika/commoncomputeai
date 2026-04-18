import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Blog",
  description: "Product notes, release updates, and launch documentation.",
};

export default function BlogPage() {
  return (
    <ContentPage
      eyebrow="Blog"
      headline="Release notes, launch updates, and product writing."
      lead="The blog will carry short updates on shipping, benchmarks, security, and marketplace progress."
      ctaPrimary={{ label: "Read docs", href: "/docs" }}
      ctaSecondary={{ label: "View status", href: "/status" }}
      cards={[
        { title: "Launch notes", body: "What changed, what shipped, and what is next." },
        { title: "Benchmarks", body: "Updates on workload types, performance, and pricing direction." },
        { title: "Product writing", body: "Clear explanations of the platform and its tradeoffs." },
      ]}
    />
  );
}
