import type { Metadata } from "next";
import SimplePage from "@/components/SimplePage";

export const metadata: Metadata = { title: "Status" };

export default function StatusPage() {
  return (
    <SimplePage
      eyebrow="Status"
      title="System status."
      body="The live network status page is being wired up. Once it's online, this page will show real-time capacity, queue depth, and per-region availability."
    />
  );
}
