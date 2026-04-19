import Image from "next/image";
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
          <div className="footer-brand-lockup">
            <Image
              src="/brand/common-compute-symbol.svg"
              alt=""
              aria-hidden="true"
              className="footer-brand-mark"
              width={44}
              height={44}
            />
            <Image
              src="/brand/common-compute-wordmark.svg"
              alt="Common Compute"
              className="footer-brand-wordmark"
              width={236}
              height={52}
            />
          </div>
          <span className="eyebrow subtle">Common Compute</span>
          <h2>Batch AI at 80% less.</h2>
          <div className="cta-triad footer-actions">
            <Link href="/developers" className="button">Get started</Link>
            <Link href="/providers" className="button secondary">Start earning</Link>
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
