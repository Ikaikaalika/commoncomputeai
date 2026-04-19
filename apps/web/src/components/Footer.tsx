import Link from "next/link";
import NetworkLogo from "./NetworkLogo";
import Wordmark from "./Wordmark";
import { NT, N_link } from "./tokens";

const COLUMNS: Array<[string, Array<[string, string]>]> = [
  ["Product", [["Network", "/"], ["Developers", "/developers"], ["Pricing", "/pricing"], ["Status", "/status"]]],
  ["Build", [["SDK docs", "/docs"], ["API reference", "/docs/first-job"], ["Examples", "/developers"], ["Changelog", "/blog"]]],
  ["Earn", [["Download Mac app", "/providers"], ["Provider guide", "/docs/provider-install"], ["Payouts", "/docs/provider-payouts"], ["Requirements", "/providers"]]],
  ["Company", [["About", "/about"], ["Blog", "/blog"], ["Security", "/security"], ["Contact", "/support"]]],
];

export default function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${NT.line}`, background: NT.bg }}>
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "56px 32px 28px",
          fontFamily: NT.display,
          display: "grid",
          gridTemplateColumns: "1.4fr repeat(4, 1fr)",
          gap: 40,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <NetworkLogo size={24} />
            <Wordmark size={15} color={NT.text} />
          </div>
          <p style={{ fontSize: 12.5, color: NT.text3, lineHeight: 1.55, margin: "14px 0 0", maxWidth: 260 }}>
            A distributed network for batch AI workloads. Cheaper than hyperscalers. Deterministic per-task pricing.
          </p>
        </div>
        {COLUMNS.map(([title, links]) => (
          <div key={title}>
            <div
              style={{
                fontFamily: NT.mono,
                fontSize: 10.5,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: NT.text3,
                marginBottom: 14,
              }}
            >
              {title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {links.map(([label, href]) => (
                <Link key={label} href={href} style={N_link({ fontSize: 13 })}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 32px 28px",
          fontFamily: NT.mono,
          fontSize: 11,
          color: NT.text4,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>© {new Date().getFullYear()} Common Compute, Inc.</div>
        <div>Built on idle Apple Silicon.</div>
      </div>
    </footer>
  );
}
