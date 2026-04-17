import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/status", label: "Status" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/support", label: "Support" },
  { href: "/careers", label: "Careers" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <span className="eyebrow subtle">Common Compute</span>
          <h2>Practical distributed compute for batch AI workloads.</h2>
          <p>
            Common Compute is a distributed compute network powered by idle Macs
            — for embeddings, transcription, OCR, and dataset preprocessing.
          </p>
          <div className="cta-triad footer-actions">
            <Link href="/developers" className="button">Run a batch workload</Link>
            <Link href="/providers" className="button secondary">Start earning with your Mac</Link>
          </div>
        </div>

        <nav className="footer-links" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="container footer-meta">
        <span>© Common Compute</span>
        <span>All rights reserved</span>
      </div>
    </footer>
  );
}
