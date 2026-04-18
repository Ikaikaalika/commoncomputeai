import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For Mac Owners",
  description:
    "Put your Mac's idle time to work on your schedule and earn when verified jobs complete.",
};

export default function ProvidersPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="container page-hero-inner">
          <span className="eyebrow subtle">For Mac Owners</span>
          <h1>Earn from your idle Mac.</h1>
          <p className="lede">
            Common Compute runs only within the limits you choose.
          </p>
          <div className="hero-actions" style={{ marginTop: 24 }}>
            <Link href="/download" className="button">
              Download the app
            </Link>
            <Link href="/security" className="button secondary">
              Read security
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">How it works</span>
          <h2>
            Install the app. Choose resource limits. Stay idle or keep working.
            Earn when jobs complete.
          </h2>
        </div>
        <div className="steps-grid">
          {[
            { n: 1, title: "Install the app", body: "Download and open the signed, notarized Mac app and sign in." },
            { n: 2, title: "Choose resource limits", body: "Set how much compute the app can use." },
            { n: 3, title: "Stay idle or keep working", body: "Your machine stays yours while Common Compute respects the schedule you set." },
            { n: 4, title: "Earn when jobs complete", body: "Verified jobs turn into earnings in real time." },
          ].map((step) => (
            <article key={step.n} className="step-card">
              <span className="step-number">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Control features */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">Control features</span>
          <h2>You decide.</h2>
        </div>
        <div className="copy-grid">
          {[
            { title: "Run only overnight", body: "Use spare hours without turning the Mac into a mystery background machine." },
            { title: "Run only when idle", body: "Common Compute stays out of the way while you are working." },
            { title: "Pause anytime", body: "Stop compute sharing immediately from the app." },
            { title: "Set CPU limits", body: "Keep the Mac responsive with explicit caps." },
            { title: "Require power connection", body: "Protect battery life and thermal headroom." },
          ].map((item) => (
            <article key={item.title} className="stack-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <p className="section-footnote" style={{ marginTop: 16 }}>Your machine stays yours.</p>
      </section>

      {/* Earnings model */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">Earnings model</span>
          <h2>Providers earn when tasks complete successfully.</h2>
        </div>
        <div className="trust-grid">
          {[
            { title: "Tasks complete successfully", body: "Payout starts with real completed work." },
            { title: "Results pass verification", body: "Every task is verified before payout." },
            { title: "Jobs upload correctly", body: "Earnings update in real time once output lands correctly." },
          ].map((item) => (
            <article key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">Security</span>
          <h2>
            The Common Compute app is signed, notarized, runs approved
            workloads, and never accesses personal files.
          </h2>
        </div>
        <div className="copy-grid">
          {[
            { title: "Signed", body: "Direct distribution uses Developer ID signing." },
            { title: "Notarized", body: "Apple notarization helps Gatekeeper verify the app on first launch." },
            { title: "Approved workloads only", body: "Only expected job types run inside the execution environment." },
            { title: "No personal files", body: "Jobs do not get access to personal documents." },
          ].map((item) => (
            <article key={item.title} className="stack-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container section final-cta">
        <div className="final-cta-panel">
          <div>
            <span className="eyebrow subtle">Get started</span>
            <h2>Start earning with your Mac.</h2>
          </div>
          <div className="cta-triad hero-actions">
            <Link href="/providers" className="button secondary">
              Start earning with your Mac
            </Link>
            <Link href="/download" className="button">
              Download now
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
