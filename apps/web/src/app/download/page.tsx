import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Download",
  description: "Download Common Compute for Mac.",
};

export default function DownloadPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="container page-hero-inner">
          <span className="eyebrow subtle">Download</span>
          <h1>Download Common Compute for Mac.</h1>
          <p className="lede">
            The Common Compute Mac app is signed with Developer ID and notarized
            by Apple for direct distribution outside the Mac App Store. That
            helps Gatekeeper verify the app when users download and open it.
          </p>
          <div className="hero-actions" style={{ marginTop: 24 }}>
            <Link href="#install-steps" className="button">
              Download now
            </Link>
            <Link href="/security" className="button secondary">
              Read security
            </Link>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">Requirements</span>
          <h2>macOS Ventura or newer. Apple Silicon recommended. Intel supported optionally.</h2>
        </div>
        <div className="trust-grid">
          {[
            { title: "Signed Mac app", body: "Use Developer ID signing for direct downloads." },
            { title: "Apple notarized", body: "Gatekeeper can verify the build when users open it." },
            { title: "Clear controls", body: "Providers choose limits before compute sharing starts." },
          ].map((item) => (
            <article key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Install steps */}
      <section className="container section" id="install-steps">
        <div className="section-heading">
          <span className="eyebrow subtle">Install steps</span>
          <h2>Download. Open. Sign in. Set limits. Start earning.</h2>
        </div>
        <div className="steps-grid">
          {[
            { n: 1, title: "Download", body: "Grab the Mac app from the site or CDN." },
            { n: 2, title: "Open app", body: "Launch the signed, notarized build." },
            { n: 3, title: "Sign in", body: "Create an account or use an existing one." },
            { n: 4, title: "Set compute limits", body: "Choose schedule, CPU caps, and power requirements." },
            { n: 5, title: "Start earning", body: "Receive verified work when the machine is idle." },
          ].map((step) => (
            <article key={step.n} className="step-card">
              <span className="step-number">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Trust copy */}
      <section className="container section statement-band">
        <p>
          Common Compute is signed with Developer ID and notarized for secure
          installation. Gatekeeper verifies the build on first launch so you
          know the app has not been tampered with.
        </p>
      </section>

      {/* CTA */}
      <section className="container section final-cta">
        <div className="final-cta-panel">
          <div>
            <span className="eyebrow subtle">Get started</span>
            <h2>Download now.</h2>
            <p>
              Install Common Compute, set your limits, and let the idle Mac do
              useful work.
            </p>
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
