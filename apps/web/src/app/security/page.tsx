import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security",
  description: "Security and verification built into every job.",
};

export default function SecurityPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="container page-hero-inner">
          <span className="eyebrow subtle">Security</span>
          <h1>Security and verification built into every job.</h1>
          <p className="lede">
            Provider controls, execution verification, and runtime limits are
            built into the platform from the start.
          </p>
          <div className="hero-actions" style={{ marginTop: 24 }}>
            <Link href="/docs" className="button">
              Read documentation
            </Link>
            <Link href="/download" className="button secondary">
              Download app
            </Link>
          </div>
        </div>
      </section>

      {/* Provider safety */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">Provider safety</span>
          <h2>Providers control the runtime.</h2>
        </div>
        <div className="copy-grid">
          {[
            { title: "Runtime schedule", body: "Providers decide when Common Compute can run." },
            { title: "CPU usage", body: "Explicit caps keep the Mac responsive." },
            { title: "Memory usage", body: "Providers control how much memory the app may use." },
            { title: "Network usage", body: "Execution stays inside approved limits." },
          ].map((item) => (
            <article key={item.title} className="stack-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <p className="section-footnote" style={{ marginTop: 16 }}>
          Tasks run only inside approved execution environments.
        </p>
      </section>

      {/* Customer safety */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">Customer safety</span>
          <h2>Jobs include verification checks and fallback routing.</h2>
        </div>
        <div className="trust-grid">
          {[
            { title: "Verification checks", body: "Results are validated before completion." },
            { title: "Retry routing", body: "Failed work can move to another provider." },
            { title: "Re-execution fallback", body: "Work can be rerun if verification fails." },
            { title: "Completion tracking", body: "Customers can see what finished and when." },
          ].map((item) => (
            <article key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Platform safety */}
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow subtle">Platform safety</span>
          <h2>
            Common Compute prevents unauthorized workloads, persistent
            background execution outside limits, and access to personal files.
          </h2>
        </div>
        <div className="copy-grid">
          {[
            { title: "Approved workloads only", body: "Execution is limited to expected job types." },
            { title: "No persistent background execution outside limits", body: "The app stops when the provider says it should stop." },
            { title: "No access to personal files", body: "The platform does not inspect user documents." },
          ].map((item) => (
            <article key={item.title} className="stack-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <div className="hero-actions" style={{ marginTop: 24 }}>
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
      </section>
    </>
  );
}
