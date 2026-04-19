"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NetworkLogo from "./NetworkLogo";
import Wordmark from "./Wordmark";
import { NT, N_link, N_btnPrimary } from "./tokens";

const NAV_ITEMS = [
  { label: "Network", href: "/" },
  { label: "Developers", href: "/developers" },
  { label: "Providers", href: "/providers" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        borderBottom: `1px solid ${NT.line}`,
        background: "rgba(10,12,16,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          gap: 32,
          fontFamily: NT.display,
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
          aria-label="Common Compute home"
        >
          <NetworkLogo size={26} />
          <Wordmark size={17} color={NT.text} />
        </Link>
        <nav style={{ flex: 1, display: "flex", gap: 26 }} aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isCurrent =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                style={N_link({ color: isCurrent ? NT.text : NT.text2, fontWeight: isCurrent ? 500 : 400 })}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/developers" style={N_link()}>Log in</Link>
          <Link href="/developers" style={N_btnPrimary()}>Get started</Link>
        </div>
      </div>
    </div>
  );
}
