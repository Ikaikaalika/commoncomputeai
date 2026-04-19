import type { Metadata } from "next";
import SimplePage from "@/components/SimplePage";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <SimplePage
      eyebrow="About"
      title="A public network for batch AI compute."
      body="Common Compute is building a distributed network for batch AI workloads. We pool the idle capacity of Apple Silicon Macs into a single, deterministically priced compute layer — cheaper than hyperscalers, paid out fairly to the people who run the hardware."
      cta={{ label: "Read the docs", href: "/docs" }}
    />
  );
}
