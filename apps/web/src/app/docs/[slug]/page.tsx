import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DocsLayout from "@/components/DocsLayout";
import { DOCS_CONTENT } from "@/components/docs-content";

export function generateStaticParams() {
  return Object.keys(DOCS_CONTENT).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = DOCS_CONTENT[slug];
  if (!entry) return { title: "Docs" };
  return {
    title: `${entry.title} · Docs`,
    description: entry.body.find((b) => b.kind === "p")?.text?.slice(0, 160),
  };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!DOCS_CONTENT[slug]) notFound();
  return <DocsLayout slug={slug} />;
}
