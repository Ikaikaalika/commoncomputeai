import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Common Compute | Affordable AI compute powered by idle Macs",
  description:
    "One-click batch AI compute for 80% less — embeddings, transcription, OCR, and dataset preprocessing on a verified network of idle Macs.",
};

export default function HomePage() {
  return (
    <>
      {/* ── Hero (centered, Thunder-style) ── */}
      <section className="hero hero-home">
        <div className="hero-backdrop" aria-hidden="true" />
        <div className="container hero-center">
          <span className="eyebrow">World&apos;s most affordable batch compute</span>
          <h1>
            One-click batch AI compute for{" "}
            <span className="accent-underline">80% less</span>.
          </h1>
          <p className="lede hero-lede-center">
            Run embeddings, transcription, OCR, and dataset preprocessing on a
            verified network of idle Macs — or earn from the Apple Silicon you
            already own.
          </p>
          <div className="cta-triad hero-actions hero-actions-center">
            <Link href="/developers" className="button">Get started</Link>
            <Link href="/providers" className="button secondary">Earn with your Mac</Link>
          </div>
          <div className="hero-meta">
            <span>No contracts</span>
            <span className="dot" aria-hidden="true" />
            <span>Pay for completed work</span>
            <span className="dot" aria-hidden="true" />
            <span>Signed Mac app</span>
          </div>
        </div>
      </section>

      {/* ── Unmatched pricing (GPU-card style grid) ── */}
      <section className="container section pricing-showcase">
        <div className="section-heading section-heading-center">
          <span className="eyebrow subtle">Unmatched pricing</span>
          <h2>Batch compute at a fraction of hyperscaler prices.</h2>
        </div>
        <div className="price-grid">
          <article className="price-card">
            <div className="price-card-head">
              <h3>Embeddings</h3>
              <span className="price-card-tag">RAG · Search · Retrieval</span>
            </div>
            <div className="price-amount">
              <strong>~80%</strong>
              <span>cheaper vs. hyperscaler pricing</span>
            </div>
            <ul className="price-features">
              <li>Large document indexing</li>
              <li>Overnight corpus builds</li>
              <li>Verified completion per task</li>
            </ul>
            <Link href="/developers#benchmark" className="button button-block">Request benchmark</Link>
          </article>

          <article className="price-card featured">
            <div className="price-card-head">
              <h3>Transcription</h3>
              <span className="price-card-tag">Whisper · Audio pipelines</span>
            </div>
            <div className="price-amount">
              <strong>Batch</strong>
              <span>archives + backlogs, not live serving</span>
            </div>
            <ul className="price-features">
              <li>Scheduled media pipelines</li>
              <li>Automatic retry routing</li>
              <li>Provider reputation routing</li>
            </ul>
            <Link href="/developers#benchmark" className="button button-block">Request benchmark</Link>
          </article>

          <article className="price-card">
            <div className="price-card-head">
              <h3>OCR &amp; Prep</h3>
              <span className="price-card-tag">Scanned docs · Datasets</span>
            </div>
            <div className="price-amount">
              <strong>Predictable</strong>
              <span>pay-per-task, no idle infra fees</span>
            </div>
            <ul className="price-features">
              <li>Scanned PDF extraction</li>
              <li>Dataset cleanup pipelines</li>
              <li>Transparent usage logs</li>
            </ul>
            <Link href="/developers#benchmark" className="button button-block">Request benchmark</Link>
          </article>
        </div>
      </section>

      {/* ── Loved by developers ── */}
      <section className="container section">
        <div className="section-heading section-heading-center">
          <span className="eyebrow subtle">Loved by developers</span>
          <h2>A compute marketplace built for batch AI workloads.</h2>
        </div>
        <div className="quote-grid">
          <article className="quote-card">
            <p>
              &ldquo;Ship indexing jobs overnight at a fraction of cloud prices.
              The verification path is the part I didn&apos;t know I needed.&rdquo;
            </p>
            <div className="quote-meta">
              <strong>ML Engineer</strong>
              <span>Document AI</span>
            </div>
          </article>
          <article className="quote-card">
            <p>
              &ldquo;I set it to run while my Mac is idle and plugged in. Earnings
              land without me thinking about it.&rdquo;
            </p>
            <div className="quote-meta">
              <strong>Designer</strong>
              <span>Provider · SF</span>
            </div>
          </article>
          <article className="quote-card">
            <p>
              &ldquo;Predictable per-task pricing for transcription backlogs beats
              paying for a live GPU we don&apos;t need.&rdquo;
            </p>
            <div className="quote-meta">
              <strong>Founder</strong>
              <span>Media Ops</span>
            </div>
          </article>
        </div>
      </section>

      {/* ── End-to-end flexibility (4 steps) ── */}
      <section className="container section">
        <div className="section-heading section-heading-center">
          <span className="eyebrow subtle">End-to-end flexibility</span>
          <h2>A compute path built for real workloads — not benchmarks.</h2>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <h3>Install</h3>
            <p>Mac owners install Common Compute and choose when jobs run.</p>
          </article>
          <article className="step-card">
            <span className="step-number">02</span>
            <h3>Submit</h3>
            <p>Developers submit datasets or call the API from anywhere.</p>
          </article>
          <article className="step-card">
            <span className="step-number">03</span>
            <h3>Verify</h3>
            <p>Jobs distribute across the network and run with verification.</p>
          </article>
          <article className="step-card">
            <span className="step-number">04</span>
            <h3>Settle</h3>
            <p>Results return automatically. Providers get paid on completion.</p>
          </article>
        </div>
      </section>

      {/* ── Positioning ── */}
      <section className="container section">
        <div className="section-heading section-heading-center">
          <span className="eyebrow subtle">Positioning</span>
          <h2>Cheaper than hyperscalers for the workloads that don&apos;t need them.</h2>
          <p>
            Optimized for batch, scheduled, and overnight pipelines — not live
            interactive inference.
          </p>
        </div>
        <div className="statement-grid">
          <article className="stack-card">
            <h3>Not real-time GPU serving.</h3>
            <p>Use Common Compute for batch jobs, not live interactive inference.</p>
          </article>
          <article className="stack-card">
            <h3>Not training clusters.</h3>
            <p>
              The platform is built for practical execution, not grand claims
              about replacing every cloud system.
            </p>
          </article>
          <article className="stack-card">
            <h3>Just efficient batch compute.</h3>
            <p>Lower cost, easy setup, safe execution, predictable outcomes.</p>
          </article>
        </div>
      </section>

      {/* ── For Mac owners ── */}
      <section className="container section">
        <div className="section-heading section-heading-center">
          <span className="eyebrow subtle">For Mac owners</span>
          <h2>Put your Mac&apos;s idle time to work.</h2>
          <p>
            Choose exactly when Common Compute runs. Track earnings directly in
            the app.
          </p>
        </div>
        <div className="feature-list feature-list-center">
          <span>Only when idle</span>
          <span>Only while plugged in</span>
          <span>Only overnight</span>
          <span>Capped CPU usage</span>
          <span>Capped memory usage</span>
        </div>
        <div className="hero-actions hero-actions-center" style={{ marginTop: 20 }}>
          <Link href="/download" className="button">Download for macOS</Link>
          <Link href="/providers" className="button secondary">Start earning with your Mac</Link>
        </div>
      </section>

      {/* ── For developers ── */}
      <section className="container section">
        <div className="section-heading section-heading-center">
          <span className="eyebrow subtle">For developers</span>
          <h2>Run batch inference without premium cloud pricing.</h2>
          <p>
            Ideal for RAG indexing, vector embeddings, Whisper transcription,
            OCR pipelines, and dataset preparation.
          </p>
        </div>
        <div className="bullet-grid">
          <article className="feature-card">
            <h3>RAG indexing</h3>
            <p>Batch document work without paying live-serving prices.</p>
          </article>
          <article className="feature-card">
            <h3>Vector embeddings</h3>
            <p>Run large embedding pipelines on practical compute.</p>
          </article>
          <article className="feature-card">
            <h3>Whisper transcription</h3>
            <p>Process archives and backlogs with verified completion.</p>
          </article>
          <article className="feature-card">
            <h3>OCR pipelines</h3>
            <p>Turn scanned pages into usable text and structured output.</p>
          </article>
          <article className="feature-card">
            <h3>Dataset preparation</h3>
            <p>Handle preprocessing jobs that don&apos;t need premium cloud capacity.</p>
          </article>
          <article className="feature-card">
            <h3>Scheduled pipelines</h3>
            <p>Submit nightly jobs via dashboard or API and retrieve results.</p>
          </article>
        </div>
      </section>

      {/* ── Trust ── */}
      <section className="container section">
        <div className="section-heading section-heading-center">
          <span className="eyebrow subtle">Trust</span>
          <h2>Built for predictable, verifiable execution.</h2>
        </div>
        <div className="trust-grid">
          <article className="feature-card">
            <h3>Task verification</h3>
            <p>Every workload includes task verification.</p>
          </article>
          <article className="feature-card">
            <h3>Retry scheduling</h3>
            <p>Retry routing keeps work moving if a task fails.</p>
          </article>
          <article className="feature-card">
            <h3>Completion guarantees</h3>
            <p>Completion is tracked rather than assumed.</p>
          </article>
          <article className="feature-card">
            <h3>Provider reputation</h3>
            <p>Reputation improves routing and reliability decisions.</p>
          </article>
          <article className="feature-card">
            <h3>Usage tracking</h3>
            <p>Providers can see usage and earnings clearly.</p>
          </article>
          <article className="feature-card">
            <h3>Signed Mac app</h3>
            <p>Execution happens within controlled runtime limits.</p>
          </article>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="container section">
        <div className="section-heading section-heading-center">
          <span className="eyebrow subtle">FAQ</span>
          <h2>Common questions about privacy, security, and earnings.</h2>
        </div>
        <div className="faq-grid">
          <article className="faq-card">
            <h3>Does Common Compute slow down my Mac?</h3>
            <p>No. You choose when jobs run and how much compute they can use.</p>
          </article>
          <article className="faq-card">
            <h3>Can I pause compute sharing?</h3>
            <p>Yes. Pause anytime from the menu bar.</p>
          </article>
          <article className="faq-card">
            <h3>What kinds of jobs run on my machine?</h3>
            <p>Only approved workloads such as embeddings, transcription, OCR, and dataset preprocessing.</p>
          </article>
          <article className="faq-card">
            <h3>Can jobs access my personal files?</h3>
            <p>No. Execution happens in a controlled runtime sandbox.</p>
          </article>
          <article className="faq-card">
            <h3>How do I get paid?</h3>
            <p>Providers receive earnings when verified jobs complete successfully.</p>
          </article>
          <article className="faq-card">
            <h3>Is this crypto mining?</h3>
            <p>No. Common Compute runs AI workloads only.</p>
          </article>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="container section final-cta">
        <div className="final-cta-panel">
          <div>
            <span className="eyebrow subtle">Common Compute</span>
            <h2>Use spare compute better.</h2>
            <p>
              Lower AI processing costs or earn from idle hardware. Common
              Compute gives both sides a fairer option.
            </p>
          </div>
          <div className="cta-triad hero-actions">
            <Link href="/developers" className="button">Get started</Link>
            <Link href="/providers" className="button secondary">Start earning</Link>
          </div>
        </div>
      </section>
    </>
  );
}
