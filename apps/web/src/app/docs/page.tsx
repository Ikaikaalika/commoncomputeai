import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Getting started, provider setup, developer API, verification, scheduling, earnings, and security.",
};

export default function DocsPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="container page-hero-inner">
          <span className="eyebrow subtle">Docs</span>
          <h1>Documentation for providers and developers.</h1>
          <p className="lede">
            Getting started, provider setup, developer API, workload types,
            verification model, scheduling model, earnings model, and security
            overview.
          </p>
          <div className="hero-actions" style={{ marginTop: 24 }}>
            <Link href="/download" className="button">
              Download the app
            </Link>
            <Link href="/developers" className="button secondary">
              Get API access
            </Link>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">Sections</span>
          <h2>Everything you need to get started.</h2>
        </div>
        <div className="docs-grid">
          {[
            { title: "Getting started", body: "Install the app, create an account, and understand the first run path." },
            { title: "Provider setup", body: "Set schedule, power rules, CPU limits, and pause controls." },
            { title: "Developer API", body: "Submit jobs, check status, and retrieve verified results." },
            { title: "Workload types", body: "Embeddings, transcription, OCR, preprocessing, and batch inference." },
            { title: "Verification model", body: "How tasks are checked before payout and completion." },
            { title: "Scheduling model", body: "How jobs are routed and retried across providers." },
            { title: "Earnings model", body: "How providers earn when verified jobs complete successfully." },
            { title: "Security overview", body: "Signed app distribution, execution boundaries, and runtime controls." },
          ].map((item) => (
            <article key={item.title} className="doc-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
