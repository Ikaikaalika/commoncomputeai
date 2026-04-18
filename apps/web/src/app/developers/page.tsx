import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For Developers",
  description:
    "Run batch inference and preprocessing workloads at lower cost through the dashboard or API.",
};

export default function DevelopersPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero" id="benchmark">
        <div className="container page-hero-inner">
          <span className="eyebrow subtle">For Developers</span>
          <h1>Batch AI workloads at lower cost.</h1>
          <p className="lede">
            Submit jobs through API or dashboard and receive verified results
            automatically.
          </p>
          <div className="hero-actions" style={{ marginTop: 24 }}>
            <Link href="/docs" className="button">
              Get API access
            </Link>
            <Link href="#benchmark-request" className="button secondary">
              Run a benchmark
            </Link>
          </div>
        </div>
      </section>

      {/* Supported workloads */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">Supported workloads</span>
          <h2>Built for batch work, not live serving.</h2>
        </div>
        <div className="bullet-grid">
          {[
            { title: "Embeddings", body: "Generate vectors for large corpora." },
            { title: "Transcription", body: "Convert audio archives into text." },
            { title: "OCR", body: "Extract text from documents and scanned PDFs." },
            { title: "Dataset preprocessing", body: "Prepare inputs for downstream workflows." },
            { title: "Image inference", body: "Run image jobs that can wait for verified completion." },
          ].map((item) => (
            <article key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Best use cases */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">Best use cases</span>
          <h2>
            Fit the workloads that do not need premium always-on cloud pricing.
          </h2>
        </div>
        <div className="trust-grid">
          {[
            { title: "Index millions of documents overnight", body: "Use distributed compute when throughput matters more than latency." },
            { title: "Transcribe audio archives", body: "Process historical libraries as a batch queue." },
            { title: "Prepare training datasets", body: "Run the boring parts of the pipeline on cheaper compute." },
            { title: "Process scanned PDFs", body: "Convert document backlogs into structured text." },
            { title: "Run large embedding pipelines", body: "Scale out work without paying hyperscaler prices for idle capacity." },
          ].map((item) => (
            <article key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* API flow */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">Sample API flow</span>
          <h2>Upload dataset. Submit job. Track progress. Download results.</h2>
        </div>
        <div className="steps-grid">
          {[
            { n: 1, title: "Upload dataset", body: "Send the input the job needs." },
            { n: 2, title: "Submit job", body: "Create the workload from the dashboard or API." },
            { n: 3, title: "Track progress", body: "Watch verification and completion state as the job runs." },
            { n: 4, title: "Download results", body: "Fetch output when the verified work is done." },
          ].map((step) => (
            <article key={step.n} className="step-card">
              <span className="step-number">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
        <div className="code-panel">
          <pre>{`POST /customers/jobs
GET  /customers/jobs/{job_id}
GET  /customers/me

Input: dataset URI or uploaded artifacts
Output: verified batch results`}</pre>
        </div>
      </section>

      {/* Integrations */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">Integrations</span>
          <h2>Designed to fit the tools teams already use.</h2>
        </div>
        <div className="trust-grid">
          {[
            { title: "LangChain", body: "Useful when Common Compute is one backend in a larger pipeline." },
            { title: "LlamaIndex", body: "Fits indexing and retrieval workflows." },
            { title: "Airflow", body: "Use scheduled batch orchestration." },
            { title: "Ray", body: "Coordinate distributed tasks across the network." },
            { title: "Prefect", body: "Keep the job flow explicit and observable." },
          ].map((item) => (
            <article key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container section final-cta" id="benchmark-request">
        <div className="final-cta-panel">
          <div>
            <span className="eyebrow subtle">Get started</span>
            <h2>Run a benchmark.</h2>
            <p>Submit a workload and see verified results before committing.</p>
          </div>
          <div className="cta-triad hero-actions">
            <Link href="/developers#benchmark" className="button">
              Run a benchmark
            </Link>
            <Link href="/docs" className="button secondary">
              Request estimate
            </Link>
            <Link href="/providers" className="button ghost">
              Start earning with your Mac
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
