import type { Metadata } from "next";
import Link from "next/link";
import HeroCanvas from "@/components/HeroCanvas";
import AnimatedCounter from "@/components/AnimatedCounter";

export const metadata: Metadata = {
  title: "Common Compute | Batch AI compute on idle Macs",
  description:
    "Run embeddings, transcription, and OCR on a verified network of idle Macs — 80% cheaper than hyperscalers. Pay per task.",
};

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="hero hero-home">
        <div className="hero-backdrop" aria-hidden="true" />
        <HeroCanvas />
        <div className="container hero-center">
          <div className="hero-ticker" aria-hidden="true">
            <span className="hero-ticker-dot" />
            <span>network online</span>
            <span className="hero-ticker-sep" />
            <span>verified execution</span>
            <span className="hero-ticker-sep" />
            <span>pay per task</span>
            <span className="hero-ticker-cursor" />
          </div>
          <span className="eyebrow">Distributed AI Compute</span>
          <h1>
            Batch AI for{" "}
            <span className="accent-underline">80% less</span>.
          </h1>
          <p className="lede hero-lede-center">
            Run embeddings, transcription, and OCR on a verified network of idle Macs.
            Pay per completed task — not per hour.
          </p>
          <div className="cta-triad hero-actions hero-actions-center">
            <Link href="/developers" className="button">Get started</Link>
            <Link href="/providers" className="button secondary">Earn with your Mac</Link>
          </div>
          <div className="hero-meta">
            <span>No contracts</span>
            <span className="dot" aria-hidden="true" />
            <span>Pay per task</span>
            <span className="dot" aria-hidden="true" />
            <span>Signed Mac app</span>
          </div>
        </div>
      </section>

      {/* ── Pricing cards ── */}
      <section className="container section pricing-showcase">
        <div className="section-heading section-heading-center">
          <span className="eyebrow subtle">Pricing</span>
          <h2>Pay per task. Not per hour.</h2>
        </div>
        <div className="price-grid">
          <article className="price-card">
            <div className="price-card-head">
              <h3>Embeddings</h3>
              <span className="price-card-tag">RAG · Search · Retrieval</span>
            </div>
            <div className="price-amount">
              <strong>~<AnimatedCounter value={80} suffix="%" /></strong>
              <span>less than hyperscaler pricing</span>
            </div>
            <ul className="price-features">
              <li>Large document indexing</li>
              <li>Overnight corpus builds</li>
              <li>Verified completion</li>
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
              <span>archives and backlogs</span>
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
              <span>pay-per-task, no idle fees</span>
            </div>
            <ul className="price-features">
              <li>Scanned PDF extraction</li>
              <li>Dataset cleanup</li>
              <li>Transparent usage logs</li>
            </ul>
            <Link href="/developers#benchmark" className="button button-block">Request benchmark</Link>
          </article>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="container section">
        <div className="section-heading section-heading-center">
          <span className="eyebrow subtle">From users</span>
          <h2>Trusted by developers and Mac owners.</h2>
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

      {/* ── How it works ── */}
      <section className="container section">
        <div className="section-heading section-heading-center">
          <span className="eyebrow subtle">How it works</span>
          <h2>From submit to results in minutes.</h2>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <h3>Install</h3>
            <p>Mac owners install Common Compute and set resource limits.</p>
          </article>
          <article className="step-card">
            <span className="step-number">02</span>
            <h3>Submit</h3>
            <p>Developers submit jobs via API or dashboard.</p>
          </article>
          <article className="step-card">
            <span className="step-number">03</span>
            <h3>Verify</h3>
            <p>Jobs run across the network with built-in verification.</p>
          </article>
          <article className="step-card">
            <span className="step-number">04</span>
            <h3>Settle</h3>
            <p>Results return automatically. Providers get paid.</p>
          </article>
        </div>
      </section>

      {/* ── For Mac owners ── */}
      <section className="container section">
        <div className="section-heading section-heading-center">
          <span className="eyebrow subtle">For Mac owners</span>
          <h2>Your Mac earns while you sleep.</h2>
          <p>Full control — set limits, go idle, get paid.</p>
        </div>
        <div className="feature-list feature-list-center">
          <span>Only when idle</span>
          <span>Only while plugged in</span>
          <span>Only overnight</span>
          <span>Capped CPU &amp; memory</span>
          <span>Pause anytime</span>
        </div>
        <div className="hero-actions hero-actions-center" style={{ marginTop: 24 }}>
          <Link href="/download" className="button">Download for macOS</Link>
          <Link href="/providers" className="button secondary">How it works</Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="container section">
        <div className="section-heading section-heading-center">
          <span className="eyebrow subtle">FAQ</span>
          <h2>Common questions.</h2>
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
            <h3>What jobs run on my machine?</h3>
            <p>Only approved workloads — embeddings, transcription, OCR, and dataset preprocessing.</p>
          </article>
          <article className="faq-card">
            <h3>Can jobs access my personal files?</h3>
            <p>No. Execution happens in a sandboxed runtime.</p>
          </article>
          <article className="faq-card">
            <h3>How do I get paid?</h3>
            <p>Earnings are credited when verified jobs complete.</p>
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
            <h2>Lower costs or earn from idle hardware.</h2>
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
