import type { Metadata } from "next";
import SimplePage from "@/components/SimplePage";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <SimplePage
      eyebrow="Blog"
      title="Notes from the network."
      body="The blog is coming soon. We'll publish post-mortems, capacity reports, and pricing changes here. In the meantime, the docs are the best reference for what the network can run today."
      cta={{ label: "Read the docs", href: "/docs" }}
    />
  );
}
