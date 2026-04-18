import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Pay for completed work, not idle infrastructure.",
};

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="container page-hero-inner">
          <span className="eyebrow subtle">Pricing</span>
          <h1>Pay for completed work, not idle infrastructure.</h1>
          <p className="lede">
            Common Compute is optimized for batch inference workloads.
          </p>
        </div>
      </section>

      {/* Positioning */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">Positioning</span>
          <h2>
            Pricing depends on workload type, dataset size, completion time
            target, and verification level.
          </h2>
        </div>
        <p className="section-intro">
          Common Compute is built for batch inference workloads. The right price
          depends on the job, the amount of data, and how strict the verification
          path needs to be.
        </p>
      </section>

      {/* Example pricing table */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">Example pricing table</span>
          <h2>Example benchmarks by workload type.</h2>
        </div>
        <div className="table-shell">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Workload</th>
                <th>Fit</th>
                <th>Current benchmark</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Embeddings</td>
                <td>Large document and retrieval indexing runs</td>
                <td>Request estimate</td>
              </tr>
              <tr>
                <td>Transcription</td>
                <td>Audio archives and scheduled media pipelines</td>
                <td>Request estimate</td>
              </tr>
              <tr>
                <td>OCR</td>
                <td>Scanned PDFs and document extraction batches</td>
                <td>Request estimate</td>
              </tr>
              <tr>
                <td>Preprocessing</td>
                <td>Dataset cleanup and pipeline preparation</td>
                <td>Request estimate</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="container section final-cta">
        <div className="final-cta-panel">
          <div>
            <span className="eyebrow subtle">Get started</span>
            <h2>Request an estimate for your workload.</h2>
          </div>
          <div className="cta-triad hero-actions">
            <Link href="/providers" className="button secondary">
              Start earning with your Mac
            </Link>
            <Link href="/developers" className="button">
              Run a batch workload
            </Link>
            <Link href="/developers#benchmark" className="button ghost">
              Request benchmark
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
