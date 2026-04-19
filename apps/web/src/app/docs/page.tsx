import type { Metadata } from "next";
import DocsLayout from "@/components/DocsLayout";

export const metadata: Metadata = {
  title: "Docs",
  description: "Getting started, SDK install, workloads, guarantees, and provider setup.",
};

export default function DocsPage() {
  return <DocsLayout slug="intro" />;
}
