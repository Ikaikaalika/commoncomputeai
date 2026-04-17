"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/providers", label: "For Mac Owners" },
  { href: "/developers", label: "For Developers" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/docs", label: "Docs" },
  { href: "/download", label: "Download" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <>
      <div className="top-banner">
        <div className="container top-banner-inner">
          <span className="top-banner-pill">New</span>
          <span>Earn from your idle Mac — providers start receiving tasks in minutes.</span>
          <Link href="/providers" className="top-banner-link">Start earning →</Link>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-row">
          <Link href="/" className="brand" aria-label="Common Compute home">
            <div className="brand-mark" aria-hidden="true" />
            <div className="brand-copy">
              <strong>Common Compute</strong>
              <span>idle macs · useful compute</span>
            </div>
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={pathname === link.href ? "is-active" : ""}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="site-actions">
            <Link href="/developers" className="nav-login">Log in</Link>
            <Link href="/developers" className="button button-small">Get started</Link>
          </div>
        </div>
      </header>
    </>
  );
}
